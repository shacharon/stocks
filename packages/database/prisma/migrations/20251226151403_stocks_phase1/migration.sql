/*
  Warnings:

  - You are about to drop the column `change_type` on the `daily_deltas` table. All the data in the column will be lost.
  - You are about to drop the column `materiality_score` on the `daily_deltas` table. All the data in the column will be lost.
  - You are about to drop the column `new_value` on the `daily_deltas` table. All the data in the column will be lost.
  - You are about to drop the column `old_value` on the `daily_deltas` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `daily_deltas` table. All the data in the column will be lost.
  - You are about to drop the column `ranking_criteria` on the `daily_sector_lists` table. All the data in the column will be lost.
  - You are about to drop the column `symbol_list` on the `daily_sector_lists` table. All the data in the column will be lost.
  - You are about to drop the column `action` on the `portfolio_daily_decisions` table. All the data in the column will be lost.
  - You are about to drop the column `action_confidence` on the `portfolio_daily_decisions` table. All the data in the column will be lost.
  - You are about to drop the column `action_reasons` on the `portfolio_daily_decisions` table. All the data in the column will be lost.
  - You are about to drop the column `feature_id` on the `portfolio_daily_decisions` table. All the data in the column will be lost.
  - You are about to drop the column `position_id` on the `portfolio_daily_decisions` table. All the data in the column will be lost.
  - You are about to drop the column `prev_stop` on the `portfolio_daily_decisions` table. All the data in the column will be lost.
  - You are about to drop the column `stop_distance_pct` on the `portfolio_daily_decisions` table. All the data in the column will be lost.
  - You are about to drop the column `market` on the `portfolio_positions` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `portfolio_positions` table. All the data in the column will be lost.
  - You are about to drop the column `current_stop` on the `stop_rules_state` table. All the data in the column will be lost.
  - You are about to drop the column `history` on the `stop_rules_state` table. All the data in the column will be lost.
  - You are about to drop the column `last_moved_at` on the `stop_rules_state` table. All the data in the column will be lost.
  - You are about to drop the column `position_id` on the `stop_rules_state` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `symbol_sector_map` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[date,portfolio_id]` on the table `daily_deltas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[date,market,sector]` on the table `daily_sector_lists` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[portfolio_id,symbol_id,date]` on the table `portfolio_daily_decisions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[portfolio_id,symbol_id]` on the table `stop_rules_state` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[symbol_id]` on the table `symbol_sector_map` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `new_activity` to the `daily_deltas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_changes` to the `daily_deltas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signal_changes` to the `daily_deltas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stop_loss_changes` to the `daily_deltas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `daily_deltas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `market` to the `daily_sector_lists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metrics` to the `daily_sector_lists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rank` to the `daily_sector_lists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `daily_sector_lists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol_count` to the `daily_sector_lists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidence` to the `deep_dive_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signal` to the `deep_dive_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidence` to the `portfolio_daily_decisions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `market` to the `portfolio_daily_decisions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `portfolio_id` to the `portfolio_daily_decisions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reasons` to the `portfolio_daily_decisions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signal` to the `portfolio_daily_decisions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol_id` to the `portfolio_daily_decisions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol_id` to the `portfolio_positions` table without a default value. This is not possible if the table is not empty.
  - Made the column `quantity` on table `portfolio_positions` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `atr_multiplier` to the `stop_rules_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_stop_loss` to the `stop_rules_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initial_stop_loss` to the `stop_rules_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_updated_date` to the `stop_rules_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `portfolio_id` to the `stop_rules_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stop_loss_type` to the `stop_rules_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol_id` to the `stop_rules_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol_id` to the `symbol_sector_map` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "portfolio_daily_decisions" DROP CONSTRAINT "portfolio_daily_decisions_feature_id_fkey";

-- DropForeignKey
ALTER TABLE "portfolio_daily_decisions" DROP CONSTRAINT "portfolio_daily_decisions_position_id_fkey";

-- DropForeignKey
ALTER TABLE "stop_rules_state" DROP CONSTRAINT "stop_rules_state_position_id_fkey";

-- DropIndex
DROP INDEX "daily_deltas_date_materiality_score_idx";

-- DropIndex
DROP INDEX "daily_deltas_symbol_market_date_change_type_key";

-- DropIndex
DROP INDEX "daily_deltas_symbol_market_idx";

-- DropIndex
DROP INDEX "daily_sector_lists_date_sector_key";

-- DropIndex
DROP INDEX "daily_sector_lists_sector_idx";

-- DropIndex
DROP INDEX "portfolio_daily_decisions_action_idx";

-- DropIndex
DROP INDEX "portfolio_daily_decisions_position_id_date_idx";

-- DropIndex
DROP INDEX "portfolio_daily_decisions_position_id_date_key";

-- DropIndex
DROP INDEX "portfolio_positions_symbol_market_idx";

-- DropIndex
DROP INDEX "stop_rules_state_position_id_idx";

-- DropIndex
DROP INDEX "stop_rules_state_position_id_key";

-- DropIndex
DROP INDEX "symbol_sector_map_symbol_key";

-- AlterTable
ALTER TABLE "daily_deltas" DROP COLUMN "change_type",
DROP COLUMN "materiality_score",
DROP COLUMN "new_value",
DROP COLUMN "old_value",
DROP COLUMN "symbol",
ADD COLUMN     "new_activity" JSONB NOT NULL,
ADD COLUMN     "portfolio_id" UUID,
ADD COLUMN     "price_changes" JSONB NOT NULL,
ADD COLUMN     "signal_changes" JSONB NOT NULL,
ADD COLUMN     "stop_loss_changes" JSONB NOT NULL,
ADD COLUMN     "summary" TEXT NOT NULL,
ALTER COLUMN "market" DROP NOT NULL;

-- AlterTable
ALTER TABLE "daily_sector_lists" DROP COLUMN "ranking_criteria",
DROP COLUMN "symbol_list",
ADD COLUMN     "market" "Market" NOT NULL,
ADD COLUMN     "metrics" JSONB NOT NULL,
ADD COLUMN     "rank" INTEGER NOT NULL,
ADD COLUMN     "score" DECIMAL(8,4) NOT NULL,
ADD COLUMN     "symbol_count" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "daily_symbol_features" ADD COLUMN     "bb_lower" DECIMAL(12,4),
ADD COLUMN     "bb_middle" DECIMAL(12,4),
ADD COLUMN     "bb_upper" DECIMAL(12,4),
ADD COLUMN     "ema_12" DECIMAL(12,4),
ADD COLUMN     "ema_26" DECIMAL(12,4),
ADD COLUMN     "macd" DECIMAL(12,4),
ADD COLUMN     "macd_histogram" DECIMAL(12,4),
ADD COLUMN     "macd_signal" DECIMAL(12,4),
ADD COLUMN     "sma_200" DECIMAL(12,4),
ADD COLUMN     "volume" BIGINT,
ADD COLUMN     "volume_ratio" DECIMAL(8,4),
ADD COLUMN     "volume_sma_20" BIGINT,
ALTER COLUMN "engine_version" SET DEFAULT '1.0.0';

-- AlterTable
ALTER TABLE "deep_dive_reports" ADD COLUMN     "confidence" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "signal" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "portfolio_daily_decisions" DROP COLUMN "action",
DROP COLUMN "action_confidence",
DROP COLUMN "action_reasons",
DROP COLUMN "feature_id",
DROP COLUMN "position_id",
DROP COLUMN "prev_stop",
DROP COLUMN "stop_distance_pct",
ADD COLUMN     "confidence" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "market" "Market" NOT NULL,
ADD COLUMN     "portfolio_id" UUID NOT NULL,
ADD COLUMN     "reasons" JSONB NOT NULL,
ADD COLUMN     "signal" VARCHAR(20) NOT NULL,
ADD COLUMN     "symbol_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "portfolio_positions" DROP COLUMN "market",
DROP COLUMN "symbol",
ADD COLUMN     "symbol_id" UUID NOT NULL,
ALTER COLUMN "quantity" SET NOT NULL;

-- AlterTable
ALTER TABLE "portfolios" ADD COLUMN     "currency" VARCHAR(10) NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "stop_rules_state" DROP COLUMN "current_stop",
DROP COLUMN "history",
DROP COLUMN "last_moved_at",
DROP COLUMN "position_id",
ADD COLUMN     "atr_multiplier" DECIMAL(6,2) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "current_stop_loss" DECIMAL(12,4) NOT NULL,
ADD COLUMN     "initial_stop_loss" DECIMAL(12,4) NOT NULL,
ADD COLUMN     "last_updated_date" DATE NOT NULL,
ADD COLUMN     "portfolio_id" UUID NOT NULL,
ADD COLUMN     "stop_loss_type" VARCHAR(50) NOT NULL,
ADD COLUMN     "symbol_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "symbol_sector_map" DROP COLUMN "symbol",
ADD COLUMN     "symbol_id" UUID NOT NULL;

-- DropEnum
DROP TYPE "Action";

-- CreateIndex
CREATE INDEX "daily_deltas_date_idx" ON "daily_deltas"("date" DESC);

-- CreateIndex
CREATE INDEX "daily_deltas_portfolio_id_idx" ON "daily_deltas"("portfolio_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_deltas_date_portfolio_id_key" ON "daily_deltas"("date", "portfolio_id");

-- CreateIndex
CREATE INDEX "daily_sector_lists_market_date_idx" ON "daily_sector_lists"("market", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_sector_lists_date_market_sector_key" ON "daily_sector_lists"("date", "market", "sector");

-- CreateIndex
CREATE INDEX "deep_dive_reports_signal_idx" ON "deep_dive_reports"("signal");

-- CreateIndex
CREATE INDEX "deep_dive_reports_date_idx" ON "deep_dive_reports"("date" DESC);

-- CreateIndex
CREATE INDEX "portfolio_daily_decisions_portfolio_id_date_idx" ON "portfolio_daily_decisions"("portfolio_id", "date" DESC);

-- CreateIndex
CREATE INDEX "portfolio_daily_decisions_signal_idx" ON "portfolio_daily_decisions"("signal");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_daily_decisions_portfolio_id_symbol_id_date_key" ON "portfolio_daily_decisions"("portfolio_id", "symbol_id", "date");

-- CreateIndex
CREATE INDEX "portfolio_positions_symbol_id_idx" ON "portfolio_positions"("symbol_id");

-- CreateIndex
CREATE INDEX "stop_rules_state_portfolio_id_idx" ON "stop_rules_state"("portfolio_id");

-- CreateIndex
CREATE INDEX "stop_rules_state_symbol_id_idx" ON "stop_rules_state"("symbol_id");

-- CreateIndex
CREATE UNIQUE INDEX "stop_rules_state_portfolio_id_symbol_id_key" ON "stop_rules_state"("portfolio_id", "symbol_id");

-- CreateIndex
CREATE UNIQUE INDEX "symbol_sector_map_symbol_id_key" ON "symbol_sector_map"("symbol_id");

-- AddForeignKey
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbol_universe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbol_sector_map" ADD CONSTRAINT "symbol_sector_map_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbol_universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_daily_decisions" ADD CONSTRAINT "portfolio_daily_decisions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_rules_state" ADD CONSTRAINT "stop_rules_state_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_rules_state" ADD CONSTRAINT "stop_rules_state_symbol_id_fkey" FOREIGN KEY ("symbol_id") REFERENCES "symbol_universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_deltas" ADD CONSTRAINT "daily_deltas_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
