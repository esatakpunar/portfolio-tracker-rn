# Kar / zarar UI (toplam + varlık bazlı) — Design Spec

**Date:** 2026-10-15  
**Status:** Approved (conversation)  
**Depends on:** Lot entry (recommended for accurate cost)

## Goal

Portföy ekranında **toplam** ve **varlık türü bazında** maliyet vs güncel değer: TL tutar ve yüzde kar/zarar.

## Current state

- `src/utils/portfolioUtils.ts`: `calculateAverageCost` (LIFO, history + `priceAtTime`), `calculateProfitLoss`, `calculateTotalCost`.
- Quick Add/Remove modals show average cost only; main portfolio does not.

## Requirements

1. **Portfolio header / summary card:** Toplam maliyet (TL), güncel değer (mevcut `selectTotalTL`), kar/zarar tutar ve % — veri yoksa alan gizlenir veya “—”.
2. **Per asset group** (existing grouped rows in `PortfolioScreen`): Alt satır veya badge: `%18 kar · +1.500.000 ₺` (i18n, `formatCurrency`).
3. **Aggregation logic:**
   - Per type: sum amounts from `items`, current value from prices, average cost via `calculateAverageCost(type, history, amount)`.
   - Total: sum of per-type costs where calculable; total current = `selectTotalTL`; total P/L = current − cost; % = P/L / cost.
   - Types without cost data excluded from total cost sum (partial portfolio shows partial P/L with footnote optional in v1: hide total if any major asset missing cost — **decision: show total only when all non-zero holdings have cost; otherwise show per-asset only**).

## Non-goals

- Realized P/L on sold lots.
- Charts.

## Architecture

- New selectors in `portfolioSlice.ts`: `selectProfitLossByType`, `selectPortfolioProfitLoss` (or pure functions in `portfolioUtils` + thin selectors).
- Presentational subcomponent `PortfolioProfitSummary.tsx` to avoid bloating `PortfolioScreen`.

## Manual test

- History with priceAtTime → header and USD row show matching %.
- Missing priceAtTime on one type → that type hidden P/L; total rule above.
