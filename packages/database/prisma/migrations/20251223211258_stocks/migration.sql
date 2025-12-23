-- CreateEnum
CREATE TYPE "Market" AS ENUM ('US', 'TASE');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('HOLD', 'MOVE_STOP', 'REDUCE', 'EXIT');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('MARKET_SYNC', 'FEATURE_FACTORY', 'SECTOR_SELECTOR', 'CHANGE_DETECTOR', 'DEEP_DIVE');

-- CreateTable
CREATE TABLE "portfolios" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_positions" (
    "id" UUID NOT NULL,
    "portfolio_id" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "market" "Market" NOT NULL,
    "buy_price" DECIMAL(12,4) NOT NULL,
    "quantity" DECIMAL(12,4),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "portfolio_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbol_universe" (
    "id" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "market" "Market" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "symbol_universe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbol_sector_map" (
    "id" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "sector" VARCHAR(100) NOT NULL,
    "industry" VARCHAR(100),
    "last_updated" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "symbol_sector_map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_runs" (
    "id" UUID NOT NULL,
    "run_date" DATE NOT NULL,
    "status" "PipelineStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_runs" (
    "id" UUID NOT NULL,
    "pipeline_run_id" UUID NOT NULL,
    "job_type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "input_data" JSONB,
    "output_data" JSONB,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_daily_bars" (
    "id" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "market" "Market" NOT NULL,
    "date" DATE NOT NULL,
    "open" DECIMAL(12,4) NOT NULL,
    "high" DECIMAL(12,4) NOT NULL,
    "low" DECIMAL(12,4) NOT NULL,
    "close" DECIMAL(12,4) NOT NULL,
    "volume" BIGINT NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_daily_bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_symbol_features" (
    "id" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "market" "Market" NOT NULL,
    "date" DATE NOT NULL,
    "close_price" DECIMAL(12,4) NOT NULL,
    "sma_20" DECIMAL(12,4),
    "sma_50" DECIMAL(12,4),
    "rsi_14" DECIMAL(8,4),
    "atr_14" DECIMAL(12,4),
    "volume_avg_20" BIGINT,
    "support_levels" JSONB,
    "resistance_levels" JSONB,
    "trend" VARCHAR(20),
    "volatility_state" VARCHAR(20),
    "engine_version" VARCHAR(20) NOT NULL,
    "confidence" DECIMAL(4,3),
    "reasons" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_symbol_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_daily_decisions" (
    "id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "buy_price" DECIMAL(12,4) NOT NULL,
    "current_price" DECIMAL(12,4) NOT NULL,
    "suggested_stop" DECIMAL(12,4) NOT NULL,
    "prev_stop" DECIMAL(12,4),
    "stop_distance_pct" DECIMAL(6,3),
    "action" "Action" NOT NULL,
    "action_confidence" DECIMAL(4,3),
    "action_reasons" JSONB,
    "feature_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_daily_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_rules_state" (
    "id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "current_stop" DECIMAL(12,4) NOT NULL,
    "last_moved_at" DATE NOT NULL,
    "history" JSONB,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stop_rules_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_sector_lists" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "sector" VARCHAR(100) NOT NULL,
    "symbol_list" JSONB NOT NULL,
    "ranking_criteria" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_sector_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deep_dive_reports" (
    "id" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "market" "Market" NOT NULL,
    "date" DATE NOT NULL,
    "report_data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deep_dive_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_deltas" (
    "id" UUID NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "market" "Market" NOT NULL,
    "date" DATE NOT NULL,
    "change_type" VARCHAR(50) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "materiality_score" DECIMAL(4,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_deltas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolio_positions_portfolio_id_idx" ON "portfolio_positions"("portfolio_id");

-- CreateIndex
CREATE INDEX "portfolio_positions_symbol_market_idx" ON "portfolio_positions"("symbol", "market");

-- CreateIndex
CREATE INDEX "symbol_universe_is_active_idx" ON "symbol_universe"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "symbol_universe_symbol_market_key" ON "symbol_universe"("symbol", "market");

-- CreateIndex
CREATE UNIQUE INDEX "symbol_sector_map_symbol_key" ON "symbol_sector_map"("symbol");

-- CreateIndex
CREATE INDEX "symbol_sector_map_sector_idx" ON "symbol_sector_map"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_runs_run_date_key" ON "pipeline_runs"("run_date");

-- CreateIndex
CREATE INDEX "pipeline_runs_run_date_status_idx" ON "pipeline_runs"("run_date", "status");

-- CreateIndex
CREATE INDEX "job_runs_pipeline_run_id_idx" ON "job_runs"("pipeline_run_id");

-- CreateIndex
CREATE INDEX "job_runs_job_type_status_idx" ON "job_runs"("job_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "job_runs_pipeline_run_id_job_type_key" ON "job_runs"("pipeline_run_id", "job_type");

-- CreateIndex
CREATE INDEX "market_daily_bars_symbol_market_date_idx" ON "market_daily_bars"("symbol", "market", "date" DESC);

-- CreateIndex
CREATE INDEX "market_daily_bars_date_idx" ON "market_daily_bars"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "market_daily_bars_symbol_market_date_key" ON "market_daily_bars"("symbol", "market", "date");

-- CreateIndex
CREATE INDEX "daily_symbol_features_symbol_market_date_idx" ON "daily_symbol_features"("symbol", "market", "date" DESC);

-- CreateIndex
CREATE INDEX "daily_symbol_features_date_idx" ON "daily_symbol_features"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_symbol_features_symbol_market_date_key" ON "daily_symbol_features"("symbol", "market", "date");

-- CreateIndex
CREATE INDEX "portfolio_daily_decisions_position_id_date_idx" ON "portfolio_daily_decisions"("position_id", "date" DESC);

-- CreateIndex
CREATE INDEX "portfolio_daily_decisions_date_idx" ON "portfolio_daily_decisions"("date" DESC);

-- CreateIndex
CREATE INDEX "portfolio_daily_decisions_action_idx" ON "portfolio_daily_decisions"("action");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_daily_decisions_position_id_date_key" ON "portfolio_daily_decisions"("position_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "stop_rules_state_position_id_key" ON "stop_rules_state"("position_id");

-- CreateIndex
CREATE INDEX "stop_rules_state_position_id_idx" ON "stop_rules_state"("position_id");

-- CreateIndex
CREATE INDEX "daily_sector_lists_date_idx" ON "daily_sector_lists"("date" DESC);

-- CreateIndex
CREATE INDEX "daily_sector_lists_sector_idx" ON "daily_sector_lists"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "daily_sector_lists_date_sector_key" ON "daily_sector_lists"("date", "sector");

-- CreateIndex
CREATE INDEX "deep_dive_reports_symbol_market_date_idx" ON "deep_dive_reports"("symbol", "market", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "deep_dive_reports_symbol_market_date_key" ON "deep_dive_reports"("symbol", "market", "date");

-- CreateIndex
CREATE INDEX "daily_deltas_date_materiality_score_idx" ON "daily_deltas"("date" DESC, "materiality_score" DESC);

-- CreateIndex
CREATE INDEX "daily_deltas_symbol_market_idx" ON "daily_deltas"("symbol", "market");

-- CreateIndex
CREATE UNIQUE INDEX "daily_deltas_symbol_market_date_change_type_key" ON "daily_deltas"("symbol", "market", "date", "change_type");

-- AddForeignKey
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_pipeline_run_id_fkey" FOREIGN KEY ("pipeline_run_id") REFERENCES "pipeline_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_daily_decisions" ADD CONSTRAINT "portfolio_daily_decisions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "portfolio_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_daily_decisions" ADD CONSTRAINT "portfolio_daily_decisions_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "daily_symbol_features"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_rules_state" ADD CONSTRAINT "stop_rules_state_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "portfolio_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
