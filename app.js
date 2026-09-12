/*
  Finance Mini App
  -----------------
  Static frontend prototype prepared for GitHub Pages.

  Later, replace the sample data/API functions with n8n Webhook endpoints.
  Keep the returned JSON shape close to these objects so the UI needs minimal changes.
*/

const sampleData = {
  accounts: [
    { name: "حساب اصلی", balance: 125000000, income: 45000000, expense: 18500000 },
    { name: "حساب پس‌انداز", balance: 78000000, income: 10000000, expense: 0 },
    { name: "کارت روزمره", balance: 14500000, income: 8000000, expense: 6200000 }
  ],
  savings: 26500000,
  topCategories: [
    { name: "خوراک", amount: 3850000 },
    { name: "حمل‌ونقل", amount: 2700000 },
    { name: "خرید", amount: 2350000 },
    { name: "قبوض", amount: 1800000 },
    { name: "سرگرمی", amount: 1250000 }
  ],
  monthly: {
    "فروردین": [2800000, 3200000, 2600000, 4100000, 3700000, 3850000],
    "اردیبهشت": [1800000, 2400000, 2200000, 3100000, 2900000, 3300000],
    "خرداد": [2400000, 2900000, 3100000, 3500000, 3200000, 3600000]
  },
  transactions: [
    { title:"خرید مواد غذایی", category:"خوراک", amount:850000, direction:-1, date:"۱۴۰۵/۰۶/۲۱", time:"۱۸:۴۵", account:"حساب اصلی" },
    { title:"واریز حقوق", category:"درآمد", amount:25000000, direction:1, date:"۱۴۰۵/۰۶/۲۰", time:"۰۹:۱۵", account:"حساب اصلی" },
    { title:"تاکسی اینترنتی", category:"حمل‌ونقل", amount:320000, direction:-1, date:"۱۴۰۵/۰۶/۱۹", time:"۱۴:۲۰", account:"کارت روزمره" },
    { title:"قبض تلفن", category:"قبوض", amount:185000, direction:-1, date:"۱۴۰۵/۰۶/۱۸", time:"۱۱:۰۵", account:"حساب اصلی" },
    { title:"واریز به پس‌انداز", category:"سرمایه‌گذاری", amount:5000000, direction:-1, date:"۱۴۰۵/۰۶/۱۷", time:"۲۰:۱۰", account:"حساب اصلی" },
    { title:"برگشت وجه خرید", category:"درآمد", amount:420000, direction:1, date:"۱۴۰۵/۰۶/۱۶", time:"۱۳:۳۵", account:"کارت روزمره" },
    { title:"خرید پوشاک", category:"خرید", amount:1250000, direction:-1, date:"۱۴۰۵/۰۶/۱۵", time:"۱۷:۴۰", account:"کارت روزمره" },
    { title:"رستوران", category:"خوراک", amount:780000, direction:-1, date:"۱۴۰۵/۰۶/۱۴", time:"۲۱:۲۵", account:"کارت روزمره" },
    { title:"دریافت از حساب پس‌انداز", category:"سرمایه‌گذاری", amount:3000000, direction:1, date:"۱۴۰۵/۰۶/۱۳", time:"۱۰:۳۰", account:"حساب اصلی" }
  ]
};

const state = {
  page: "home",
  selectedMonth: "فروردین",
  selectedCategory: "خوراک",
  visibleTransactions: 5,
  loading: false
};

const app = document.getElementById("app");
const pageTitle = document.getElementById("pageTitle");

