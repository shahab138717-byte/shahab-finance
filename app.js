
/*
 Finance Mini App — اتصال به n8n
*/

// 1. Telegram SDK
(function initTelegramMiniApp() {
  function expose() {
    const tg = window.Telegram && window.Telegram.WebApp;

    window.financeTelegram = {
      ready: Boolean(tg),
      userId: tg?.initDataUnsafe?.user?.id ?? null,
      initData: tg?.initData ?? "",
      getUserId() {
        return this.userId;
      },
      getInitData() {
        return this.initData;
      }
    };

    if (tg) {
      tg.ready();
      tg.expand();
    }
  }

  if (window.Telegram?.WebApp) {
    expose();
  } else {
    const sdk = document.createElement("script");
    sdk.src = "https://telegram.org/js/telegram-web-app.js";
    sdk.onload = expose;
    sdk.onerror = () => {
      window.financeTelegram = {
        ready: false,
        userId: null,
        initData: "",
        getUserId() { return null; },
        getInitData() { return ""; }
      };
    };
    document.head.appendChild(sdk);
  }
})();

// 2. آدرس Webhook
const FINANCE_HOME_WEBHOOK_URL =
  "https://n8n.mediasun.info/webhook/api/finance-home";

// 3. اطلاعات مالی
const financeData = {
  summary: {
    income: 0,
    expense: 0,
    balance: 0
  },
  topCategories: [],
  loading: true,
  error: "",
  loaded: false
};

const state = {
  page: "home",
  selectedCategory: ""
};

const app = document.getElementById("app");
const pageTitle = document.getElementById("pageTitle");

// 4. توابع کمکی
function toman(n) {
  return new Intl.NumberFormat("fa-IR")
    .format(Number(n) || 0) + " تومان";
}

function compact(n) {
  return new Intl.NumberFormat("fa-IR")
    .format(Number(n) || 0);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

// 5. دریافت اطلاعات از n8n
async function getFinanceHomeFromN8n() {
  const telegram = window.Telegram?.WebApp;
  const userId = telegram?.initDataUnsafe?.user?.id;

  if (!userId) {
    throw new Error('شناسه تلگرام پیدا نشد؛ مینی‌اپ را از داخل ربات باز کن.');
  }

  const response = await fetch(
    'https://n8n.mediasun.info/webhook/api/finance-home',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: String(userId)
      })
    }
  );

  if (!response.ok) {
    throw new Error(`خطای n8n: ${response.status}`);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'دریافت اطلاعات ناموفق بود');
  }

  return data;
}

  const response = await fetch(FINANCE_HOME_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ initData })
  });

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error("پاسخ n8n قابل‌خواندن نیست.");
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(
      payload?.error ||
      `خطا در دریافت اطلاعات مالی (${response.status})`
    );
  }

  if (!payload?.summary) {
    throw new Error("ساختار پاسخ API معتبر نیست.");
  }

  return payload;
}

// 6. وضعیت بارگذاری و خطا
function loadingHTML() {
  return `
    <section class="section">
      <article class="card">
        <div class="loading">در حال دریافت اطلاعات مالی…</div>
      </article>
    </section>
  `;
}

function errorHTML(message) {
  return `
    <section class="section">
      <article class="card">
        <div class="section-title">
          دریافت اطلاعات ناموفق بود
        </div>
        <p class="section-caption">
          ${escapeHtml(message)}
        </p>
        <button
          class="primary-button"
          onclick="retryFinanceLoad()"
        >
          تلاش دوباره
        </button>
      </article>
    </section>
  `;
}

// 7. صفحه خانه
function renderHome() {
  if (financeData.loading) return loadingHTML();
  if (financeData.error) return errorHTML(financeData.error);

  const { income, expense, balance } = financeData.summary;
  const cats = financeData.topCategories;

  const max = Math.max(
    1,
    ...cats.map(c => Number(c.amount) || 0)
  );

  return `
    <section class="section">
      <div class="section-head">
        <div class="section-title">خلاصه وضعیت مالی</div>
        <div class="section-caption">اطلاعات دیتابیس</div>
      </div>

      <div class="summary-grid">
        <article class="card summary-card">
          <div class="stat-label">موجودی خالص</div>
          <div class="summary-value">${toman(balance)}</div>
        </article>

        <article class="card summary-card">
          <div class="stat-label">مجموع درآمد</div>
          <div class="summary-value income">${toman(income)}</div>
        </article>

        <article class="card summary-card">
          <div class="stat-label">مجموع هزینه</div>
          <div class="summary-value expense">${toman(expense)}</div>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div class="section-title">بیشترین هزینه‌ها</div>
        <div class="section-caption">۵ دسته برتر</div>
      </div>

      ${
        cats.length
          ? `<div class="category-list">
              ${cats.map(c => {
                const amount = Number(c.amount) || 0;

                return `
                  <article class="card category-row">
                    <div class="category-top">
                      <div class="category-name">
                        ${escapeHtml(c.name || "بدون دسته")}
                      </div>
                      <div class="category-amount">
                        ${toman(amount)}
                      </div>
                    </div>

                    <div class="progress">
                      <span style="width:${
                        Math.round(amount / max * 100)
                      }%"></span>
                    </div>
                  </article>
                `;
              }).join("")}
            </div>`
          : `<article class="card">
              <div class="section-caption">
                هنوز هزینه‌ای برای نمایش وجود ندارد.
              </div>
            </article>`
      }

      <button
        class="primary-button"
        onclick="navigate('reports')"
      >
        مشاهده گزارش
      </button>
    </section>
  `;
}

