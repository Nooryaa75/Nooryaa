// Traduit les messages d'erreur techniques en français clair pour les membres.
export function frenchError(err: unknown, fallback = "Une erreur est survenue. Merci de réessayer."): string {
  const raw =
    typeof err === "string"
      ? err
      : String((err as any)?.message ?? (err as any)?.error_description ?? (err as any)?.error ?? "");
  const m = raw.trim();
  if (!m) return fallback;

  // Réseau / connexion
  if (/load failed|failed to fetch|networkerror|network request failed|network|timeout|aborted|econnreset/i.test(m))
    return "La connexion au serveur a été interrompue. Vérifiez votre connexion internet (VPN, pare-feu ou bloqueur actif ?) puis réessayez.";

  // Authentification
  if (/invalid login credentials/i.test(m)) return "Email ou mot de passe incorrect.";
  if (/email not confirmed/i.test(m)) return "Votre adresse email n'est pas encore confirmée. Vérifiez votre boîte mail.";
  if (/user already registered|already been registered/i.test(m)) return "Cette adresse email est déjà utilisée.";
  if (/email address .*invalid|invalid email/i.test(m)) return "Cette adresse email n'est pas valide.";
  if (/password should be at least|password.*too short/i.test(m))
    return "Votre mot de passe est trop court : il doit contenir au moins 6 caractères.";
  if (/weak password|pwned|easy to guess|known to be weak|compromised/i.test(m))
    return "Ce mot de passe est trop courant. Choisissez-en un plus original (lettres, chiffres et symboles).";
  if (/same as the old password/i.test(m)) return "Votre nouveau mot de passe doit être différent de l'ancien.";
  if (/rate limit|too many requests|for security purposes/i.test(m))
    return "Trop de tentatives. Merci de patienter quelques minutes avant de réessayer.";
  if (/token has expired|otp_expired|invalid or has expired|link is invalid/i.test(m))
    return "Ce lien n'est plus valide. Demandez-en un nouveau.";
  if (/unauthorized|jwt|not authenticated|no session|session.*expired|invalid claim/i.test(m))
    return "Votre session n'est plus valide. Reconnectez-vous puis réessayez.";
  if (/unsupported provider/i.test(m)) return "Cette méthode de connexion n'est pas encore disponible.";
  if (/user not found/i.test(m)) return "Aucun compte ne correspond à ces informations.";

  // Base de données / droits
  if (/row-level security|violates row-level security|new row violates|permission denied|not allowed/i.test(m))
    return "Vous n'avez pas l'autorisation d'effectuer cette action. Reconnectez-vous puis réessayez.";
  if (/duplicate key|unique constraint|already exists/i.test(m)) {
    if (/phone/i.test(m)) return "Ce numéro de téléphone est déjà utilisé par un autre compte.";
    if (/email/i.test(m)) return "Cette adresse email est déjà utilisée.";
    if (/pseudo|username/i.test(m)) return "Ce pseudo est déjà pris. Choisissez-en un autre.";
    return "Ces informations sont déjà enregistrées sur un autre compte.";
  }
  if (/violates check constraint|check constraint/i.test(m))
    return "Certaines informations saisies ne sont pas valides. Vérifiez le formulaire puis réessayez.";
  if (/foreign key|violates foreign key/i.test(m))
    return "Cette action est impossible car l'élément lié n'existe plus.";
  if (/null value in column|not-null constraint/i.test(m))
    return "Un champ obligatoire est manquant. Complétez le formulaire puis réessayez.";
  if (/invalid input syntax|invalid text representation/i.test(m))
    return "Une valeur saisie n'a pas le bon format. Vérifiez le formulaire puis réessayez.";
  if (/could not find the function|does not exist|schema cache/i.test(m))
    return "Cette fonctionnalité est momentanément indisponible. Merci de réessayer dans quelques instants.";

  // Fichiers / stockage
  if (/payload too large|exceeded the maximum allowed size|file size/i.test(m))
    return "Ce fichier est trop volumineux. Choisissez un fichier plus léger.";
  if (/mime type|invalid file type|not supported/i.test(m)) return "Ce format de fichier n'est pas accepté.";
  if (/object not found|not_found/i.test(m)) return "Ce contenu n'existe plus.";
  if (/bucket/i.test(m)) return "L'envoi du fichier a échoué. Merci de réessayer.";

  // Serveur
  if (/internal server error|500|unexpected/i.test(m))
    return "Le serveur a rencontré un problème. Merci de réessayer dans quelques instants.";

  // Message déjà rédigé en français (accents ou ponctuation finale) : on le garde.
  if (/[éèêàçîôûù]|’/.test(m) || /^[A-ZÉÀ].*[.!?]$/.test(m)) return m;

  return fallback;
}
