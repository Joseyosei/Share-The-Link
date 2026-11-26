import { createClient } from "@supabase/supabase-js";
export async function recordFounderEvent(userId: string, eventType: "dashboard_opened" | "pricing_viewed" | "checkout_started" | "checkout_completed", key: string) {
  const db = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  const { error } = await db.from("founder_events").upsert({ user_id: userId, event_type: eventType, event_key: key }, { onConflict: "user_id,event_type,event_key", ignoreDuplicates: true });
  if (error) throw error;
}
