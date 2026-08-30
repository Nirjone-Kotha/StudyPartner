import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationJob } from './queues.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<NotificationJob>): Promise<any> {
    this.logger.log(`Processing notification job [${job.name}] for post ${job.data.postId}`);
    switch (job.name) {
      case 'POLL_VOTE':
      case 'NEW_COMMENT':
      case 'NEW_REACTION':
        // In production: push notification, email, or in-app notification
        await new Promise((r) => setTimeout(r, 100));
        return { processed: true };
      default:
        return { skipped: true };
    }
  }
}

@Processor('media-processing')
export class MediaProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaProcessor.name);

  async process(job: Job<{ postId: string; mediaUrl: string; mediaType: string }>): Promise<any> {
    this.logger.log(`Processing media for post ${job.data.postId}`);
    // In production: generate thumbnails, transcode video, content moderation
    await new Promise((r) => setTimeout(r, 200));
    return { processed: true };
  }
}
