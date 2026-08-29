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
}: {
  onSend: (blob: Blob, duration: number) => Promise<void> | void;
  sending?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; duration: number } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

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
        setPreview({ url: URL.createObjectURL(blob), blob, duration: seconds });
        setRecording(false);
      };
      recorderRef.current = rec;
      setSeconds(0);
      rec.start();
      setRecording(true);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) { stop(); return MAX_SECONDS; }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("Micro indisponible. Autorisez l'accès au microphone.");
    }
  }

  function stop() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
  }

  function discard() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setSeconds(0);
  }

  if (preview) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <audio src={preview.url} controls className="h-9 flex-1 min-w-0" />
        <Button type="button" size="icon" variant="outline" onClick={discard} title="Supprimer le vocal">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          disabled={sending}
          title="Envoyer le vocal"
          onClick={async () => { await onSend(preview.blob, Math.max(1, preview.duration)); discard(); }}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[color:var(--gold)] tabular-nums flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> {fmt(seconds)}
        </span>
        <Button type="button" size="icon" variant="outline" onClick={stop} title="Arrêter l'enregistrement">
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
