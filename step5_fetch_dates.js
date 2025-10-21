// step5_fetch_dates.js
import fs from "fs";
import puppeteer from "puppeteer";

const inputFile = "./filtered_products.json";
const outputFile = "./items_with_dates.json";

async function fetchReservationDates() {
  console.log("📅 商品ページから販売情報を取得中…");

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

      // 3種類の日付を一括で取得
      const info = await page.evaluate(() => {
        const result = { reservationStart: null, lotteryPeriod: null, announcementDate: null };

        // 予約受付開始（通常商品）
        const rows = Array.from(document.querySelectorAll("tr"));
        for (const row of rows) {
          const th = row.querySelector("th");
          const td = row.querySelector("td");
          if (th && td && th.textContent.includes("予約受付開始")) {
            result.reservationStart = td.textContent.trim();
          }
        }

        // 抽選商品（受付期間と当選発表）
        const lottery = document.querySelector(".pb24-item-main__lotterycart--data");
        if (lottery) {
          const dts = lottery.querySelectorAll("dt");
          const dds = lottery.querySelectorAll("dd");
          for (let i = 0; i < dts.length; i++) {
            const label = dts[i].textContent.trim();
            const value = dds[i]?.textContent.trim() || "";
            if (label.includes("受付期間")) result.lotteryPeriod = value;
            if (label.includes("当選発表")) result.announcementDate = value;
          }
        }

        return result;
      });

      console.log(`✅ ${item.name}: ${info.reservationStart || info.lotteryPeriod || "日付なし"}`);
      results.push({ ...item, ...info });

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
