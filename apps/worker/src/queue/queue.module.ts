import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TestQueueProcessor } from './test-queue.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    // Register test queue for smoke test
    BullModule.registerQueue({
      name: 'test-queue',
    }),
  ],
  providers: [TestQueueProcessor, QueueService],
  exports: [QueueService],
})
export class QueueModule {}



