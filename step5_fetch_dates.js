import fs from "fs";
import puppeteer from "puppeteer";

const inputFile = "./filtered_products.json";
const outputFile = "./items_with_dates.json";

async function fetchReservationDates() {
  console.log("📅 商品ページから予約・抽選情報を取得中…");

  const items = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-http2",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();

  // Chrome偽装（bot検知回避）
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
      await new Promise((r) => setTimeout(r, 2000));

      // ---- 通常商品の予約受付開始日 ----
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

      // ---- 抽選商品の受付期間・当選発表 ----
      const lotteryInfo = await page.evaluate(() => {
        const section = document.querySelector("dl.pb24-item-main__lotterycart--data");
        if (!section) return null;

        let lotteryPeriod = null;
        let announceDate = null;
        section.querySelectorAll("dt").forEach((dt) => {
          const title = dt.innerText.trim();
          const value = dt.nextElementSibling?.innerText.trim();
          if (title.includes("受付期間")) lotteryPeriod = value;
          if (title.includes("当選発表")) announceDate = value;
        });
        return { lotteryPeriod, announceDate };
      });

      results.push({
        ...item,
        reservationStart: dateText || null,
        lotteryPeriod: lotteryInfo?.lotteryPeriod || null,
        announceDate: lotteryInfo?.announceDate || null,
      });

      if (lotteryInfo?.lotteryPeriod) {
        console.log(`🎯 抽選販売: ${lotteryInfo.lotteryPeriod} / 発表 ${lotteryInfo.announceDate}`);
      } else if (dateText) {
        console.log(`✅ 通常予約: ${dateText}`);
      } else {
        console.log("⚠️ 日付情報なし");
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
