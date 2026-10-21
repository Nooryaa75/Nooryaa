/**
 * Filigrane discret apposé sur les photos des membres pour décourager
 * la diffusion des captures d'écran. Overlay décoratif, non interactif,
 * jamais traduit (les textes d'écran ne doivent pas être modifiés).
 */
const TILE = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="110">` +
    `<text x="50%" y="50%" transform="rotate(-24 110 55)" text-anchor="middle" ` +
    `font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-size="20" font-weight="700" ` +
    `letter-spacing="3" fill="rgba(255,255,255,0.30)" stroke="rgba(0,0,0,0.16)" stroke-width="0.6">NOORYAA</text>` +
  `</svg>`,
);

export function PhotoWatermark({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-no-translate
      className={`photo-watermark pointer-events-none absolute inset-0 ${className}`}
      style={{ backgroundImage: `url("data:image/svg+xml,${TILE}")` }}
    />
  );
}
