import puppeteer from "puppeteer";

const URL = "https://p-bandai.jp/item_list/sort_salesDesc/";
const KEYWORDS = ["RG", "PG", "MG", "HG", "真骨彫"];

// 正規表現で全角・半角どちらにもマッチ
const keywordRegex = new RegExp(KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");

(async () => {
  console.log("🔍 ページを読み込み中…");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });

  // スクロールして全件読み込み（72件などが表示されるまで）
  await autoScroll(page);

  // 商品カードの抽出
  const items = await page.$$eval(".itemList__item", cards =>
    cards.map(card => {
      const name = card.querySelector(".itemList__itemName")?.innerText?.trim() || "";
      const price = card.querySelector(".itemList__price")?.innerText?.trim() || "";
      const url = card.querySelector("a")?.href || "";
      return { name, price, url };
    })
  );

  console.log(`✅ 全${items.length}件の商品を取得しました。`);

  // フィルタリング（ガンプラ・真骨彫のみ）
  const filtered = items.filter(item => keywordRegex.test(item.name));

  if (filtered.length === 0) {
    console.log(⚠️ ガンプラ関連商品は見つかりませんでした。");
  } else {
    console.log(`🎯 ${filtered.length}件のガンプラ関連商品を検出：`);
    console.log(filtered);
  }

  await browser.close();
})();

// スクロールで全件読み込み
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}