function toman(n) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}
function compact(n) {
  return new Intl.NumberFormat("fa-IR").format(n);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function renderHome() {
  const max = Math.max(...sampleData.topCategories.map(x => x.amount));
  return `
    <section class="section">
      <div class="section-head">
        <div class="section-title">حساب‌های من</div>
        <div class="section-caption">وضعیت فعلی</div>
      </div>
      <div class="account-scroller">
        ${sampleData.accounts.map(a => `
          <article class="card account-card">
            <div class="account-name">${escapeHtml(a.name)}</div>
            <div class="balance">${compact(a.balance)} <span class="currency">تومان</span></div>
            <div class="account-stats">
              <div><div class="stat-label">درآمد</div><div class="stat-value income">+ ${compact(a.income)}</div></div>
              <div><div class="stat-label">هزینه</div><div class="stat-value expense">− ${compact(a.expense)}</div></div>
            </div>
          </article>`).join("")}
      </div>
    </section>

    <section class="section">
      <article class="card savings-card">
        <div>
          <div class="section-caption">پس‌انداز در این دوره</div>
          <div class="savings-value">${toman(sampleData.savings)}</div>
        </div>
        <div class="savings-badge">↗</div>
      </article>
    </section>

    <section class="section">
      <div class="section-head">
        <div class="section-title">بیشترین هزینه در ۳۰ روز گذشته</div>
        <div class="section-caption">۵ دسته</div>
      </div>
      <div class="category-list">
        ${sampleData.topCategories.map(c => `
          <article class="card category-row">
            <div class="category-top">
              <div class="category-name">${escapeHtml(c.name)}</div>
              <div class="category-amount">${toman(c.amount)}</div>
            </div>
            <div class="progress"><span style="width:${Math.round(c.amount / max * 100)}%"></span></div>
          </article>`).join("")}
      </div>
      <button class="primary-button" onclick="navigate('reports')">گزارش‌گیری</button>
    </section>
  `;
}

function renderReports() {
  const values = sampleData.monthly[state.selectedMonth];
  const max = Math.max(...values);
  const months = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور"];
  const total = values.reduce((a,b) => a+b, 0);
  return `
    <section class="section">
      <div class="section-head">
        <div class="section-title">گزارش ماهانه</div>
        <div class="section-caption">انتخاب ماه</div>
      </div>
      <div class="months">
        ${months.map(m => `<button class="month-chip ${m===state.selectedMonth?'active':''}" onclick="selectMonth('${m}')">${m} ۱۴۰۵</button>`).join("")}
      </div>
    </section>

    <section class="section">
      <div class="summary-grid">
        <article class="card summary-card"><div class="stat-label">درآمد</div><div class="summary-value income">۴۵,۰۰۰,۰۰۰</div></article>
        <article class="card summary-card"><div class="stat-label">هزینه</div><div class="summary-value expense">${compact(total)}</div></article>
        <article class="card summary-card"><div class="stat-label">پس‌انداز</div><div class="summary-value income">۲۶,۵۰۰,۰۰۰</div></article>
      </div>
    </section>

    <section class="section">
      <article class="card report-card">
        <div class="report-header">
          <div><div class="section-caption">هزینه ماهانه دسته «${escapeHtml(state.selectedCategory)}»</div><div class="report-total">${toman(total)}</div></div>
        </div>
        <div class="chart">
          ${values.map((v,i) => `
            <div class="bar-wrap">
              <div class="bar-value">${compact(Math.round(v/1000000*10)/10)}م</div>
              <div class="bar" style="height:${Math.max(6, Math.round(v/max*82))}%"></div>
              <div class="bar-label">${months[i]}</div>
            </div>`).join("")}
        </div>
      </article>
    </section>

    <section class="section">
      <div class="section-head"><div class="section-title">تحلیل دسته‌بندی</div></div>
      <select class="select" onchange="selectCategory(this.value)">
        ${["خوراک","حمل‌ونقل","خرید","قبوض","سرگرمی","پوشاک","سرمایه‌گذاری"].map(c => `<option ${c===state.selectedCategory?'selected':''}>${c}</option>`).join("")}
      </select>
      <p class="section-caption" style="margin:10px 4px 0">یک دسته را انتخاب کن تا روند هزینه آن را در ماه‌های مختلف ببینی.</p>
    </section>
  `;
}

function transactionHTML(t) {
  const incoming = t.direction === 1;
  return `
    <article class="card transaction">
      <div class="tx-icon ${incoming?'in':'out'}">${incoming?'↓':'↑'}</div>
      <div>
        <div class="tx-title">${escapeHtml(t.title)}</div>
        <div class="tx-meta">${escapeHtml(t.category)} · ${escapeHtml(t.account)} · ${t.date} · ${t.time}</div>
      </div>
      <div class="tx-amount ${incoming?'income':'expense'}">${incoming?'+':'−'} ${compact(t.amount)}</div>
    </article>
  `;
}

function renderTransactions() {
  const visible = sampleData.transactions.slice(0, state.visibleTransactions);
  const hasMore = state.visibleTransactions < sampleData.transactions.length;
  return `
    <section class="section">
      <div class="section-head">
        <div class="section-title">تراکنش‌ها</div>
        <div class="section-caption">جدیدترین‌ها</div>
      </div>
      <div class="transactions" id="transactionList">
        ${visible.map(transactionHTML).join("")}
      </div>
      ${hasMore ? `<div class="loading" id="loadMore">برای دیدن تراکنش‌های بیشتر اسکرول کن…</div>` : `<div class="loading">همه تراکنش‌ها نمایش داده شدند</div>`}
    </section>
  `;
}

function render() {
  const titles = {home:"خانه", reports:"گزارش", transactions:"تراکنش‌ها"};
  pageTitle.textContent = titles[state.page];
  app.innerHTML = state.page === "home" ? renderHome() :
                  state.page === "reports" ? renderReports() : renderTransactions();

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === state.page);
  });
  window.scrollTo({top:0, behavior:"smooth"});
}

function navigate(page) {
  state.page = page;
  render();
}
function selectMonth(month) {
  state.selectedMonth = month;
  render();
}
function selectCategory(category) {
  state.selectedCategory = category;
  render();
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => navigate(btn.dataset.page));
});

window.addEventListener("scroll", () => {
  if (state.page !== "transactions" || state.loading) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 250) {
    if (state.visibleTransactions < sampleData.transactions.length) {
      state.loading = true;
      const loader = document.getElementById("loadMore");
      if (loader) loader.textContent = "در حال بارگذاری…";
      setTimeout(() => {
        state.visibleTransactions = Math.min(state.visibleTransactions + 4, sampleData.transactions.length);
        state.loading = false;
        render();
      }, 350);
    }
  }
});

render();

/*
  n8n integration example:

  async function getDashboard() {
    const response = await fetch("YOUR_N8N_WEBHOOK_URL");
    const data = await response.json();
    // Replace sampleData with API data, then call render().
  }

  Recommended API endpoints:
  GET /dashboard
  GET /transactions?limit=20&offset=0
  GET /reports/monthly?year=1405&month=6
  GET /reports/category?category=خوراک
*/
