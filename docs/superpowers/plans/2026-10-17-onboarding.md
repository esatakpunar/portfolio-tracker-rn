# Onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` per **Task** below. Spec: `specs/2026-10-17-onboarding-design.md`.

**Goal:** First-run welcome + mission checklist with event-driven completion; optional Guideway spotlights in v1.1.

**Architecture:** `OnboardingProvider` + `pref:onboarding` + Portfolio checklist card + Welcome modal.

**Tech Stack:** Expo 57, existing theme/i18n, Redux selectors; v1.1 adds `guideway`, `react-native-reanimated`, `react-native-svg`.

---

## Phase A — v1 Core (no new tour library)

### Task A1: Onboarding persistence & types

**Files:** `src/types/onboarding.ts` (or `src/types/index.ts`), `src/utils/preferenceStorage.ts`

- [x] Define `OnboardingState`, step ID constants, `ONBOARDING_VERSION`.
- [x] Implement get/save/completeStep/reset helpers.
- [x] Migration: if unset and `items.length > 0`, write all steps complete at current version.

**Acceptance:** Unit-less manual: read/write round-trip via dev log or temporary screen.

---

### Task A2: OnboardingProvider + navigation ref

**Files:** `src/onboarding/OnboardingProvider.tsx`, `src/onboarding/index.ts`, `App.tsx`

- [x] Context with `shouldShowWelcome`, `shouldShowChecklist`, `completeStep`, `dismissChecklist`, `resetOnboarding`.
- [x] Watch `selectItems`, wallet count, optional navigation ref.
- [x] `createNavigationContainerRef` wired to `NavigationContainer`.

**Acceptance:** Provider mounts without crash; existing app behavior unchanged when onboarding complete.

---

### Task A3: WelcomeOnboardingModal

**Files:** `src/components/WelcomeOnboardingModal.tsx`

- [x] 4-slide pager (FlatList horizontal or manual index).
- [x] Skip (all slides), Next, final “Başla”.
- [x] On complete/skip: `completeStep('welcome_done')`, close.

**Acceptance:** Modal matches glass style; i18n TR/EN/DE.

---

### Task A4: OnboardingChecklistCard

**Files:** `src/components/OnboardingChecklistCard.tsx`, `PortfolioScreen.tsx`

- [x] Render when `shouldShowChecklist`.
- [x] Required steps pinned top; optional below; show checkmarks from `completedSteps`.
- [x] Row actions: open Add modal, focus currency slider (callback props from Portfolio), navigate History, navigate Settings export.
- [x] Hide button after required complete or explicit dismiss.

**Acceptance:** PO required steps auto-tick; card hidden for legacy users with items.

---

### Task A5: Wire completion events

**Files:** `PortfolioScreen.tsx`, `AppSettingsScreen.tsx`, `BottomTabNavigator.tsx` or History screen

- [x] `add_first_asset` on items length.
- [x] `see_total_currency` on slider index change (once).
- [x] `visit_history` on tab focus listener.
- [x] `export_backup` on export success.
- [x] `add_second_wallet`, `set_goal`, `enable_lock` from existing state/prefs.

**Acceptance:** Manual QA checklist in spec passes.

---

### Task A6: Settings replay + i18n polish

**Files:** `AppSettingsScreen.tsx`, `src/locales/tr.ts`, `en.ts`, `de.ts`

- [x] “Turu tekrar göster” with confirm Alert.
- [x] All welcome + checklist strings.

**Acceptance:** Replay shows welcome; reset behavior documented in spec.

---

## Phase B — v1.1 Spotlight (Guideway)

### Task B1: Dependencies & TourProvider shell

**Files:** `package.json`, `babel.config.js` (reanimated plugin if needed), `App.tsx`

- [x] Add `guideway`, `react-native-reanimated`, `react-native-svg`.
- [x] Wrap app with `TourProvider`; dark theme tokens matching app colors.
- [x] Storage adapter → `pref:onboarding` or tours key.

**Acceptance:** Example tour runs in dev on one button.

---

### Task B2: Tour `portfolio_add_asset`

**Files:** `PortfolioScreen.tsx`, tour definition file `src/onboarding/tours.ts`

- [x] `useTourTarget` on header add button.
- [x] Start tour when user taps checklist row for first asset.
- [x] `allowTargetInteraction` true.

**Acceptance:** User can add item through spotlight hole.

---

### Task B3: Tours `settings_backup` & `wallet_add`

**Files:** `AppSettingsScreen.tsx`, `PortfolioScreen.tsx`, `tours.ts`

- [x] Navigate then start tour (delay until layout).
- [x] showOnce per tour id.

**Acceptance:** Manual QA v1.1 section in spec.

---

## Phase C — v2 Enhancements (backlog)

### Task C1: Version bump onboarding

- [ ] On `ONBOARDING_VERSION` increase, show single “What’s new” sheet for delta features only.

### Task C2: Optional analytics hooks

- [ ] Structured dev-only log or future TelemetryDeck events for step completion/skip.

---

## Subagent dispatch notes

- One task = one subagent cycle (implement → review).
- Do not combine A4 + B2 in one task (UI vs native deps).
- Follow CLAUDE.md: i18n, theme, silent non-critical errors in prefs.

---

## Roadmap placement

**Phase 6** in master roadmap — after multi-wallet (implemented). Suggested order: **A1→A6** ship together; **B1→B3** follow-up release.
