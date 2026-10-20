(() => {
  'use strict';

  // آدرس وب‌هوک اصلی n8n
  const API_URL =
    'https://n8n.mediasun.info/webhook/api/finance-home';

  // آدرس وب‌هوک تراکنش‌ها
  const TRANSACTIONS_API_URL =
    'https://n8n.mediasun.info/webhook/api/finance-transactions';

  const app = document.getElementById('app');

  if (!app) {
    console.error('عنصر app در index.html پیدا نشد.');
    return;
  }

  const state = {
    page: 'home',
    loading: true,
    error: '',
    data: null,
    transactions: [],
    transactionsLoading: false,
    transactionsError: '',
    transactionsLoaded: false
  };

  // استایل‌های مینی‌اپ
  if (!document.getElementById('finance-app-styles')) {
    const style = document.createElement('style');
    style.id = 'finance-app-styles';

    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap');

      :root {
        --fa-bg: #f5f7fb;
        --fa-surface: #ffffff;
        --fa-text: #111827;
        --fa-muted: #6b7280;
        --fa-border: #e5e7eb;
        --fa-primary: #111827;
        --fa-green: #15803d;
        --fa-red: #dc2626;
        --fa-radius: 20px;
        --fa-shadow: 0 8px 30px rgba(15, 23, 42, .06);
      }

      body {
        margin: 0;
        background: var(--fa-bg);
        color: var(--fa-text);
        font-family: "Vazirmatn", Tahoma, sans-serif;
      }

      button {
        font: inherit;
        cursor: pointer;
      }

      /* فقط ظاهر بخش برنامه؛ منطق JavaScript تغییر نکرده است. */
      #app {
        direction: rtl;
        text-align: right;
        font-family: "Vazirmatn", Tahoma, sans-serif;
        width: 100%;
        max-width: 1100px;
        min-height: 100vh;
        margin: 0 auto;
        padding: 24px 20px 112px;
        color: var(--fa-text);
      }

      #app * {
        box-sizing: border-box;
      }

      .fa-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 22px;
      }

      .fa-header h2 {
        margin: 0;
        color: var(--fa-text);
        font-size: 25px;
        font-weight: 800;
      }

      .fa-muted {
        color: var(--fa-muted);
        font-size: 12px;
        line-height: 1.8;
      }

      .fa-card {
        background: var(--fa-surface);
        border: 1px solid var(--fa-border);
        border-radius: var(--fa-radius);
        box-shadow: var(--fa-shadow);
        padding: 18px;
        margin-bottom: 14px;
      }

      .fa-balance {
        background: linear-gradient(135deg, #ffffff, #f8fafc);
        color: var(--fa-text);
      }

      .fa-balance .fa-muted {
        color: var(--fa-muted);
        opacity: 1;
      }

      .fa-number {
        color: var(--fa-text);
        font-size: 25px;
        line-height: 1.7;
        font-weight: 800;
        margin-top: 7px;
        overflow-wrap: anywhere;
        letter-spacing: -.4px;
      }

      .fa-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .fa-grid .fa-card {
        min-width: 0;
        padding: 15px;
      }

      .fa-grid .fa-number {
        font-size: 19px;
      }

      .fa-section-title {
        color: var(--fa-text);
        font-size: 16px;
        font-weight: 800;
        margin: 22px 0 12px;
      }

      .fa-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 14px 0;
        border-bottom: 1px solid var(--fa-border);
      }

      .fa-row:last-child {
        border-bottom: 0;
      }

      .fa-row-name {
        color: var(--fa-text);
        font-size: 13px;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .fa-row-amount {
        color: var(--fa-text);
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
      }

      .fa-button {
        border: 1px solid var(--fa-border);
        border-radius: 13px;
        padding: 10px 13px;
        background: var(--fa-surface);
        color: var(--fa-text);
        box-shadow: var(--fa-shadow);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      .fa-message {
        text-align: center;
        padding: 40px 10px;
        line-height: 2;
        color: var(--fa-muted);
      }

      .fa-error {
        color: var(--fa-red);
      }

      .fa-empty {
        padding: 15px 0;
        color: var(--fa-muted);
        font-size: 13px;
      }

      .fa-nav {
        position: fixed;
        z-index: 100;
        bottom: calc(12px + env(safe-area-inset-bottom));
        left: 50%;
        right: auto;
        transform: translateX(-50%);
        width: min(calc(100% - 24px), 560px);
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 5px;
        padding: 8px;
        background: rgba(255, 255, 255, .94);
        -webkit-backdrop-filter: blur(18px);
        backdrop-filter: blur(18px);
        border: 1px solid var(--fa-border);
        border-radius: 21px;
        box-shadow: 0 12px 35px rgba(15, 23, 42, .12);
      }

      .fa-nav button {
        min-width: 0;
        border: 0;
        border-radius: 15px;
        background: transparent;
        color: var(--fa-muted);
        padding: 9px 6px;
        font-family: "Vazirmatn", Tahoma, sans-serif;
        font-size: 10px;
        line-height: 1.6;
        font-weight: 600;
        cursor: pointer;
      }

      .fa-nav button.active {
        background: var(--fa-primary);
        color: #ffffff;
        font-weight: 700;
      }

      /* اگر نوار ناوبری نمونه قدیمی در HTML مانده باشد، از نمایش تکراری جلوگیری می‌شود. */
      .bottom-nav {
        display: none !important;
      }

      @media (max-width: 380px) {
        #app {
          padding: 20px 14px 108px;
        }

        .fa-header h2 {
          font-size: 22px;
        }

        .fa-number {
          font-size: 21px;
        }

        .fa-grid {
          gap: 8px;
        }

        .fa-grid .fa-card {
          padding: 12px;
        }

        .fa-grid .fa-number {
          font-size: 16px;
        }
      }

      @media (min-width: 700px) {
        #app {
          padding: 32px 28px 120px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // آماده‌سازی تلگرام
  const telegram = window.Telegram?.WebApp;

  if (telegram) {
    telegram.ready();
    telegram.expand();
  }

  // نمایش اعداد فارسی
  function formatMoney(value) {
    const number = Number(value ?? 0);

    if (!Number.isFinite(number)) return '۰';

    return new Intl.NumberFormat('fa-IR', {
      maximumFractionDigits: 2
    }).format(number);
  }

  // شناسه کاربر تلگرام
  function getUserId() {
    return telegram?.initDataUnsafe?.user?.id
      ? String(telegram.initDataUnsafe.user.id)
      : '';
  }

  // امن‌سازی متن‌های ورودی
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  // نمایش خطا و دکمه تلاش مجدد
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

  // درخواست اطلاعات داشبورد از n8n
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

      const initData = telegram.initData;

      if (!initData) {
        throw new Error(
          'اطلاعات کاربر دریافت نشد. مینی‌اپ را مستقیماً از داخل تلگرام باز کن.'
        );
      }

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
          'پاسخ n8n معتبر نیست. خروجی Respond to Webhook را بررسی کن.'
        );
      }

      if (Array.isArray(result)) result = result[0];
      if (result?.json) result = result.json;

      if (result?.ok === false) {
        throw new Error(result.error || 'دریافت اطلاعات ناموفق بود.');
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

  // صفحه خانه
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
        <div class="fa-number">${formatMoney(summary.balance)} تومان</div>
      </div>

      <div class="fa-grid">
        <div class="fa-card">
          <div class="fa-muted">مجموع درآمد</div>
          <div class="fa-number">${formatMoney(summary.income)}</div>
          <div class="fa-muted">تومان</div>
        </div>

        <div class="fa-card">
          <div class="fa-muted">مجموع هزینه</div>
          <div class="fa-number">${formatMoney(summary.expense)}</div>
          <div class="fa-muted">تومان</div>
        </div>
      </div>

      <div class="fa-section-title">۵ دسته پرهزینه</div>

      <div class="fa-card">
        ${
          categories.length
            ? categories.slice(0, 5).map(category => `
                <div class="fa-row">
                  <div class="fa-row-name">
                    ${escapeHTML(category.name || 'بدون عنوان')}
                  </div>
                  <div class="fa-row-amount">
                    ${formatMoney(category.amount)} تومان
                  </div>
                </div>
              `).join('')
            : '<div class="fa-empty">هنوز دسته‌ای برای نمایش وجود ندارد.</div>'
        }
      </div>

      <div class="fa-muted">
        شناسه کاربر: ${escapeHTML(data.userId || getUserId())}
      </div>
    `;
  }

  // صفحه گزارش
  function renderReports() {
    const summary = state.data.summary;

    return `
      <div class="fa-header">
        <h2>گزارش مالی</h2>
      </div>

      <div class="fa-card">
        <div class="fa-muted">مجموع درآمد</div>
        <div class="fa-number">${formatMoney(summary.income)} تومان</div>
      </div>

      <div class="fa-card">
        <div class="fa-muted">مجموع هزینه</div>
        <div class="fa-number">${formatMoney(summary.expense)} تومان</div>
      </div>

      <div class="fa-card">
        <div class="fa-muted">تراز مالی</div>
        <div class="fa-number">${formatMoney(summary.balance)} تومان</div>
      </div>

      <div class="fa-muted">
        گزارش‌ها بر اساس اطلاعاتی هستند که n8n از دیتابیس برگردانده است.
      </div>
    `;
  }

  // دریافت فهرست تراکنش‌ها
  async function loadTransactions() {
    const userId = getUserId();

    if (!telegram || !userId) {
      state.transactionsError =
        'شناسه تلگرام پیدا نشد. مینی‌اپ را از داخل ربات تلگرام باز کن.';
      state.transactionsLoading = false;
      state.transactionsLoaded = true;
      render();
      return;
    }

    state.transactionsLoading = true;
    state.transactionsError = '';
    render();

    try {
      const response = await fetch(TRANSACTIONS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: 'userId=' + encodeURIComponent(userId)
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
          'پاسخ وب‌هوک تراکنش‌ها JSON معتبر نیست.'
        );
      }

      if (Array.isArray(result)) result = result[0];
      if (result?.json) result = result.json;

      if (result?.ok === false) {
        throw new Error(result.error || 'دریافت تراکنش‌ها ناموفق بود.');
      }

      state.transactions = Array.isArray(result?.transactions)
        ? result.transactions
        : [];
    } catch (error) {
      console.error('Finance transactions:', error);
      state.transactionsError =
        error.message || 'دریافت تراکنش‌ها ناموفق بود.';
    } finally {
      state.transactionsLoading = false;
      state.transactionsLoaded = true;
      render();
    }
  }

  // صفحه تراکنش‌ها
  function renderTransactions() {
    const transactions = state.transactions || [];

    return `
      <div class="fa-header">
        <div>
          <h2>تراکنش‌ها</h2>
          <div class="fa-muted">آخرین ۵۰ تراکنش</div>
        </div>

        <button class="fa-button" id="fa-refresh-transactions" type="button">
          به‌روزرسانی
        </button>
      </div>

      ${
        state.transactionsLoading
          ? '<div class="fa-card"><div class="fa-empty">در حال دریافت تراکنش‌ها...</div></div>'
          : ''
      }

      ${
        state.transactionsError
          ? `<div class="fa-card"><div class="fa-error">${escapeHTML(state.transactionsError)}</div></div>`
          : ''
      }

      ${
        !state.transactionsLoading &&
        !state.transactionsError &&
        transactions.length === 0
          ? '<div class="fa-card"><div class="fa-empty">تراکنشی برای نمایش پیدا نشد.</div></div>'
          : ''
      }

      <div class="fa-card">
        ${
          transactions.map(tx => {
            const incoming = Number(tx.direction) === 1;
            const amount = formatMoney(tx.amount);
            const dateTime = [tx.date, tx.time].filter(Boolean).join('، ');
            const details = [dateTime, tx.account, tx.description]
              .filter(Boolean)
              .map(escapeHTML)
              .join(' · ');

            return `
              <div class="fa-row">
                <div style="min-width:0; flex:1;">
                  <div class="fa-row-name">
                    ${escapeHTML(tx.title || 'تراکنش بدون عنوان')}
                  </div>
                  <div class="fa-muted" style="margin-top:5px;">
                    ${details || 'بدون توضیحات'}
                  </div>
                </div>

                <div
                  class="fa-row-amount"
                  style="color:${incoming ? '#15803d' : '#dc2626'};"
                >
                  ${incoming ? '+' : '−'} ${amount} تومان
                </div>
              </div>
            `;
          }).join('')
        }
      </div>
    `;
  }

  // نوار پایین برنامه
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

  // نمایش صفحه انتخاب‌شده
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

    document.getElementById('fa-refresh-transactions')?.addEventListener(
      'click',
      () => {
        state.transactionsLoaded = false;
        loadTransactions();
      }
    );

    renderNavigation();

    // هنگام ورود به صفحه تراکنش‌ها، اطلاعات دریافت شود
    if (
      state.page === 'transactions' &&
      !state.transactionsLoading &&
      !state.transactionsLoaded
    ) {
      loadTransactions();
    }
  }

  // اجرای اولیه
  loadFinanceData();
})();
