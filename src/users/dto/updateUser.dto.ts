import { PartialType } from "@nestjs/swagger";
import { CreateUserDto } from "src/auth/dto/createUser.dto";

export class UpdateUserDto extends PartialType(CreateUserDto){
    
}