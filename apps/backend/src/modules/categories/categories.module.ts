import { Module } from '@nestjs/common';
import { CategoriesService } from './services/categories.service'; // Ajustado
import { CategoriesController } from './controllers/categories.controller'; // Ajustado

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
