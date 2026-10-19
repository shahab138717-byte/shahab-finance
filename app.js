/*
  Finance Mini App
  اتصال مینی‌اپ تلگرام به n8n
*/

// ===============================
// 1. اتصال به Telegram WebApp SDK
// ===============================

(function initTelegramMiniApp() {
  function exposeTelegramData() {
    const tg = window.Telegram && window.Telegram.WebApp;

    window.financeTelegram = {
      ready: Boolean(tg),

      // فقط برای استفاده در رابط کاربری است؛
      // سرور نباید به این شناسه بدون اعتبارسنجی اعتماد کند.
      userId: tg?.initDataUnsafe?.user?.id ?? null,

      // این مقدار باید در سمت سرور اعتبارسنجی شود.
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

  if (window.Telegram && window.Telegram.WebApp) {
    exposeTelegramData();
  } else {
    const sdk = document.createElement("script");

    sdk.src = "https://telegram.org/js/telegram-web-app.js";

    sdk.onload = exposeTelegramData;

    sdk.onerror = () => {
      window.financeTelegram = {
        ready: false,
        userId: null,
        initData: "",

        getUserId() {
          return null;
        },

        getInitData() {
          return "";
        }
      };

      console.warn(
        "Telegram SDK بارگذاری نشد. صفحه را از داخل تلگرام باز کن."
      );
    };

    document.head.appendChild(sdk);
  }
})();


// =====================================
// 2. آدرس Webhook صفحه خانه در n8n
// =====================================

// این آدرس باید با Production URL در نود Webhook یکی باشد.
const FINANCE_HOME_WEBHOOK_URL =
  "https://n8n.mediasun.info/webhook/api/finance-home";


// =====================================
// 3. دریافت اطلاعات مالی از n8n
// =====================================

async function getFinanceHomeFromN8n() {
  const initData =
    window.financeTelegram?.getInitData?.() || "";

  if (!initData) {
    throw new Error(
      "اطلاعات تلگرام دریافت نشد؛ مینی‌اپ را از داخل تلگرام باز کن."
    );
  }

  const response = await fetch(FINANCE_HOME_WEBHOOK_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      initData: initData
    })
  });

  if (!response.ok) {
    throw new Error(
      `خطا در دریافت اطلاعات مالی (${response.status})`
    );
  }

  return await response.json();
}


// =====================================
// 4. اطلاعات نمونه فعلی رابط کاربری
// =====================================

const sampleData = {
  accounts: [
    {
      name: "حساب اصلی",
      balance: 125000000,
      income: 45000000,
      expense: 18500000
    },
    {
      name: "حساب پس‌انداز",
      balance: 78000000,
      income: 10000000,
      expense: 0
    },
    {
      name: "کارت روزمره",
      balance: 14500000,
      income: 8000000,
      expense: 6200000
    }
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
    "فروردین": [
      2800000, 3200000, 2600000,
      4100000, 3700000, 3850000
    ],

    "اردیبهشت": [
      1800000, 2400000, 2200000,
      3100000, 2900000, 3300000
    ],

    "خرداد": [
      2400000, 2900000, 3100000,
      3500000, 3200000, 3600000
    ]
  },

  transactions: [
    {
      title: "خرید مواد غذایی",
      category: "خوراک",
      amount: 850000,
      direction: -1,
      date: "۱۴۰۵/۰۶/۲۱",
      time: "۱۸:۴۵",
      account: "حساب اصلی"
    },
    {
      title: "واریز حقوق",
      category: "درآمد",
      amount: 25000000,
      direction: 1,
      date: "۱۴۰۵/۰۶/۲۰",
      time: "۰۹:۱۵",
      account: "حساب اصلی"
    },
    {
      title: "تاکسی اینترنتی",
      category: "حمل‌ونقل",
      amount: 320000,
      direction: -1,
      date: "۱۴۰۵/۰۶/۱۹",
      time: "۱۴:۲۰",
      account: "کارت روزمره"
    },
    {
      title: "قبض تلفن",
      category: "قبوض",
      amount: 185000,
      direction: -1,
      date: "۱۴۰۵/۰۶/۱۸",
      time: "۱۱:۰۵",
      account: "حساب اصلی"
    },
    {
      title: "واریز به پس‌انداز",
      category: "سرمایه‌گذاری",
      amount: 5000000,
      direction: -1,
      date: "۱۴۰۵/۰۶/۱۷",
      time: "۲۰:۱۰",
      account: "حساب اصلی"
    },
    {
      title: "برگشت وجه خرید",
      category: "درآمد",
      amount: 420000,
      direction: 1,
      date: "۱۴۰۵/۰۶/۱۶",
      time: "۱۳:۳۵",
      account: "کارت روزمره"
    },
    {
      title: "خرید پوشاک",
      category: "خرید",
      amount: 1250000,
      direction: -1,
      date: "۱۴۰۵/۰۶/۱۵",
      time: "۱۷:۴۰",
      account: "کارت روزمره"
    },
    {
      title: "رستوران",
      category: "خوراک",
      amount: 780000,
      direction: -1,
      date: "۱۴۰۵/۰۶/۱۴",
      time: "۲۱:۲۵",
      account: "کارت روزمره"
    },
    {
      title: "دریافت از حساب پس‌انداز",
      category: "سرمایه‌گذاری",
      amount: 3000000,
      direction: 1,
