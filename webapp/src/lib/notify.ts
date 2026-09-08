/**
 * Notifies a Telegram chat about a new lead, if TELEGRAM_BOT_TOKEN and
 * TELEGRAM_CHAT_ID are configured. No-ops otherwise — there's no other
 * notification channel wired up yet (email would need an SMTP/API
 * provider and credentials nobody has supplied).
 */
export async function notifyNewLead(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // A notification failure shouldn't fail the request that triggered it —
    // the lead is already saved in the database either way.
  }
}
