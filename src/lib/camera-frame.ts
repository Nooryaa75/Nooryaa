/**
 * Carré central d'une image : c'est la zone visible dans l'aperçu carré de la
 * caméra (object-cover). La photo envoyée doit être exactement cette zone.
 */
export function centerSquare(width: number, height: number) {
  const side = Math.min(width, height);
  return { sx: Math.round((width - side) / 2), sy: Math.round((height - side) / 2), side };
}
