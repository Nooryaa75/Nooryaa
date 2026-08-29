import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

const MAX_SECONDS = 120;

export function VoiceRecorder({
  onSend,
  sending,
  onActiveChange,
}: {
  onSend: (blob: Blob, duration: number) => Promise<void> | void;
  sending?: boolean;
  onActiveChange?: (active: boolean) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; duration: number } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
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
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreview({ url, blob, duration: Math.max(1, secondsRef.current) });
        setRecording(false);
      };
      recorderRef.current = rec;
      secondsRef.current = 0;
      setSeconds(0);
      rec.start();
      setRecording(true);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_SECONDS) stop();
      }, 1000);
    } catch {
      toast.error("Micro indisponible. Autorisez l'accès au microphone.");
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
        <Button type="button" size="icon" variant="outline" onClick={discard} disabled={sending} title="Supprimer le vocal">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          disabled={sending}
          title="Envoyer le vocal"
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
        <span className="text-xs text-muted-foreground truncate">Enregistrement en cours…</span>
        <Button type="button" size="icon" variant="outline" className="ml-auto" onClick={stop} title="Arrêter l'enregistrement">
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" size="icon" variant="outline" onClick={start} title="Enregistrer un vocal">
      <Mic className="h-4 w-4" />
    </Button>
  );
}
