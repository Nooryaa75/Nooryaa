export function onboardingDestination(needsOnboarding: boolean, pathname: string) {
  return needsOnboarding && pathname !== "/onboarding" ? "/onboarding" : null;
}