# Onboarding (Welcome + Missions + Spotlight) — Design Spec

**Date:** 2026-10-17  
**Status:** Approved (PO)  
**Depends on:** Multi-wallet, goals, backup, app-lock (features exist; onboarding explains them)

## Product owner decision (v1 scope)

**Ship in v1:**

1. **Welcome carousel** (4 slides, always skippable) — value + offline trust + backup/lock *mention* (no forced setup).
2. **Mission checklist** on Portfolio — **2 required** steps for “activation”, rest **optional**.
3. **Event-driven auto-progress** — checklist ticks when user completes actions (not timer-based “next slide”).
4. **No full cross-tab automated tour** in v1 — too fragile and high drop-off for this app.

**Defer to v1.1:** Guideway spotlight on + button, backup export, wallet chip (requires `react-native-reanimated` + `guideway`).

**Defer to v2:** “What’s new” mini-onboarding on `onboardingVersion` bump; optional replay from Settings.

### Required vs optional missions (v1)

| Step ID | User-facing (TR key TBD) | Required | Auto-complete when |
|---------|--------------------------|----------|---------------------|
| `welcome_done` | (implicit) | Yes | User taps “Başla” or finishes slide 4 |
| `add_first_asset` | İlk varlığını ekle | **Yes** | `items.length >= 1` |
| `see_total_currency` | Toplamı farklı para biriminde gör | **Yes** | User changes currency slider index ≠ initial **or** completes one swipe gesture (persist flag) |
| `visit_history` | Geçmişe göz at | No | History tab focused once |
| `export_backup` | Yedek al | No | Successful export callback |
| `add_second_wallet` | İkinci cüzdan (opsiyonel) | No | `wallets.length > 1` |
| `set_goal` | Hedef belirle | No | Any wallet has goal in `pref:portfolioGoal` map |
| `enable_lock` | Uygulama kilidi | No | PIN enabled in lock prefs |

**Activation definition (success metric):** `add_first_asset` + `see_total_currency` within first session.

**Existing users:** If `items.length > 0` at first onboarding read → skip Welcome + checklist entirely; mark all steps complete at current `ONBOARDING_VERSION`. If `onboardingVersion` < app version later → show **only new** optional cards (v2).

---

## Why not one continuous auto-tour?

Professional mobile onboarding optimizes **time-to-value** and **completion rate**, not “show every screen once.”

- Cross-tab tours (Portfolio → Settings → History) break on ScrollView offset, modals, and wallet chips.
- Forcing backup/PIN before first asset increases abandonment in offline-first finance apps.
- **Checklist + completion events** matches Duolingo/Notion/Stripe setup patterns; spotlight is **surgical** (v1.1).

---

## Architecture

### State storage

SQLite `app_settings`:

- Key: `pref:onboarding`
- JSON shape:

```typescript
interface OnboardingState {
  version: number; // ONBOARDING_VERSION constant in code
  welcomeCompletedAt: number | null;
  dismissedAt: number | null; // user tapped "Hide checklist" after required done
  completedSteps: string[]; // step IDs
  currencySwipeSeen?: boolean;
}
```

Helpers in `preferenceStorage.ts`: `getOnboardingState`, `saveOnboardingState`, `completeOnboardingStep(id)`, `resetOnboarding()`.

### Runtime

- `OnboardingProvider` — React context at app root (inside `LockGate`, wrapping navigator).
- Exposes: `shouldShowWelcome`, `shouldShowChecklist`, `activeStep`, `completeStep`, `dismissChecklist`, `resetForReplay`.
- Subscribes to Redux selectors (`items`, `wallets`) and navigation ref for optional deep links.
- **Navigation:** `@react-navigation/native` `createNavigationContainerRef` passed from `App.tsx` for “Go to backup” mission.

### UI components (new)

| Component | Role |
|-----------|------|
| `WelcomeOnboardingModal` | Full-screen modal, 4 pages, pager, Skip + Next + Başla |
| `OnboardingChecklistCard` | Glass card on Portfolio; lists missions; CTA opens modal / navigates |
| `OnboardingController` | (optional) hooks-only module if provider grows |

### Integration points

| Location | Change |
|----------|--------|
| `App.tsx` | Provider + navigation ref; show welcome when `shouldShowWelcome` |
| `PortfolioScreen.tsx` | Checklist card below wallet chips (or below total card if no wallets row) |
| `AppSettingsScreen.tsx` | “Turu tekrar göster” → `resetOnboarding()` partial (welcome only or full — **full reset** with confirm) |
| `portfolioSlice` / add item | No change required if provider watches `selectItems` |
| Export backup handler | Call `completeStep('export_backup')` on success |

### Welcome slide content (i18n)

1. **Welcome** — track gold/FX portfolio offline  
2. **Privacy / offline** — data on device, works without network; cached prices  
3. **Backup & lock** — export JSON; optional PIN in Settings (no PIN flow in onboarding)  
4. **Checklist intro** — “2 quick steps, skip anytime” → completes `welcome_done`, closes modal, shows checklist  

---

## Spotlight layer (v1.1 — Guideway)

**Dependencies:** `guideway`, `react-native-reanimated`, `react-native-svg` (Expo compatible).

**Tours (data-driven, not one mega-tour):**

| Tour ID | Trigger | Steps |
|---------|---------|-------|
| `portfolio_add_asset` | User taps checklist row `add_first_asset` while incomplete | Highlight header `+` → interactive tap |
| `settings_backup` | User taps `export_backup` row | Navigate Settings → highlight Export |
| `wallet_add` | User taps `add_second_wallet` | Highlight wallet chip + |

**Storage:** Guideway `showOnce` adapter → same `pref:onboarding` or separate `pref:onboardingTours`.

**Non-goals v1.1:** Spotlight on swipe actions, Markets tab, zakat.

---

## UX rules

- **Skip** visible on welcome from slide 1; skipping welcome still marks `welcome_done` (user opts out of story, not app).
- Checklist **“Gizle”** only after both required steps complete OR user explicitly dismisses (optional steps remain in Settings replay).
- No blocking modal after welcome — user can use app freely; checklist is persistent but compact.
- Haptics on step completion (`hapticFeedback.success`).
- Dark theme only — match existing glass components.

---

## Non-goals

- Server-driven onboarding / A/B (local JSON only).
- Video onboarding.
- Mandatory PIN or mandatory backup before first asset.
- Onboarding analytics SDK in v1 (local step completion sufficient).
- Replacing existing `EmptyState` — checklist complements it; empty assets list still shows EmptyState until first item.

---

## i18n

All welcome slides, checklist labels, buttons (Skip, Next, Start, Hide, Replay tour) in **TR / EN / DE**.

---

## Manual QA acceptance (v1)

- [ ] Fresh install (no items): welcome shows once; skip exits to portfolio with checklist.
- [ ] Add first asset: `add_first_asset` ticks without app restart.
- [ ] Swipe currency slider: `see_total_currency` ticks.
- [ ] Existing user with items: no welcome, no checklist on first launch after upgrade.
- [ ] Settings → replay tour: welcome shows again; checklist state reset per spec.
- [ ] TR/EN/DE strings present.

## Manual QA acceptance (v1.1)

- [ ] Spotlight + button: interactive add completes mission.
- [ ] Settings backup spotlight after navigate.
- [ ] Tour does not re-show after completion (`showOnce`).

---

## Versioning

- `ONBOARDING_VERSION = 1` in code.
- Future: increment when adding steps (e.g. widget tip); migration shows delta card only.
