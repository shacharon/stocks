import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('test-queue')
export class TestQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(TestQueueProcessor.name);

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing test job: ${job.id}`);
    this.logger.log(`Job data: ${JSON.stringify(job.data)}`);

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(`Completed test job: ${job.id}`);
    
    return {
      processed: true,
      jobId: job.id,
      message: job.data.message,
      processedAt: new Date().toISOString(),
    };
  }
}


