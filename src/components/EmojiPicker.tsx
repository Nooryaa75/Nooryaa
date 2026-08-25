import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJIS = [
  "😀","😄","😊","🙂","😉","😍","🥰","😘","🤗","🤝",
  "👍","🙏","👏","💪","✨","🌙","⭐","☪️","🕌","📿",
  "❤️","💚","💛","💐","🌸","🌹","🎁","☕","🍵","🍫",
  "😅","😇","🤔","😌","😴","😢","😭","😳","🤲","👋",
  "🌿","🌺","🌻","🏡","📖","✍️","📞","⏰","✅","🔥",
];

/** Sélecteur d'émoticônes simple pour la messagerie. */
export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="icon" variant="outline" title="Émoticônes" aria-label="Émoticônes">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="grid grid-cols-8 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onPick(e)}
              className="text-xl leading-none rounded hover:bg-secondary p-1"
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
