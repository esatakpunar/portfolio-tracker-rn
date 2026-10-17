import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAppSelector } from '../hooks/useRedux';
import { selectItems } from '../store/portfolioSlice';
import {
  isOnboardingStepComplete,
  OnboardingState,
  OnboardingStepId,
  ONBOARDING_STEPS,
} from '../types/onboarding';
import {
  completeOnboardingStep,
  dismissOnboardingChecklist,
  getOnboardingState,
  resetOnboarding,
  saveOnboardingState,
} from '../utils/preferenceStorage';
import { rootNavigationRef } from './navigationRef';

interface OnboardingContextValue {
  state: OnboardingState | null;
  loading: boolean;
  shouldShowWelcome: boolean;
  completeStep: (stepId: OnboardingStepId) => Promise<void>;
  resetForReplay: () => Promise<void>;
  navigationRef: typeof rootNavigationRef;
  refreshState: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const items = useAppSelector(selectItems);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [replayWelcomePending, setReplayWelcomePending] = useState(false);

  const portfolioItemCount = items.length;

  const refreshState = useCallback(async () => {
    const next = await getOnboardingState({ portfolioItemCount });
    setState(next);
  }, [portfolioItemCount]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const next = await getOnboardingState({ portfolioItemCount });
      if (!cancelled) {
        setState(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portfolioItemCount]);

  const completeStep = useCallback(
    async (stepId: OnboardingStepId) => {
      let next = await completeOnboardingStep(stepId, { portfolioItemCount });
      if (stepId === ONBOARDING_STEPS.WELCOME_DONE) {
        setReplayWelcomePending(false);
        next = await dismissOnboardingChecklist({ portfolioItemCount });
      }
      setState(next);
    },
    [portfolioItemCount]
  );

  const resetForReplay = useCallback(async () => {
    await resetOnboarding();
    setReplayWelcomePending(true);
    setLoading(true);
    const next = await getOnboardingState({
      portfolioItemCount,
      forceFresh: true,
    });
    await saveOnboardingState(next);
    setState(next);
    setLoading(false);
  }, [portfolioItemCount]);

  const shouldShowWelcome = useMemo(() => {
    if (loading || !state) {
      return false;
    }
    if (isOnboardingStepComplete(state, ONBOARDING_STEPS.WELCOME_DONE)) {
      return false;
    }
    if (portfolioItemCount === 0 || replayWelcomePending) {
      return true;
    }
    return false;
  }, [loading, state, portfolioItemCount, replayWelcomePending]);

  const value = useMemo(
    (): OnboardingContextValue => ({
      state,
      loading,
      shouldShowWelcome,
      completeStep,
      resetForReplay,
      navigationRef: rootNavigationRef,
      refreshState,
    }),
    [state, loading, shouldShowWelcome, completeStep, resetForReplay, refreshState]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
