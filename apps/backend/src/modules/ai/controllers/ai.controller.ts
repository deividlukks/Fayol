import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { PredictCategoryDto } from '../dto/ai.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('predict-category')
  @ApiOperation({ summary: 'IA: Sugere uma categoria baseada na descrição' })
  predict(@CurrentUser() user: User, @Body() dto: PredictCategoryDto) {
    return this.aiService.predictCategory(user.id, dto.description);
  }
}
