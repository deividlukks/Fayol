import { Controller, Get, Res } from '@nestjs/common';
import { register } from 'prom-client';
import type { Response } from 'express';

@Controller()
export class MetricsController {
  @Get('metrics')
  async metrics(@Res() res: Response) {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
