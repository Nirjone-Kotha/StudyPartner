import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface NotificationJob {
  type: 'POLL_VOTE' | 'NEW_COMMENT' | 'NEW_REACTION' | 'NEW_POST';
  postId?: string;
  userId?: string;
  data?: Record<string, any>;
}

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('media-processing') private mediaQueue: Queue,
  ) {}

  async addNotificationJob(job: NotificationJob) {
    await this.notificationsQueue.add(job.type, job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async addMediaProcessingJob(data: { postId: string; mediaUrl: string; mediaType: string }) {
    await this.mediaQueue.add('process', data, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 2000 },
    });
  }
}
