# Roadmap v2 — Subagent-Driven Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development for each phase. One implementer subagent per **Task** in the child plan; task reviewer after each task; final code review after phase.

**Goal:** Ship allocation, goals, CSV, auto-backup, iOS widget, multi-wallet in priority order without scope creep (no alerts, historical price UI, zakat reminders).

**Architecture:** Independent vertical slices per feature; shared constraints in `docs/superpowers/README.md`.

**Tech Stack:** Expo 57, Redux, SQLite app_settings, existing UI patterns.

## Global Constraints

- i18n TR/EN/DE mandatory per feature.
- No new bottom tab unless spec says so.
- Manual QA only (no test suite).
- User excluded features: price alerts (2), transaction-date market ref (7), zakat reminder (9).

---

## Phase order

| Phase | Feature | Spec | Plan | Subagent batches |
|-------|---------|------|------|------------------|
| **1** | Allocation + Goals | allocation, goals | `2026-10-17-portfolio-allocation.md`, `2026-10-17-portfolio-goals.md` | 2 plans × tasks 1–4 |
| **2** | History CSV | history-csv-export | `2026-10-17-history-csv-export.md` | 2 tasks |
| **3** | Auto backup | auto-backup | `2026-10-17-auto-backup.md` | 3 tasks |
| **4** | iOS Widget | ios-widget | `2026-10-17-ios-widget.md` | native-heavy |
| **5** | Multi-wallet | multi-wallet | `2026-10-17-multi-wallet.md` | 4 tasks |

---

## Subagent dispatch template

For each **Task** in a child plan:

1. **Implementer prompt:** Full task text + spec path + Global Constraints + “follow CLAUDE.md patterns”.
2. **Reviewer prompt:** Diff + spec acceptance criteria.
3. **Fix loop** if Critical/Important findings.
4. Mark task checkbox in plan (optional commit per phase — user preference).

**Model:** inherit default; escalate to stronger model for Phase 4 (widget native).

---

## Phase 1 acceptance (manual)

- [x] Portföy: dağılım kartı doğru yüzdeler (altın/döviz/TL/gümüş).
- [x] Hedef: miktar ve TL hedefi kaydedilir, progress güncellenir, silinebilir.
- [x] TR/EN/DE strings present.

**Status:** ✅ Done (2026-10-17, manual QA)

---

## Phase 2 acceptance (manual)

- [x] Geçmiş: CSV dışa aktarma, yerelleştirilmiş başlıklar ve değerler.
- [x] TR/EN/DE strings present.

**Status:** ✅ Done (2026-10-17, manual QA)

---

## Phase 3 acceptance (manual)

- [x] Ayarlar: yedek hatırlatıcısı toggle, 7 gün banner, export sonrası tarih.
- [x] TR/EN/DE strings present.

**Status:** ✅ Done (2026-10-17, manual QA)

---

## Phase 4–5

Phase 4 (iOS widget) and Phase 5 (multi-wallet) — see plan files; both implemented in app (widget EAS QA deferred).

---

## Post-roadmap

Update `docs/superpowers/README.md` table and `CHANGELOG.md` on release bump.
