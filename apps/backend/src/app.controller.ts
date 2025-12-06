import { Controller, Get } from '@nestjs/common';
import { APP_CONFIG } from '@fayol/shared-constants';
import { ApiOperation, ApiTags } from '@nestjs/swagger'; // <--- Importe aqui

@ApiTags('Health') // Cria uma seção "Health" no Swagger
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Verifica o status geral da API' }) // Descrição do endpoint
  getStatus() {
    return {
      service: APP_CONFIG.NAME,
      status: 'active',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Endpoint simples para monitoramento (liveness probe)' })
  getHealth() {
    return { status: 'ok' };
  }
}