// 8. صفحه گزارش
function renderReports() {
  if (financeData.loading) return loadingHTML();
  if (financeData.error) return errorHTML(financeData.error);

  const { income, expense, balance } = financeData.summary;
  const cats = financeData.topCategories;

  const selected =
    cats.find(c => c.name === state.selectedCategory) ||
    cats[0];

  const max = Math.max(
    1,
    ...cats.map(c => Number(c.amount) || 0)
  );

  return `
    <section class="section">
      <div class="section-head">
        <div class="section-title">گزارش مالی</div>
        <div class="section-caption">اطلاعات دیتابیس</div>
      </div>

      <div class="summary-grid">
        <article class="card summary-card">
          <div class="stat-label">مجموع درآمد</div>
          <div class="summary-value income">${toman(income)}</div>
        </article>

        <article class="card summary-card">
          <div class="stat-label">مجموع هزینه</div>
          <div class="summary-value expense">${toman(expense)}</div>
        </article>

        <article class="card summary-card">
          <div class="stat-label">خالص درآمد</div>
          <div class="summary-value">${toman(balance)}</div>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div class="section-title">هزینه دسته‌بندی‌ها</div>
      </div>

      ${
        cats.length
          ? `<article class="card report-card">
              <div class="section-caption">دسته انتخاب‌شده</div>
              <div class="report-total">
                ${escapeHtml(selected?.name || "")}
              </div>
              <div>${toman(selected?.amount || 0)}</div>

              <div class="category-list">
                ${cats.map(c => {
                  const amount = Number(c.amount) || 0;

                  return `
                    <article class="category-row">
                      <div class="category-top">
                        <div class="category-name">
                          ${escapeHtml(c.name)}
                        </div>
                        <div class="category-amount">
                          ${toman(amount)}
                        </div>
                      </div>
                      <div class="progress">
                        <span style="width:${
                          Math.round(amount / max * 100)
                        }%"></span>
                      </div>
                    </article>
                  `;
                }).join("")}
              </div>

              <select
                class="select"
                onchange="selectCategory(this.value)"
              >
                ${cats.map(c => `
                  <option
                    value="${escapeHtml(c.name)}"
                    ${c.name === (selected?.name || "")
                      ? "selected" : ""}
                  >
                    ${escapeHtml(c.name)}
                  </option>
                `).join("")}
              </select>
            </article>`
          : `<article class="card">
              <div class="section-caption">
                دسته‌ای برای گزارش وجود ندارد.
              </div>
            </article>`
      }
    </section>
  `;
}

// 9. صفحه تراکنش‌ها
function renderTransactions() {
  return `
    <section class="section">
      <div class="section-head">
        <div class="section-title">تراکنش‌ها</div>
      </div>

      <article class="card">
        <div class="section-caption">
          فهرست تراکنش‌ها هنوز به API متصل نشده است.
        </div>
      </article>
    </section>
  `;
}

// 10. نمایش صفحه
function render() {
  const titles = {
    home: "خانه",
    reports: "گزارش",
    transactions: "تراکنش‌ها"
  };

  if (pageTitle) {
    pageTitle.textContent = titles[state.page] || "خانه";
  }

  if (app) {
    app.innerHTML =
      state.page === "home"
        ? renderHome()
        : state.page === "reports"
          ? renderReports()
          : renderTransactions();
  }

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.page === state.page
    );
  });
}

// 11. جابه‌جایی بین صفحات
function navigate(page) {
  state.page = page;
  render();
}

function selectCategory(category) {
  state.selectedCategory = category;
  render();
}

// 12. تلاش مجدد
async function retryFinanceLoad() {
  financeData.loading = true;
  financeData.error = "";
  render();

  await loadFinanceData();
}

// 13. دریافت و ذخیره پاسخ API
async function loadFinanceData() {
  try {
    const data = await getFinanceHomeFromN8n();

    financeData.summary = {
      income: Number(data.summary.income) || 0,
      expense: Number(data.summary.expense) || 0,
      balance: Number(
        data.summary.balance ??
        (
          (Number(data.summary.income) || 0) -
          (Number(data.summary.expense) || 0)
        )
      ) || 0
    };

    financeData.topCategories =
      Array.isArray(data.topCategories)
        ? data.topCategories.map(c => ({
            name: String(c.name ?? "بدون دسته"),
            amount: Number(c.amount) || 0
          }))
        : [];

    financeData.loaded = true;

    if (
      !state.selectedCategory &&
      financeData.topCategories.length
    ) {
      state.selectedCategory =
        financeData.topCategories[0].name;
    }
  } catch (e) {
    financeData.error =
      e?.message || "خطای ناشناخته در اتصال به سرور";
  } finally {
    financeData.loading = false;
    render();
  }
}

// 14. منوی پایین صفحه
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    navigate(btn.dataset.page);
  });
});

// در دسترس بودن توابع برای دکمه‌های HTML
window.navigate = navigate;
window.selectCategory = selectCategory;
window.retryFinanceLoad = retryFinanceLoad;

// 15. اجرای اولیه
render();

// منتظر آماده شدن اطلاعات تلگرام می‌مانیم
(function waitForTelegramData(attempt = 0) {
  if (window.financeTelegram?.getInitData?.()) {
    loadFinanceData();
  } else if (attempt < 20) {
    setTimeout(
      () => waitForTelegramData(attempt + 1),
      150
    );
  } else {
    financeData.loading = false;
    financeData.error =
      "مینی‌اپ را از داخل تلگرام باز کن تا اطلاعات احراز هویت ارسال شود.";
    render();
  }
})();
