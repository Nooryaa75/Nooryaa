import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
if (!url || !key) throw new Error("Retention integration tests require server database access");
const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const now = "2026-11-26T10:00:00Z";
async function expired(last: string) {
  const { data, error } = await db.rpc("conversation_expired", { last_message: last, at_time: now });
  if (error) throw new Error(error.message);
  return data;
}

test("a discussion expires exactly after 10 days without a new message", async () => {
  assert.equal(await expired("2026-11-16T10:00:00Z"), true);
  assert.equal(await expired("2026-11-16T10:00:01Z"), false);
});
test("a new message restarts the delay even when previous messages are older than 10 days", async () => {
  const messages = ["2026-10-01T10:00:00Z", "2026-11-25T10:00:00Z"];
  const last = messages.reduce((a, b) => a > b ? a : b);
  assert.equal(await expired(last), false);
});