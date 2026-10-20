
(() => {
  'use strict';

  // آدرس وب‌هوک اصلی n8n
  const API_URL =
    'https://n8n.mediasun.info/webhook/api/finance-home';

  const app = document.getElementById('app');

  if (!app) {
    console.error('عنصر app در index.html پیدا نشد.');
    return;
  }

  const state = {
    page: 'home',
    loading: true,
    error: '',
    data: null
  };

  // استایل‌های مستقل مینی‌اپ
  if (!document.getElementById('finance-app-styles')) {
    const style = document.createElement('style');
    style.id = 'finance-app-styles';

    style.textContent = `
      #app {
        direction: rtl;
        text-align: right;
        font-family: inherit;
        padding: 16px;
        padding-bottom: 100px;
        color: var(--tg-theme-text-color, #222);
      }

      #app * { box-sizing: border-box; }

      .fa-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 22px;
      }

      .fa-header h2 { margin: 0; font-size: 23px; }

      .fa-muted {
        color: var(--tg-theme-hint-color, #888);
        font-size: 13px;
      }

      .fa-card {
        background: var(--tg-theme-secondary-bg-color, #f4f5f7);
        border-radius: 18px;
        padding: 18px;
        margin-bottom: 14px;
      }

      .fa-balance {
        background: var(--tg-theme-button-color, #2481cc);
        color: var(--tg-theme-button-text-color, white);
      }

      .fa-balance .fa-muted { color: inherit; opacity: .8; }

      .fa-number {
        font-size: 25px;
        font-weight: 700;
        margin-top: 10px;
        overflow-wrap: anywhere;
      }

      .fa-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .fa-section-title {
        font-size: 17px;
        font-weight: 700;
        margin: 24px 0 12px;
      }

      .fa-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 13px 0;
        border-bottom: 1px solid var(--tg-theme-section-separator-color, #ddd);
      }

      .fa-row:last-child { border-bottom: 0; }

      .fa-row-name { font-weight: 600; overflow-wrap: anywhere; }

      .fa-row-amount {
        font-weight: 700;
        white-space: nowrap;
      }

      .fa-button {
        border: 0;
        border-radius: 12px;
        padding: 12px 18px;
        background: var(--tg-theme-button-color, #2481cc);
        color: var(--tg-theme-button-text-color, white);
        font-size: 14px;
        cursor: pointer;
      }

      .fa-message {
        text-align: center;
        padding: 40px 10px;
        line-height: 2;
      }

      .fa-error { color: #d94747; }

      .fa-empty {
        padding: 15px 0;
        color: var(--tg-theme-hint-color, #888);
        font-size: 14px;
      }

      .fa-nav {
        position: fixed;
        z-index: 100;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-around;
        padding: 10px 5px calc(10px + env(safe-area-inset-bottom));
        background: var(--tg-theme-bg-color, white);
        border-top: 1px solid var(--tg-theme-section-separator-color, #ddd);
      }

      .fa-nav button {
        flex: 1;
        border: 0;
        background: transparent;
        color: var(--tg-theme-hint-color, #888);
        padding: 8px 2px;
        font-size: 12px;
        cursor: pointer;
      }

      .fa-nav button.active {
        color: var(--tg-theme-button-color, #2481cc);
        font-weight: 700;
      }
    `;

    document.head.appendChild(style);
  }

  // آماده‌سازی SDK تلگرام
  const telegram = window.Telegram?.WebApp;

  if (telegram) {
    telegram.ready();
    telegram.expand();
  }

  function formatMoney(value) {
    const number = Number(value ?? 0);

    if (!Number.isFinite(number)) return '۰';

    return new Intl.NumberFormat('fa-IR', {
      maximumFractionDigits: 2
    }).format(number);
  }

  function getUserId() {
    return telegram?.initDataUnsafe?.user?.id
      ? String(telegram.initDataUnsafe.user.id)
      : '';
  }

  function renderMessage(message, isError = false) {
    app.innerHTML = `
      <div class="fa-message">
        <div class="${isError ? 'fa-error' : ''}">
          ${escapeHTML(message)}
        </div>
        ${
          isError
            ? '<button class="fa-button" id="fa-retry">تلاش مجدد</button>'
            : ''
        }
      </div>
    `;

    document.getElementById('fa-retry')?.addEventListener(
      'click',
      loadFinanceData
    );
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  // دریافت اطلاعات از n8n
  async function loadFinanceData() {
    state.loading = true;
    state.error = '';
    renderMessage('در حال دریافت اطلاعات مالی...');

    try {
      if (!telegram) {
        throw new Error(
          'تلگرام شناسایی نشد. مینی‌اپ را از داخل ربات باز کن.'
        );
      }

      // initData را کامل می‌فرستیم؛ n8n شناسه کاربر را استخراج می‌کند.
      const initData = telegram.initData;

      if (!initData) {
        throw new Error(
          'اطلاعات کاربر دریافت نشد. مینی‌اپ را مستقیماً از داخل تلگرام باز کن.'
        );
      }

      // استفاده از فرم برای جلوگیری از درخواست پیش‌پرواز CORS
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: 'initData=' + encodeURIComponent(initData)
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `خطای n8n (${response.status}): ${responseText.slice(0, 200)}`
        );
      }

      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          'پاسخ n8n JSON معتبر نیست. تنظیمات Respond to Webhook را بررسی کن.'
        );
      }

      // بعضی پاسخ‌های n8n ممکن است داخل آرایه برگردند.
      if (Array.isArray(result)) {
        result = result[0];
      }

      if (result?.json) {
        result = result.json;
      }

      if (result?.ok === false) {
        throw new Error(result.error || 'n8n نتوانست اطلاعات را دریافت کند.');
      }

      if (!result?.summary) {
        throw new Error(
          'پاسخ n8n فاقد summary است. خروجی نود ساخت پاسخ API را بررسی کن.'
        );
      }

      state.data = result;
      state.loading = false;
      state.error = '';
      render();
    } catch (error) {
      console.error('Finance Mini App:', error);

      state.loading = false;
      state.error = error.message || 'ارتباط با n8n برقرار نشد.';

      renderMessage(state.error, true);
    }
  }

  function renderHome() {
    const data = state.data;
    const summary = data.summary;
    const categories = Array.isArray(data.topCategories)
      ? data.topCategories
      : [];

    return `
      <div class="fa-header">
        <div>
          <h2>داشبورد مالی</h2>
          <div class="fa-muted">مدیریت مالی شخصی</div>
        </div>
        <div class="fa-muted">خانه</div>
      </div>

      <div class="fa-card fa-balance">
        <div class="fa-muted">موجودی خالص</div>
        <div class="fa-number">${formatMoney(summary.balance)}</div>
      </div>

      <div class="fa-grid">
        <div class="fa-card">
          <div class="fa-muted">مجموع درآمد</div>
          <div class="fa-number">${formatMoney(summary.income)}</div>
        </div>

        <div class="fa-card">
          <div class="fa-muted">مجموع هزینه</div>
          <div class="fa-number">${formatMoney(summary.expense)}</div>
        </div>
      </div>

      <div class="fa-section-title">۵ دسته پرکاربرد</div>

      <div class="fa-card">
        ${
          categories.length
            ? categories.slice(0, 5).map(category => `
                <div class="fa-row">
                  <div class="fa-row-name">${escapeHTML(category.name || 'بدون عنوان')}</div>
                  <div class="fa-row-amount">${formatMoney(category.amount)}</div>
                </div>
              `).join('')
            : '<div class="fa-empty">هنوز دسته‌ای برای نمایش وجود ندارد.</div>'
        }
      </div>

      <div class="fa-muted">شناسه کاربر: ${escapeHTML(data.userId || getUserId())}</div>
    `;
  }

  function renderReports() {
    const summary = state.data.summary;

    return `
      <div class="fa-header">
        <h2>گزارش مالی</h2>
      </div>

      <div class="fa-card">
        <div class="fa-muted">مجموع درآمد</div>
        <div class="fa-number">${formatMoney(summary.income)}</div>
      </div>

      <div class="fa-card">
        <div class="fa-muted">مجموع هزینه</div>
        <div class="fa-number">${formatMoney(summary.expense)}</div>
      </div>

      <div class="fa-card">
        <div class="fa-muted">تراز مالی</div>
        <div class="fa-number">${formatMoney(summary.balance)}</div>
      </div>

      <div class="fa-muted">
        گزارش‌ها بر اساس اطلاعاتی هستند که n8n از دیتابیس برگردانده است.
      </div>
    `;
  }

  function renderTransactions() {
    return `
      <div class="fa-header">
        <h2>تراکنش‌ها</h2>
      </div>

      <div class="fa-card">
        <div class="fa-empty">
          اتصال فهرست تراکنش‌ها به API هنوز پیاده‌سازی نشده است.
        </div>
        <button class="fa-button" id="fa-refresh">به‌روزرسانی اطلاعات</button>
      </div>
    `;
  }

  function renderNavigation() {
    let nav = document.getElementById('fa-navigation');

    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'fa-navigation';
      nav.className = 'fa-nav';
      document.body.appendChild(nav);
    }

    const pages = [
      { id: 'home', label: 'خانه', icon: '⌂' },
      { id: 'reports', label: 'گزارش', icon: '▤' },
      { id: 'transactions', label: 'تراکنش‌ها', icon: '↔' }
    ];

    nav.innerHTML = pages.map(page => `
      <button
        type="button"
        data-page="${page.id}"
        class="${state.page === page.id ? 'active' : ''}"
      >
        <div>${page.icon}</div>
        <div>${page.label}</div>
      </button>
    `).join('');

    nav.querySelectorAll('[data-page]').forEach(button => {
      button.addEventListener('click', () => {
        state.page = button.dataset.page;
        render();
      });
    });
  }

  function render() {
    if (!state.data) {
      renderMessage(state.error || 'در حال دریافت اطلاعات...');
      return;
    }

    if (state.page === 'reports') {
      app.innerHTML = renderReports();
    } else if (state.page === 'transactions') {
      app.innerHTML = renderTransactions();
    } else {
      app.innerHTML = renderHome();
    }

    document.getElementById('fa-refresh')?.addEventListener(
      'click',
      loadFinanceData
    );

    renderNavigation();
  }

  // شروع برنامه
  loadFinanceData();
})();
