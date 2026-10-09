export async function readAllAdminRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    const { data, error } = await fetchPage(from, from + size - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < size) return rows;
  }
}

type Message = { sender: string; receiver: string; content: string | null; image_path: string | null; audio_path: string | null; created_at: string; deleted_at: string | null };
type Like = { from_user: string; to_user: string; created_at: string };
export type Participant = { id: string; pseudo: string; email: string; status: string };

export function conversationPairs(messages: Message[], likes: Like[]) {
  const pairs = new Map<string, { key: string; a: string; b: string; count: number; photos: number; lastAt: string; lastPreview: string }>();
  const getPair = (a: string, b: string, at: string) => {
    const [first, second] = a < b ? [a, b] : [b, a];
    const key = `${first}|${second}`;
    const existing = pairs.get(key);
    if (existing) return existing;
    const pair = { key, a: first, b: second, count: 0, photos: 0, lastAt: at, lastPreview: "Aucun message échangé" };
    pairs.set(key, pair);
    return pair;
  };
  for (const message of messages) {
    const pair = getPair(message.sender, message.receiver, message.created_at);
    if (pair.count === 0 || message.created_at > pair.lastAt) {
      pair.lastAt = message.created_at;
      pair.lastPreview = message.deleted_at ? "Message supprimé" : message.audio_path ? "Message vocal" : message.image_path ? "Photo" : message.content ?? "";
    }
    pair.count += 1;
    if (message.image_path) pair.photos += 1;
  }
  // Member inboxes also list liked profiles before the first message.
  for (const like of likes) {
    const pair = getPair(like.from_user, like.to_user, like.created_at);
    if (pair.count === 0 && like.created_at > pair.lastAt) pair.lastAt = like.created_at;
  }
  return [...pairs.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt) || a.key.localeCompare(b.key));
}