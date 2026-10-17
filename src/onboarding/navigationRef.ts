import { createNavigationContainerRef } from '@react-navigation/native';

export type RootTabParamList = {
  Portfolio: undefined;
  History: undefined;
  Markets: undefined;
  AppSettings: undefined;
};

const TAB_NAMES: (keyof RootTabParamList)[] = [
  'Portfolio',
  'History',
  'Markets',
  'AppSettings',
];

/** After a tab switch, brief pause so native views can attach before measure. */
const TAB_SWITCH_SETTLE_MS = 90;

export const rootNavigationRef = createNavigationContainerRef<RootTabParamList>();

function isTabName(name: string | undefined): name is keyof RootTabParamList {
  return TAB_NAMES.includes(name as keyof RootTabParamList);
}

/** Active bottom-tab route name (Portfolio, History, …). */
export function getFocusedTabName(): keyof RootTabParamList | null {
  if (!rootNavigationRef.isReady()) {
    return null;
  }
  const direct = rootNavigationRef.getCurrentRoute()?.name;
  if (isTabName(direct)) {
    return direct;
  }
  try {
    const root = rootNavigationRef.getRootState();
    const tab = root.routes[root.index ?? 0];
    if (isTabName(tab?.name)) {
      return tab.name;
    }
  } catch {
    // ignore
  }
  return null;
}

function afterFrames(frameCount: number): Promise<void> {
  return new Promise((resolve) => {
    let left = frameCount;
    const tick = () => {
      left -= 1;
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Switch tab when needed; no-op delay when already on the tab. */
export function ensureTabForTour(name: keyof RootTabParamList): Promise<void> {
  if (!rootNavigationRef.isReady()) {
    return Promise.resolve();
  }
  if (getFocusedTabName() === name) {
    return afterFrames(1);
  }

  return new Promise((resolve) => {
    rootNavigationRef.navigate(name);
    const deadline = Date.now() + 450;
    const poll = () => {
      if (getFocusedTabName() === name || Date.now() >= deadline) {
        setTimeout(resolve, TAB_SWITCH_SETTLE_MS);
        return;
      }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  });
}

export function navigateToTab(name: keyof RootTabParamList): void {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.navigate(name);
  }
}
