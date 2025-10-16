// notify_discord.js
import fs from "fs";
import fetch from "node-fetch";
import { execSync } from "child_process";

const webhookUrl = "https://discord.com/api/webhooks/1418421788341178368/jdwC0H4LhEfDRqoRRawh1A8bMez3sLAy-aC27AkKrFwNl9so_-xQIY0uh_8PxEGOR_h9";
const roleId = "1417772334886027304";

// 通知済みリストファイル
const notifiedFile = "./notified_items.json";
let notified = [];

if (fs.existsSync(notifiedFile)) {
  notified = JSON.parse(fs.readFileSync(notifiedFile, "utf-8"));
}

console.log("📢 Discordへ通知を送信中…");

// 商品データ読み込み
const data = JSON.parse(fs.readFileSync("./items_with_dates.json", "utf-8"));

// 未通知の商品だけ抽出
const newItems = data.filter(item => !notified.includes(item.url));

if (newItems.length === 0) {
  console.log("✅ 新しい商品はありません。通知をスキップします。");
  process.exit(0);
}

// Discordメッセージ本文をまとめて作成
const content = [
  `<@&${roleId}>`,
  "🚨 **新しいガンプラ関連商品が見つかりました！**",
  "",
  ...newItems.map(item =>
    `**${item.name}**\n💴 ${item.price}\n📅 ${item.reservationStart || "日付情報なし"}\n🔗 ${item.url}`
  )
].join("\n\n");

// Discordへ送信
await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content }),
});

console.log(`✅ ${newItems.length}件の通知を送信しました！`);

// 通知済みURLをリストに追加・保存
const updatedList = [...new Set([...notified, ...newItems.map(i => i.url)])];
fs.writeFileSync(notifiedFile, JSON.stringify(updatedList, null, 2), "utf-8");
console.log("💾 通知済みリストを更新しました。");

// 🚀 GitHub Actions内で自動コミット・プッシュ
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
