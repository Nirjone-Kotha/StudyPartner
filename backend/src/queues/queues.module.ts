import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueuesService } from './queues.service';
import { NotificationsProcessor, MediaProcessor } from './queues.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'media-processing' },
    ),
  ],
  providers: [QueuesService, NotificationsProcessor, MediaProcessor],
  exports: [QueuesService],
})
export class QueuesModule {}
