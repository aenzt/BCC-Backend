import {
  Controller,
  UseGuards,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { hasRoles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ErrorResponseDTO } from '../responseDto/errorResponse.dto';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  type: ErrorResponseDTO,
})
@ApiBadRequestResponse({ description: 'Bad Request', type: ErrorResponseDTO })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one categories by ID' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Create categories' })
  @hasRoles('instructor', 'admin')
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit one categories by ID' })
  @hasRoles('instructor', 'admin')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one categories by ID' })
  @hasRoles('instructor', 'admin')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
