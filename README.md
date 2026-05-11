# 盧炯睿醫師衛教站

這是一個靜態衛教網站，可部署到 GitHub Pages、Netlify、Vercel 或 Cloudflare Pages。

## 新增衛教文章

文章資料集中在 `data/articles.json`。新增文章時，複製既有的一整個 `{ ... }` 區塊，貼到陣列最上方或最下方，再修改內容。

常用欄位：

- `id`：文章代號，請用英文、數字、連字號，例如 `heart-failure-diet`
- `title`：文章標題
- `category`：分類，可用 `risk`、`disease`、`exam`、`life`
- `tags`：搜尋標籤
- `summary`：文章卡片摘要
- `updated`：更新日期，格式建議 `YYYY-MM-DD`
- `images`：可省略；若有圖片，請先把圖片放進 `assets/`
- `points`：民眾重點條列
- `action`：建議下一步

## 本機預覽

因為文章改成獨立 JSON 檔，請用本機預覽伺服器開啟，不建議直接雙擊 `index.html`。

```bash
cd /Users/Eric/cardiology-education-site
python3 -m http.server 4173
```

然後打開：

```text
http://localhost:4173/
```

## 公開部署

最適合的初期選項：

- GitHub Pages：免費、版本清楚，適合長期由 Codex 協助維護
- Netlify：介面直覺，拖曳資料夾或連 GitHub 都可以
- Cloudflare Pages：速度快，也適合之後綁正式網域
- Vercel：也可部署靜態網站，但對這個專案不是必要

部署後仍可在 Codex 編輯。建議流程是：在 Codex 修改檔案，確認本機預覽正常，再同步到發布平台。
