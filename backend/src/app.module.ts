import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { QueuesModule } from './queues/queues.module';
import { FriendsModule } from './friends/friends.module';
import { SavedModule } from './saved/saved.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GroupsModule } from './groups/groups.module';
import { StoriesModule } from './stories/stories.module';

import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),

    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
          try {
            const url = new URL(redisUrl);
            return {
              connection: {
                host: url.hostname,
                port: parseInt(url.port || '6379'),
                username: url.username || undefined,
                password: url.password || undefined,
                tls: redisUrl.startsWith('rediss://') ? {} : undefined,
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
              },
            };
          } catch {
            // fallback below
          }
        }
        return {
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy: () => null,
          },
        };
      },
    }),

    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    PostsModule,
    AdminModule,
    QueuesModule,
    FriendsModule,
    SavedModule,
    MessagesModule,
    NotificationsModule,
    GroupsModule,
    StoriesModule,
  ],
})
export class AppModule {}
