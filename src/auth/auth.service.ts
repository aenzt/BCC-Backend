import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import * as puppeteer from 'puppeteer';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { loginUserDto } from 'src/users/dto/loginUser.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async validateUser(nim : number, password : string): Promise<any> {
    const user = await this.usersService.findOne(nim);
    if (await user.validatePassword(password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto : loginUserDto) {
    const user = await this.validateUser(loginDto.nim, loginDto.password);
    if (!user) {
      throw new HttpException('NIM / Password is incorrect', HttpStatus.UNAUTHORIZED);
    }
    const payload = { sub: user.nim, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private async checkSiam(username:string, password:string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://siam.ub.ac.id/', { waitUntil: 'networkidle2' });

    const usernameField = await page.$('input[name="username"]');
    await usernameField.type(username);

    const passwordField = await page.$('input[name="password"]');
    await passwordField.type(password);

    await Promise.all([
      page.waitForNavigation(), // The promise resolves after navigation has finished
      page.click('input[type="submit"]'),
    ]);

    const error = await page.$('small.error-code');
    if (error) {
      throw new HttpException(
        'NIM atau Password SIAM salah',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data = await page.$$eval('div.bio-info div', (elements) =>
      elements.map((item) => item.textContent),
    );
    await browser.close();

    const fullName = data[1];
    const faculty = data[2].substring(19);
    const major = data[4].substring(13);

    return [fullName, faculty, major];
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new User();
    const find = await this.usersRepository.findOne(createUserDto);

    if (find) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    user.nim = createUserDto.nim;
    user.email = createUserDto.email;
    user.password = createUserDto.password;

    const [fullName, faculty, major] = await this.checkSiam(createUserDto.nim.toString(), createUserDto.password);
    user.fullName = fullName;
    user.faculty = faculty;
    user.major = major;

    return this.usersRepository.save(user);
  }

}