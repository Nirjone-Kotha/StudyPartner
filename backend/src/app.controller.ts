import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'Study Partner API is live! 🚀',
      docs: '/api/docs',
      timestamp: new Date().toISOString(),
    };
  }
}
