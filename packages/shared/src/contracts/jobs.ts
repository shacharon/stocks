/**
 * Job & Pipeline Contracts
 */

import { PipelineStatus, JobStatus, JobType } from './enums';

// ============================================================================
// Pipeline Run
// ============================================================================

export interface PipelineRun {
  id: string;
  runDate: Date;
  status: PipelineStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  errorMessage?: string | null;
  metadata?: Record<string, any> | null;
}

export interface StartPipelineInput {
  date: Date;
  metadata?: Record<string, any>;
}

export interface PipelineRunSummary {
  runId: string;
  date: Date;
  status: PipelineStatus;
  jobsCompleted: number;
  jobsTotal: number;
  duration?: number;
  errors: string[];
}

// ============================================================================
// Job Run
// ============================================================================

export interface JobRun {
  id: string;
  pipelineRunId: string;
  jobType: JobType;
  status: JobStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  errorMessage?: string | null;
  inputData?: Record<string, any> | null;
  outputData?: Record<string, any> | null;
}

export interface StartJobInput {
  pipelineRunId: string;
  jobType: JobType;
  inputData?: Record<string, any>;
}

export interface CompleteJobInput {
  jobId: string;
  status: JobStatus;
  outputData?: Record<string, any>;
  errorMessage?: string;
}

// ============================================================================
// Job Queue
// ============================================================================

export interface JobQueueData {
  jobId: string;
  jobType: JobType;
  pipelineRunId: string;
  date: Date;
  symbols?: string[];
  retryCount?: number;
}

export interface JobProgress {
  current: number;
  total: number;
  percentage: number;
  message?: string;
}



