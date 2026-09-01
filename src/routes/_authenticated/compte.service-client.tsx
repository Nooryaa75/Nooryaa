import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Headphones, Send, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { createSupportTicket } from "@/lib/support.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/compte/service-client")({
  head: () => ({ meta: [{ title: "Service client — Nooryaa" }] }),
  component: ServiceClientPage,
});

const categories = [
  "Partenariat",
  "Inscription",
  "Connexion / Email",
  "Signalement",
  "Suppression de compte",
  "Abonnement",
  "Autres",
] as const;

function ServiceClientPage() {
  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = useServerFn(createSupportTicket);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      toast.error("Veuillez choisir un sujet.");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Votre message doit faire au moins 10 caractères.");
      return;
    }
    setLoading(true);
    try {
      await submit({ data: { category: category as (typeof categories)[number], message: message.trim() } });
      toast.success("Votre message a bien été envoyé à notre équipe.");
      setCategory("");
      setMessage("");
    } catch (e: any) {
      toast.error(e.message || "L'envoi a échoué. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute left-0 text-primary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          Service client
        </h1>
      </div>
    <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-6">
      <p className="text-sm text-muted-foreground">
        Une question, un problème ou une suggestion ? Envoyez-nous un message, notre équipe vous répondra dans les meilleurs délais.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="category">Sujet</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Choisissez un sujet" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Écrivez un message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez votre demande ici..."
            rows={6}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/2000
          </p>
        </div>
        <Button type="submit" disabled={loading} className="rounded-full gap-2">
          <Send className="h-4 w-4" />
          {loading ? "Envoi…" : "Envoyer mon message"}
        </Button>
      </form>
    </div>
    </div>
  );
}
