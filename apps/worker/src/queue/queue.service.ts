import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('test-queue') private testQueue: Queue,
  ) {}

  /**
   * Add a test job to verify queue connectivity
   */
  async addTestJob(data: { message: string }) {
    const job = await this.testQueue.add('test-job', data);
    this.logger.log(`Added test job: ${job.id}`);
    return job;
  }

  /**
   * Get queue health status
   */
  async getQueueHealth() {
    try {
      const isPaused = await this.testQueue.isPaused();
      const jobCounts = await this.testQueue.getJobCounts();
      
      return {
        status: 'connected',
        paused: isPaused,
        jobs: jobCounts,
      };
    } catch (error) {
      this.logger.error('Failed to get queue health:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}



