let articles = [];
let activeFilter = "all";

const categoryNames = {
  risk: "危險因子",
  disease: "疾病照護",
  exam: "檢查治療",
  life: "生活管理"
};

const grid = document.querySelector("#articleGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const filterButtons = [...document.querySelectorAll(".filter")];
const dialog = document.querySelector("#articleDialog");
const detail = document.querySelector("#articleDetail");
const closeDialog = document.querySelector(".close-dialog");

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadArticles() {
  try {
    const response = await fetch("data/articles.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    articles = await response.json();
    renderArticles();
  } catch (error) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent = "文章資料載入失敗。請確認 data/articles.json 存在，並用本機預覽伺服器或公開網站網址開啟。";
    console.error("Failed to load articles:", error);
  }
}

function renderArticles() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = articles.filter((article) => {
    const matchesFilter = activeFilter === "all" || article.category === activeFilter;
    const haystack = [
      article.title,
      article.summary,
      categoryNames[article.category],
      ...article.tags,
      ...article.points,
      ...(article.images || []).map((image) => `${image.alt} ${image.caption}`)
    ].join(" ").toLowerCase();
    return matchesFilter && haystack.includes(keyword);
  });

  grid.innerHTML = filtered.map((article) => `
    <article class="article-card">
      <div>
        <div class="tag-row">
          <span class="tag">${escapeHTML(categoryNames[article.category])}</span>
          ${article.tags.slice(0, 2).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}
        </div>
        <h3>${escapeHTML(article.title)}</h3>
        <p>${escapeHTML(article.summary)}</p>
      </div>
      <div class="card-footer">
        <span class="card-meta">更新 ${escapeHTML(article.updated)}</span>
        <button class="open-article" type="button" data-id="${escapeHTML(article.id)}">閱讀</button>
      </div>
    </article>
  `).join("");

  emptyState.textContent = "找不到符合條件的資料。可以換個關鍵字，或新增一篇衛教文章。";
  emptyState.hidden = filtered.length > 0;
}

function openArticle(id) {
  const article = articles.find((item) => item.id === id);
  if (!article) return;

  detail.innerHTML = `
    <p class="eyebrow">${escapeHTML(categoryNames[article.category])} · 更新 ${escapeHTML(article.updated)}</p>
    <h2>${escapeHTML(article.title)}</h2>
    <p>${escapeHTML(article.summary)}</p>
    ${article.images ? `
      <div class="article-images">
        ${article.images.map((image) => `
          <figure>
            <img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt)}" loading="lazy">
            <figcaption>${escapeHTML(image.caption)}</figcaption>
          </figure>
        `).join("")}
      </div>
    ` : ""}
    <h3>民眾重點</h3>
    <ul>
      ${article.points.map((point) => `<li>${escapeHTML(point)}</li>`).join("")}
    </ul>
    <h3>建議下一步</h3>
    <p>${escapeHTML(article.action)}</p>
    <p class="card-meta">本內容為一般衛教資訊，請依個人病況與主治醫師討論。</p>
  `;
  dialog.showModal();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderArticles();
  });
});

searchInput.addEventListener("input", renderArticles);

grid.addEventListener("click", (event) => {
  const button = event.target.closest(".open-article");
  if (button) openArticle(button.dataset.id);
});

closeDialog.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

document.querySelector("#bpForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const systolic = Number(document.querySelector("#systolic").value);
  const diastolic = Number(document.querySelector("#diastolic").value);
  const result = document.querySelector("#bpResult");

  if (!systolic || !diastolic) {
    result.textContent = "請輸入收縮壓與舒張壓。";
    return;
  }

  if (systolic >= 180 || diastolic >= 120) {
    result.textContent = "血壓非常高。若合併胸痛、喘、神經症狀或嚴重不適，請立即就醫；即使無症狀也建議儘快聯絡醫療團隊。";
  } else if (systolic >= 130 || diastolic >= 80) {
    result.textContent = "此數值偏高，建議連續記錄多次並與醫師討論。一次測量不能直接代表診斷。";
  } else if (systolic >= 120 && diastolic < 80) {
    result.textContent = "收縮壓略高，建議維持健康生活並持續追蹤。";
  } else {
    result.textContent = "此筆血壓在一般理想範圍內，仍建議依年齡與疾病風險定期追蹤。";
  }
});

loadArticles();
