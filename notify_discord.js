import fetch from "node-fetch";
import fs from "fs";

// Discord Webhook URL とロールID
const WEBHOOK_URL = "https://discord.com/api/webhooks/1418421788341178368/jdwC0H4LhEfDRqoRRawh1A8bMez3sLAy-aC27AkKrFwNl9so_-xQIY0uh_8PxEGOR_h9";
const ROLE_ID = "1417772334886027304"; // メンション対象ロール

async function sendDiscordNotification(items) {
  const embeds = items.map(item => ({
    title: item.name,
    url: item.url,
    description: `💰 **価格:** ${item.price}\n🕒 **予約受付開始:** ${item.reservationStart}`,
    color: 0x00b0f4
  }));

  const message = {
    content: `<@&${ROLE_ID}> 📢 **新しい予約情報をお知らせします！**`,
    embeds
  };

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message)
  });

  if (!res.ok) {
    throw new Error(`通知失敗 (${res.status}): ${res.statusText}`);
  }
}

async function main() {
  console.log("📢 Discordへ通知を送信中…");

  const data = JSON.parse(fs.readFileSync("./items_with_dates.json", "utf8"));
  if (!Array.isArray(data) || data.length === 0) {
    console.log("⚠️ 通知対象の商品がありません。");
    return;
  }

  await sendDiscordNotification(data);
  console.log(`✅ 通知送信成功: ${data.length}件の商品をまとめて送信しました！`);
}

main().catch(console.error);
