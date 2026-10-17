/** Bump when onboarding steps or flow change (triggers delta UX in v2). */
export const ONBOARDING_VERSION = 1;

export const ONBOARDING_STEPS = {
  WELCOME_DONE: 'welcome_done',
  ADD_FIRST_ASSET: 'add_first_asset',
  SEE_TOTAL_CURRENCY: 'see_total_currency',
  VISIT_HISTORY: 'visit_history',
  EXPORT_BACKUP: 'export_backup',
  ADD_SECOND_WALLET: 'add_second_wallet',
  SET_GOAL: 'set_goal',
  ENABLE_LOCK: 'enable_lock',
} as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

/** All checklist step IDs (including welcome). */
export const ALL_ONBOARDING_STEP_IDS: readonly OnboardingStepId[] = [
  ONBOARDING_STEPS.WELCOME_DONE,
  ONBOARDING_STEPS.ADD_FIRST_ASSET,
  ONBOARDING_STEPS.SEE_TOTAL_CURRENCY,
  ONBOARDING_STEPS.VISIT_HISTORY,
  ONBOARDING_STEPS.EXPORT_BACKUP,
  ONBOARDING_STEPS.ADD_SECOND_WALLET,
  ONBOARDING_STEPS.SET_GOAL,
  ONBOARDING_STEPS.ENABLE_LOCK,
];

/** Required for activation / before hiding checklist (welcome + portfolio TTV). */
export const REQUIRED_ONBOARDING_STEP_IDS: readonly OnboardingStepId[] = [
  ONBOARDING_STEPS.WELCOME_DONE,
  ONBOARDING_STEPS.ADD_FIRST_ASSET,
  ONBOARDING_STEPS.SEE_TOTAL_CURRENCY,
];

export interface OnboardingState {
  version: number;
  welcomeCompletedAt: number | null;
  dismissedAt: number | null;
  completedSteps: OnboardingStepId[];
  currencySwipeSeen?: boolean;
}

export function createEmptyOnboardingState(): OnboardingState {
  return {
    version: ONBOARDING_VERSION,
    welcomeCompletedAt: null,
    dismissedAt: null,
    completedSteps: [],
    currencySwipeSeen: false,
  };
}

export function createLegacyUserOnboardingState(now = Date.now()): OnboardingState {
  return {
    version: ONBOARDING_VERSION,
    welcomeCompletedAt: now,
    dismissedAt: now,
    completedSteps: [...ALL_ONBOARDING_STEP_IDS],
    currencySwipeSeen: true,
  };
}

export function isOnboardingStepComplete(
  state: OnboardingState,
  stepId: OnboardingStepId
): boolean {
  return state.completedSteps.includes(stepId);
}

export function areRequiredOnboardingStepsComplete(state: OnboardingState): boolean {
  return REQUIRED_ONBOARDING_STEP_IDS.every((id) => state.completedSteps.includes(id));
}
