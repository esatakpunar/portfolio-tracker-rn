# Geçmiş kayıt geri alma — Design Spec

**Date:** 2026-10-15  
**Status:** Approved (conversation)  
**Depends on:** Lot entry (same history model)

## Goal

Kullanıcı geçmişteki bir **add** veya **remove** işlemini geri alabilsin; envanter ve maliyet tutarlı kalsın.

## Approach (recommended)

**Undo transaction** — not “delete history row only”.

| History type | Undo behavior |
|--------------|---------------|
| `add` | Remove the lot (`item.id`) from `items`; remove history entry (or mark reversed — v1: remove from history array) |
| `remove` | Re-insert `item` into `items`; remove history entry |
| `update` | v1: unsupported undo OR reconstruct from `previousAmount` if present |

LIFO cost recalculates automatically from remaining history.

## UI

- `HistoryScreen`: swipe or long-press → “Geri al” with confirmation Alert.
- Redux actions: `undoHistoryEntry(historyId)` — history items need stable `id` in Redux (today history may lack top-level id; **add `id` to HistoryItem** persisted in slice).

## Data model change

```typescript
interface HistoryItem {
  id: string;  // NEW — required for undo target
  // ...existing fields
}
```

Migration: on load, assign `id` to legacy history rows missing id (`uuid` or `hist-${index}-${date}`).

## Non-goals

- Edit transaction in place (v2).
- Undo stack / multiple levels (single undo per action is enough v1).

## Manual test

- Add 5 USD → undo → USD gone from portfolio and history.
- Remove → undo → amount restored.
