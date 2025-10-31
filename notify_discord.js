// notify_discord.js
import fs from "fs";
import fetch from "node-fetch";
import { execSync } from "child_process";

const webhookUrl = "https://discord.com/api/webhooks/1418421788341178368/jdwC0H4LhEfDRqoRRawh1A8bMez3sLAy-aC27AkKrFwNl9so_-xQIY0uh_8PxEGOR_h9";
const roleId = "1417772334886027304";

const notifiedFile = "./notified_items.json";
let notified = [];

if (fs.existsSync(notifiedFile)) {
  notified = JSON.parse(fs.readFileSync(notifiedFile, "utf-8"));
}

console.log("📢 Discordへ通知を送信中…");

const data = JSON.parse(fs.readFileSync("./items_with_dates.json", "utf-8"));
const newItems = data.filter(item => !notified.includes(item.url));

if (newItems.length === 0) {
  console.log("✅ 新しい商品はありません。通知をスキップします。");
  process.exit(0);
}

// Discordメッセージ作成
const content = [
  `<@&${roleId}>`,
  "🚨 **新しいガンプラ関連商品が見つかりました！**",
  "",
  ...newItems.map(item => {
    let dateInfo = "";

    // 🩵 修正ポイント：date フィールドも reservationStart として扱う
    const start = item.reservationStart || item.date;
    if (start) dateInfo += `📅 **予約開始**: ${start}\n`;
    if (item.lotteryPeriod) dateInfo += `🎟️ **受付期間**: ${item.lotteryPeriod}\n`;
    if (item.announcementDate) dateInfo += `🏆 **当選発表**: ${item.announcementDate}\n`;
    if (!dateInfo) dateInfo = "📆 日付情報なし";

    return `**${item.name}**\n💴 ${item.price}\n${dateInfo}\n🔗 ${item.url}`;
  })
].join("\n\n");

// Discord送信
await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content }),
});

console.log(`✅ ${newItems.length}件の通知を送信しました！`);

// 通知済みを保存
const updatedList = [...new Set([...notified, ...newItems.map(i => i.url)])];
fs.writeFileSync(notifiedFile, JSON.stringify(updatedList, null, 2), "utf-8");
console.log("💾 通知済みリストを更新しました。");

// GitHub Actionsで自動コミット＆プッシュ
try {
  execSync(`git config user.name "github-actions"`);
  execSync(`git config user.email "github-actions@github.com"`);
  execSync(`git add ${notifiedFile}`);
  execSync(`git commit -m "update notified list [skip ci]" || echo "No changes to commit"`);
  execSync(`git push`);
  console.log("✅ notified_items.json を自動的にコミット＆プッシュしました。");
} catch (err) {
  console.error("⚠️ Git push に失敗しました:", err.message);
}
