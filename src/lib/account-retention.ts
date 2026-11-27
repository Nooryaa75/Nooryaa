/** Only a voluntary deletion for a lack of nearby profiles gets this invitation. */
export function showPatienceMessage(action: "delete" | "suspend", reason: string): boolean {
  return action === "delete" && reason === "Pas assez de profils dans ma région";
}