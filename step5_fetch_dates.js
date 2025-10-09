import fs from "fs";
import puppeteer from "puppeteer";

const inputFile = "./filtered_products.json";
const outputFile = "./items_with_dates.json";

async function fetchReservationDates() {
  console.log("📅 商品ページから予約受付開始日を取得中…");

  const items = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-http2", // ← HTTP/2を無効化（重要）
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();

  // 通常のChromeっぽく偽装
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  const results = [];

  for (const item of items) {
    console.log(`🔍 ${item.name} を解析中…`);
    try {
      await page.goto(item.url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await new Promise((r) => setTimeout(r, 2000)); // 読み込み安定化

      // 「予約受付開始」の<th>を含む<tr>を探して<td>の内容を取る
      const dateText = await page.evaluate(() => {
        const rows = document.querySelectorAll("tr");
        for (const row of rows) {
          const th = row.querySelector("th");
          const td = row.querySelector("td");
          if (th && td && th.innerText.includes("予約受付開始")) {
            return td.innerText.trim();
          }
        }
        return null;
      });

      if (dateText) {
        console.log(`✅ 取得成功: ${dateText}`);
        results.push({ ...item, reservationStart: dateText });
      } else {
        console.log("⚠️ 予約受付開始日が見つかりませんでした。");
        results.push({ ...item, reservationStart: null });
      }
    } catch (error) {
      console.error(`❌ ${item.name} の取得に失敗: ${error.message}`);
      results.push({ ...item, reservationStart: null });
    }
  }

  await browser.close();
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`💾 結果を ${outputFile} に保存しました！`);
}

fetchReservationDates();
