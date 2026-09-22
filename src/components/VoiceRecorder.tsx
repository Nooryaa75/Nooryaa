import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

const MAX_SECONDS = 120;
const TARGET_RATE = 16000;

/** Convertit les échantillons PCM en fichier WAV 16 bits mono, lisible sur tous les appareils. */
function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.length; }

  const ratio = Math.max(1, Math.round(sampleRate / TARGET_RATE));
  const outRate = Math.round(sampleRate / ratio);
  const outLength = Math.floor(merged.length / ratio);
  const buffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(buffer);
  const writeStr = (pos: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + outLength * 2, true);
  writeStr(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, outRate, true);
  view.setUint32(28, outRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, outLength * 2, true);
  for (let i = 0; i < outLength; i++) {
    const s = Math.max(-1, Math.min(1, merged[i * ratio] ?? 0));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}


export function VoiceRecorder({
  onSend,
  sending,
  onActiveChange,
}: {
  onSend: (blob: Blob, duration: number) => Promise<void> | void;
  sending?: boolean;
  onActiveChange?: (active: boolean) => void;
}) {
  const { t } = useI18n();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; duration: number } | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const secondsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    onActiveChange?.(recording || !!preview);
  }, [recording, preview, onActiveChange]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function stop() {
    clearTimer();
    stopRef.current?.();
    stopRef.current = null;
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx: typeof AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      source.connect(node);
      node.connect(ctx.destination);

      const sampleRate = ctx.sampleRate;
      stopRef.current = () => {
        stream.getTracks().forEach((t) => t.stop());
        node.disconnect();
        source.disconnect();
        void ctx.close();
        const blob = encodeWav(chunks, sampleRate);
        if (blob.size < 2048) {
          toast.error(t("Enregistrement vide, réessayez."));
          setRecording(false);
          return;
        }
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreview({ url, blob, duration: Math.max(1, secondsRef.current) });
        setRecording(false);
      };

      secondsRef.current = 0;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_SECONDS) stop();
      }, 1000);
    } catch {
      toast.error(t("Micro indisponible. Autorisez l'accès au microphone."));
    }
  }


  function discard() {
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
    setPreview(null);
    secondsRef.current = 0;
    setSeconds(0);
  }

  if (preview) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <audio src={preview.url} controls className="h-9 flex-1 min-w-0" />
        <Button type="button" size="icon" variant="outline" onClick={discard} disabled={sending} title={t("Supprimer le vocal")}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          disabled={sending}
          title={t("Envoyer le vocal")}
          onClick={async () => {
            const { blob, duration } = preview;
            await onSend(blob, Math.max(1, duration));
            discard();
          }}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs text-[color:var(--gold)] tabular-nums flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> {fmt(seconds)}
        </span>
        <span className="text-xs text-muted-foreground truncate">{t("Enregistrement en cours…")}</span>
        <Button type="button" size="icon" variant="outline" className="ml-auto" onClick={stop} title={t("Arrêter l'enregistrement")}>
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" size="icon" variant="outline" onClick={start} title={t("Enregistrer un vocal")}>
      <Mic className="h-4 w-4" />
    </Button>
  );
}
