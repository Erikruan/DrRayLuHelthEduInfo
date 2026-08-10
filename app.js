let articles = [];
let activeFilter = "all";
let currentPage = 1;
const articlesPerPage = 5;
const now = new Date();
const isLocalPreview = ["", "localhost", "127.0.0.1"].includes(window.location.hostname);
const previewScheduled = isLocalPreview && new URLSearchParams(window.location.search).has("previewScheduled");

const categoryNames = {
  risk: "危險因子",
  disease: "疾病照護",
  exam: "檢查治療",
  life: "生活管理"
};

const grid = document.querySelector("#articleGrid");
const emptyState = document.querySelector("#emptyState");
const pagination = document.querySelector("#pagination");
const searchInput = document.querySelector("#searchInput");
const filterButtons = [...document.querySelectorAll(".filter")];
const dialog = document.querySelector("#articleDialog");
const detail = document.querySelector("#articleDetail");
const closeDialog = document.querySelector(".close-dialog");
const footerUpdatedDate = document.querySelector("#footerUpdatedDate");

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
    const sources = ["data/articles.json", "data/atherosclerosis.json", "data/heart-lifetime-beats.json", "data/vascular-endothelium.json", "data/coronary-stent-aftercare.json", "data/kawasaki-disease.json", "data/taiwan-mediterranean-diet.json", "data/ancient-egypt-heart-medicine.json", "data/autonomic-nervous-system-palpitations.json", "data/cardiomegaly-heart-enlargement.json"];
    const results = await Promise.allSettled(
      sources.map(async (source) => {
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok) {
          if (source !== "data/articles.json" && response.status === 404) return [];
          throw new Error(`${source} HTTP ${response.status}`);
        }
        return response.json();
      })
    );
    const failedRequiredSource = results[0].status === "rejected";
    if (failedRequiredSource) throw results[0].reason;
    articles = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    updateFooterDate();
    renderArticles();
  } catch (error) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent = "文章資料載入失敗。請確認 data/articles.json 存在，並用本機預覽伺服器或公開網站網址開啟。";
    console.error("Failed to load articles:", error);
  }
}

function updateFooterDate() {
  if (!footerUpdatedDate || articles.length === 0) return;

  const latestDate = getPublishedArticles(articles)
    .map((article) => article.updated)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];

  if (latestDate) {
    footerUpdatedDate.textContent = latestDate;
  }
}

function isPublished(article) {
  return previewScheduled || !article.publishAt || new Date(article.publishAt) <= now;
}

function getPublishedArticles(articleList) {
  return articleList.filter(isPublished);
}

function getFilteredArticles() {
  const keyword = searchInput.value.trim().toLowerCase();
  return getPublishedArticles(articles)
    .filter((article) => {
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
    })
    .sort((a, b) => new Date(b.updated) - new Date(a.updated));
}

function renderArticles() {
  const filtered = getFilteredArticles();
  const totalPages = Math.max(1, Math.ceil(filtered.length / articlesPerPage));
  currentPage = Math.min(currentPage, totalPages);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const pageArticles = filtered.slice(startIndex, startIndex + articlesPerPage);

  grid.innerHTML = pageArticles.map((article) => `
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
  renderPagination(filtered.length, totalPages);
}

function renderPagination(totalArticles, totalPages) {
  if (!pagination) return;

  if (totalArticles <= articlesPerPage) {
    pagination.hidden = true;
    pagination.innerHTML = "";
    return;
  }

  pagination.hidden = false;
  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    return `<button class="page-button${page === currentPage ? " is-active" : ""}" type="button" data-page="${page}" aria-current="${page === currentPage ? "page" : "false"}">${page}</button>`;
  }).join("");

  const firstArticle = (currentPage - 1) * articlesPerPage + 1;
  const lastArticle = Math.min(currentPage * articlesPerPage, totalArticles);

  pagination.innerHTML = `
    <p class="pagination-status">第 ${currentPage} / ${totalPages} 頁，顯示 ${firstArticle}-${lastArticle} 篇，共 ${totalArticles} 篇</p>
    <div class="pagination-controls">
      <button class="page-button" type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>上一頁</button>
      ${pageButtons}
      <button class="page-button" type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>下一頁</button>
    </div>
  `;
}

function openArticle(id) {
  const article = getPublishedArticles(articles).find((item) => item.id === id);
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
    ${article.links ? `
      <div class="article-links">
        ${article.links.map((link) => `
          <a class="article-link" href="${escapeHTML(link.href)}" target="_blank" rel="noreferrer">${escapeHTML(link.label)}</a>
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
    currentPage = 1;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderArticles();
  });
});

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderArticles();
});

grid.addEventListener("click", (event) => {
  const button = event.target.closest(".open-article");
  if (button) openArticle(button.dataset.id);
});

pagination?.addEventListener("click", (event) => {
  const button = event.target.closest(".page-button");
  if (!button || button.disabled) return;

  const page = Number(button.dataset.page);
  if (!page || page === currentPage) return;

  currentPage = page;
  renderArticles();
  document.querySelector("#library")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
