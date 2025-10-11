import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHello(): object {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Detailed health check' })
  healthCheck(): object {
    return this.appService.healthCheck();
  }
}
