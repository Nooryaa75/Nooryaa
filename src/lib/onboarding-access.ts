export function onboardingDestination(needsOnboarding: boolean, pathname: string) {
  return needsOnboarding && pathname !== "/onboarding" ? "/onboarding" : null;
}

/**
 * L'écran « Chargement » ne s'affiche que tant que le membre n'a pas encore été
 * vérifié une fois dans cette session. Les contrôles suivants, relancés à chaque
 * changement de page, se font en arrière-plan : la page en cours reste affichée
 * au lieu d'être démontée (sinon deck, messages et position de défilement sont
 * remis à zéro à chaque navigation).
 */
export function showAccessGate(verifiedUserId: string | null, userId: string) {
  return !userId || verifiedUserId !== userId;
}