// main.js
import { execSync } from "child_process";
import fs from "fs";

const run = (cmd) => {
  console.log(`\n🚀 実行中: ${cmd}`);
  try {
    execSync(`node ${cmd}`, { stdio: "inherit" });
  } catch (err) {
    console.error(`❌ ${cmd} 実行中にエラー:`, err.message);
  }
};

console.log("🕒 P-BANDAI 自動ウォッチャー開始！");

// ステップ順に実行
run("step4_keyword_filter.js");
run("step5_fetch_dates.js");

// 新着チェック
const itemsPath = "./items_with_dates.json";
const notifiedPath = "./notified_items.json";

if (!fs.existsSync(itemsPath)) {
  console.log("⚠️ 取得結果ファイルが見つかりません。終了します。");
  process.exit(0);
}

const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
const notified = fs.existsSync(notifiedPath)
  ? JSON.parse(fs.readFileSync(notifiedPath, "utf8"))
  : [];

const newItems = items.filter((item) => !notified.some((n) => n.url === item.url));

if (newItems.length === 0) {
  console.log("✅ 新着ガンプラ情報はありません。通知をスキップします。");
  process.exit(0);
}

// 新着を保存
fs.writeFileSync(notifiedPath, JSON.stringify([...notified, ...newItems], null, 2));
console.log(`🆕 ${newItems.length}件の新商品を検出。Discord通知へ進みます！`);

// 通知スクリプト呼び出し
run("notify_discord.js");

console.log("\n✅ 全ステップ完了！");
