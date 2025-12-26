import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineStatus, JobStatus, JobType } from '@stocks/shared';

/**
 * Pipeline Tracking Service
 * Manages pipeline_runs and job_runs for idempotency and audit trails
 */
@Injectable()
export class PipelineTrackingService {
  private readonly logger = new Logger(PipelineTrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new pipeline run
   */
  async createPipelineRun(date: Date, portfolioId?: string): Promise<any> {
    this.logger.log(`Creating pipeline run for ${date.toISOString().split('T')[0]}`);

    const run = await this.prisma.pipelineRun.create({
      data: {
        runDate: date,
        status: 'PENDING' as PipelineStatus,
      },
    });

    this.logger.log(`Pipeline run created: ${run.id}`);
    return run;
  }

  /**
   * Update pipeline run status
   */
  async updatePipelineStatus(runId: string, status: PipelineStatus, error?: string): Promise<any> {
    this.logger.log(`Updating pipeline ${runId} status to ${status}`);

    const run = await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status,
        ...(status === 'RUNNING' && { startedAt: new Date() }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status === 'FAILED' && { completedAt: new Date(), errorMessage: error }),
      },
    });

    return run;
  }

  /**
   * Create a job run
   */
  async createJobRun(pipelineRunId: string, jobType: JobType, params?: any): Promise<any> {
    this.logger.log(`Creating job run: ${jobType} for pipeline ${pipelineRunId}`);

    const job = await this.prisma.jobRun.create({
      data: {
        pipelineRunId,
        jobType,
        status: 'PENDING' as JobStatus,
      },
    });

    this.logger.log(`Job run created: ${job.id}`);
    return job;
  }

  /**
   * Update job run status
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: any,
    error?: string,
  ): Promise<any> {
    this.logger.log(`Updating job ${jobId} status to ${status}`);

    const job = await this.prisma.jobRun.update({
      where: { id: jobId },
      data: {
        status,
        ...(status === 'RUNNING' && { startedAt: new Date() }),
        ...(status === 'COMPLETED' && {
          completedAt: new Date(),
        }),
        ...(status === 'FAILED' && {
          completedAt: new Date(),
          errorMessage: error,
        }),
      },
    });

    return job;
  }

  /**
   * Get pipeline run by ID
   */
  async getPipelineRun(runId: string): Promise<any> {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: {
        jobRuns: {
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Pipeline run ${runId} not found`);
    }

    return run;
  }

  /**
   * Get all pipeline runs with optional filtering
   */
  async getPipelineRuns(
    date?: Date,
    portfolioId?: string,
    status?: PipelineStatus,
    limit: number = 50,
  ): Promise<any> {
    this.logger.log(`Fetching pipeline runs - date: ${date}, status: ${status}, limit: ${limit}`);

    const runs = await this.prisma.pipelineRun.findMany({
      where: {
        ...(date && { runDate: date }),
        ...(status && { status }),
      },
      include: {
        _count: {
          select: { jobRuns: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    this.logger.log(`Found ${runs.length} pipeline runs`);
    return runs;
  }

  /**
   * Get job runs for a pipeline
   */
  async getJobRuns(pipelineRunId: string): Promise<any> {
    const jobs = await this.prisma.jobRun.findMany({
      where: { pipelineRunId },
      orderBy: { startedAt: 'asc' },
    });

    return jobs;
  }

  /**
   * Check if pipeline already ran for a date
   */
  async hasPipelineRunForDate(date: Date, portfolioId?: string): Promise<boolean> {
    const count = await this.prisma.pipelineRun.count({
      where: {
        runDate: date,
        status: 'COMPLETED' as PipelineStatus,
      },
    });

    return count > 0;
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStats(): Promise<any> {
    const [total, byStatus, recentRuns] = await Promise.all([
      this.prisma.pipelineRun.count(),
      this.prisma.pipelineRun.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.pipelineRun.findMany({
        take: 10,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          runDate: true,
          status: true,
          startedAt: true,
          _count: {
            select: { jobRuns: true },
          },
        },
      }),
    ]);

    return {
      totalRuns: total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentRuns,
    };
  }
}

