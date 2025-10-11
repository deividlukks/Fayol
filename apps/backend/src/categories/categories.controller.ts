import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar categoria personalizada' })
  create(@CurrentUser() user: any, @Body() createCategoryDto: any) {
    return this.categoriesService.create(user.id, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias (sistema + personalizadas)' })
  findAll(@CurrentUser() user: any) {
    return this.categoriesService.findAll(user.id);
  }

  @Get('tree/hierarchy')
  @ApiOperation({ summary: 'Listar categorias em formato de árvore hierárquica' })
  findAllTree(@CurrentUser() user: any) {
    return this.categoriesService.findAllTree(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoriesService.findOne(id, user.id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Buscar categoria com toda a árvore de filhos' })
  findWithChildren(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoriesService.findCategoryWithChildren(id, user.id);
  }

  @Get(':id/path')
  @ApiOperation({ summary: 'Buscar caminho completo da categoria até a raiz' })
  getCategoryPath(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoriesService.getCategoryPath(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria (apenas personalizadas)' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() updateCategoryDto: any) {
    return this.categoriesService.update(id, user.id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover categoria (apenas personalizadas)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoriesService.remove(id, user.id);
  }

  // Subcategorias
  @Post('subcategories')
  @ApiOperation({ summary: 'Criar subcategoria' })
  createSubcategory(@CurrentUser() user: any, @Body() createSubcategoryDto: any) {
    return this.categoriesService.createSubcategory(user.id, createSubcategoryDto);
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Listar subcategorias de uma categoria' })
  findSubcategories(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoriesService.findSubcategories(id, user.id);
  }

  @Patch('subcategories/:id')
  @ApiOperation({ summary: 'Atualizar subcategoria' })
  updateSubcategory(@Param('id') id: string, @CurrentUser() user: any, @Body() updateData: any) {
    return this.categoriesService.updateSubcategory(id, user.id, updateData);
  }

  @Delete('subcategories/:id')
  @ApiOperation({ summary: 'Remover subcategoria' })
  removeSubcategory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoriesService.removeSubcategory(id, user.id);
  }
}
