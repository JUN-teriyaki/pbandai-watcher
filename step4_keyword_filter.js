// step4_keyword_filter.js
import puppeteer from 'puppeteer';
import fs from 'fs';

// 全角→半角変換
const toHalfWidth = (str) => {
  return str.replace(/[！-～]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  ).replace(/　/g, ' ');
};

(async () => {
  const url = 'https://search.p-bandai.jp/?lang=ja&page=1&q=&C5=30';
  console.log('🔍 ページを読み込み中…');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // 少し待機（JavaScript描画対応）
  await new Promise(r => setTimeout(r, 3000)); // ← 修正版ここ

  // 商品リスト抽出
  const products = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.pb25Search-product-list__item'));
    return items.map(item => ({
      name: item.querySelector('.pb25Search-product-name')?.textContent.trim() || '',
      price: item.querySelector('.pb25Search-product-foot__price')?.textContent.trim() || '',
      url: item.querySelector('a')?.href || ''
    }));
  });

  console.log(`✅ 全${products.length}件の商品を取得しました。`);

  // キーワード
  const keywords = ['RG', 'PG', 'MG', 'HG', '真骨彫'];

  const filtered = products.filter(p => {
    const nameHalf = toHalfWidth(p.name).toUpperCase();
    return keywords.some(k => nameHalf.includes(k));
  });

  if (filtered.length === 0) {
    console.log('⚠️ ガンプラ関連商品は見つかりませんでした。');
  } else {
    console.log(`🎯 ${filtered.length}件のガンプラ関連商品を検出：`);
    console.log(filtered);
    fs.writeFileSync('filtered_products.json', JSON.stringify(filtered, null, 2), 'utf-8');
  }

  await browser.close();
})();
