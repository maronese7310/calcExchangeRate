"use strict";

// ===== 定数 =====
const API_URL = "https://api.exchangerate.fun/latest?base=JPY";
const STORAGE_KEY_RATES = "fxRatesData";
const STORAGE_KEY_HOME_LIST = "fxHomeList";
const STORAGE_KEY_ACTIVE_STATE = "fxActiveState";
const BASE_CODE = "JPY";
const DEFAULT_AMOUNT = 1000;

// ===== 状態 =====
let ratesData = null; // { timestamp, base, rates, fetchedDate }
let homeList = []; // 例: ["JPY", "USD", "EUR"]
let activeCode = BASE_CODE;
let activeAmount = DEFAULT_AMOUNT;

// ===== DOM参照 =====
const splashView = document.getElementById("splashView");
const splashSubtext = document.getElementById("splashSubtext");
const mainView = document.getElementById("mainView");
const searchView = document.getElementById("searchView");
const currencyListEl = document.getElementById("currencyList");
const searchResultsEl = document.getElementById("searchResults");
const searchInputEl = document.getElementById("searchInput");
const rateTimestampEl = document.getElementById("rateTimestamp");
const addButton = document.getElementById("addButton");
const closeSearchButton = document.getElementById("closeSearchButton");
const toastEl = document.getElementById("toast");
const toastMessageEl = document.getElementById("toastMessage");

// ===== 数字入力欄の幅を内容に合わせて可変にするためのミラー要素 =====
const amountMirror = document.createElement("span");
amountMirror.className = "amount-mirror";
document.body.appendChild(amountMirror);

// 入力欄の幅を表示中の文字列の実測幅に合わせる(下罫線が数字部分だけにつくようにするため)
function sizeAmountInput(input) {
  amountMirror.textContent = input.value || "0";
  const width = amountMirror.getBoundingClientRect().width;
  input.style.width = Math.ceil(width) + 4 + "px";
}

// ===== ユーティリティ =====

// デバイスのローカル日付を "YYYY-MM-DD" 形式で返す
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// UNIXタイムスタンプ(秒)をJSTの "YYYY-MM-DD HH:MM(JST)" 形式に変換
function formatTimestampJST(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  // sv-SEロケールは "YYYY-MM-DD HH:MM:SS" 形式を返すため利用する
  const jstStr = d.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" });
  const [datePart, timePart] = jstStr.split(" ");
  const hm = timePart.slice(0, 5);
  return `${datePart} ${hm}(JST)`;
}

// レート値に応じた小数点以下の桁数を決定する
// ・0.1未満: 小数第2位まで
// ・1未満: 小数第1位まで
// ・1以上: 整数(3桁カンマ区切り)
function decimalPlacesForRate(rate) {
  if (rate < 0.1) return 2;
  if (rate < 1) return 1;
  return 0;
}

// 数値を通貨コードに応じたフォーマット(3桁区切り+小数桁)に変換
function formatAmount(value, code) {
  const rate = ratesData.rates[code];
  const decimals = rate === undefined ? 0 : decimalPlacesForRate(rate);
  if (!isFinite(value)) value = 0;
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// カンマ区切り文字列 -> 数値
function parseAmount(str) {
  const cleaned = String(str).replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// activeCode/activeAmount を基準に、指定通貨の換算後の数値を返す
function convertedValue(code) {
  if (code === activeCode) return activeAmount;
  const baseRate = ratesData.rates[activeCode] !== undefined ? ratesData.rates[activeCode] : (activeCode === BASE_CODE ? 1 : undefined);
  const targetRate = ratesData.rates[code] !== undefined ? ratesData.rates[code] : (code === BASE_CODE ? 1 : undefined);
  if (baseRate === undefined || targetRate === undefined || baseRate === 0) return 0;
  return activeAmount * (targetRate / baseRate);
}

// type: "success"(緑丸チェック付き) または "info"(アイコンなし)
function showToast(message, type = "info") {
  toastMessageEl.textContent = message;
  toastEl.classList.toggle("success", type === "success");
  toastEl.classList.remove("hidden");
  toastEl.classList.add("show");
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toastEl.classList.remove("show");
    window.setTimeout(() => toastEl.classList.add("hidden"), 200);
  }, 1800);
}

// ===== localStorage =====

function getStoredRates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RATES);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveRates(data) {
  localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(data));
}

function loadHomeListAndActiveState() {
  let list;
  try {
    list = JSON.parse(localStorage.getItem(STORAGE_KEY_HOME_LIST));
  } catch (e) {
    list = null;
  }
  if (!Array.isArray(list) || list.length === 0) {
    list = [BASE_CODE];
  }
  if (!list.includes(BASE_CODE)) {
    list.unshift(BASE_CODE);
  }
  homeList = list;

  let state;
  try {
    state = JSON.parse(localStorage.getItem(STORAGE_KEY_ACTIVE_STATE));
  } catch (e) {
    state = null;
  }
  if (state && homeList.includes(state.code) && isFinite(state.amount)) {
    activeCode = state.code;
    activeAmount = state.amount;
  } else {
    activeCode = homeList[0];
    activeAmount = DEFAULT_AMOUNT;
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY_HOME_LIST, JSON.stringify(homeList));
  localStorage.setItem(
    STORAGE_KEY_ACTIVE_STATE,
    JSON.stringify({ code: activeCode, amount: activeAmount })
  );
}

// ===== API取得 =====

async function fetchRates() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error("為替レートAPIの取得に失敗しました (status: " + res.status + ")");
  }
  const data = await res.json();
  if (!data || !data.rates) {
    throw new Error("為替レートAPIのレスポンス形式が不正です");
  }
  return {
    timestamp: data.timestamp,
    base: data.base,
    rates: data.rates,
    fetchedDate: todayStr(),
  };
}

function showSplashError(message) {
  splashSubtext.textContent = message;
  let retryBtn = document.getElementById("splashRetryButton");
  if (!retryBtn) {
    retryBtn = document.createElement("button");
    retryBtn.id = "splashRetryButton";
    retryBtn.className = "retry-button";
    retryBtn.textContent = "再試行";
    retryBtn.addEventListener("click", () => {
      splashSubtext.textContent = "為替データの取得中です";
      retryBtn.remove();
      init();
    });
    splashView.appendChild(retryBtn);
  }
}

async function init() {
  const cached = getStoredRates();
  if (cached && cached.fetchedDate === todayStr()) {
    ratesData = cached;
    startApp();
    return;
  }
  try {
    const fresh = await fetchRates();
    ratesData = fresh;
    saveRates(fresh);
    startApp();
  } catch (e) {
    // エラー時はメイン画面へ遷移せず、エラーメッセージを表示する
    if (cached) {
      // 取得済みの古いデータがあればそれを使って起動する(オフライン対応の妥協策)
      ratesData = cached;
      startApp();
      showToast("最新レートの取得に失敗しました。前回取得分を表示しています", "info");
    } else {
      showSplashError("為替レートの取得に失敗しました。通信環境をご確認のうえ再試行してください。");
    }
  }
}

function startApp() {
  loadHomeListAndActiveState();
  splashView.classList.add("hidden");
  mainView.classList.remove("hidden");
  rateTimestampEl.textContent = "レート基準時刻：" + formatTimestampJST(ratesData.timestamp);
  renderMainList();
}

// ===== メイン画面描画 =====

function flagUrl(code) {
  const master = CURRENCY_MAP.get(code);
  const iso2 = master ? master.iso2 : null;
  if (!iso2) return null;
  // SVG(ベクター画像)を使うことで、どのサイズで表示しても輪郭が荒くならないようにする
  return `https://flagcdn.com/${iso2}.svg`;
}

function renderMainList() {
  currencyListEl.innerHTML = "";
  homeList.forEach((code) => {
    currencyListEl.appendChild(buildCurrencyRow(code));
  });
}

const TRASH_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3 6 5 6 21 6"></polyline>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
  <path d="M10 11v6"></path>
  <path d="M14 11v6"></path>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
</svg>`;

const SWIPE_OPEN_OFFSET = -78;

function buildCurrencyRow(code) {
  const master = CURRENCY_MAP.get(code) || { nameJa: code, nameEn: code };
  const li = document.createElement("li");
  li.className = "currency-row";
  li.dataset.code = code;

  // 左スワイプで現れる削除(ゴミ箱)アクション
  if (code !== BASE_CODE) {
    const deleteAction = document.createElement("div");
    deleteAction.className = "row-delete-action";
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-button";
    deleteBtn.setAttribute("aria-label", "削除");
    deleteBtn.innerHTML = TRASH_ICON_SVG;
    deleteBtn.addEventListener("click", () => {
      removeCurrency(code);
    });
    deleteAction.appendChild(deleteBtn);
    li.appendChild(deleteAction);
  }

  const content = document.createElement("div");
  content.className = "row-content";

  const flagWrap = document.createElement("div");
  flagWrap.className = "flag-wrap";

  const flag = document.createElement("img");
  flag.className = "flag-icon";
  flag.alt = code;
  const url = flagUrl(code);
  if (url) {
    flag.src = url;
  }
  flag.onerror = () => {
    flag.style.visibility = "hidden";
  };

  const badge = document.createElement("span");
  badge.className = "base-badge" + (code === BASE_CODE ? " filled" : "");

  flagWrap.appendChild(flag);
  flagWrap.appendChild(badge);

  const info = document.createElement("div");
  info.className = "currency-info";
  const nameEl = document.createElement("div");
  nameEl.className = "currency-name";
  nameEl.textContent = master.nameJa;
  const codeEl = document.createElement("div");
  codeEl.className = "currency-code";
  codeEl.textContent = code;
  info.appendChild(nameEl);
  info.appendChild(codeEl);

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "decimal";
  input.className = "amount-input";
  input.value = formatAmount(convertedValue(code), code);
  sizeAmountInput(input);

  input.addEventListener("focus", () => {
    activeCode = code;
    input.value = String(convertedValue(code));
    sizeAmountInput(input);
    input.select();
  });

  input.addEventListener("input", () => {
    activeAmount = parseAmount(input.value);
    sizeAmountInput(input);
    updateOtherRowsLive(code);
  });

  input.addEventListener("blur", () => {
    confirmActiveInput(code);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      input.blur();
    }
  });

  content.appendChild(flagWrap);
  content.appendChild(info);
  content.appendChild(input);
  li.appendChild(content);

  if (code !== BASE_CODE) {
    attachSwipeToDelete(content);
  }

  return li;
}

// 通貨行を左スワイプするとゴミ箱ボタンが現れるようにする(ポインターイベントでタッチ/マウス両対応)
function attachSwipeToDelete(content) {
  let startX = 0;
  let baseX = 0;
  let currentX = 0;
  let dragging = false;
  let moved = false;
  let wasOpen = false;

  content.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = false;
    startX = e.clientX;
    baseX = currentX;
    wasOpen = currentX === SWIPE_OPEN_OFFSET;
    content.style.transition = "none";
    try {
      content.setPointerCapture(e.pointerId);
    } catch (err) {
      /* noop */
    }
  });

  content.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    if (Math.abs(delta) > 4) moved = true;
    let next = baseX + delta;
    next = Math.min(0, Math.max(SWIPE_OPEN_OFFSET, next));
    currentX = next;
    content.style.transform = `translateX(${next}px)`;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    content.style.transition = "transform 0.2s ease";

    let shouldOpen;
    if (!moved && wasOpen) {
      // 開いている行を単純タップした場合は閉じる
      shouldOpen = false;
    } else if (!moved && !wasOpen) {
      // 閉じている行を単純タップした場合は何もしない(通常のフォーカス動作に任せる)
      dragging = false;
      return;
    } else {
      shouldOpen = currentX < SWIPE_OPEN_OFFSET / 2;
    }

    currentX = shouldOpen ? SWIPE_OPEN_OFFSET : 0;
    content.style.transform = `translateX(${currentX}px)`;
    if (shouldOpen) {
      closeOtherSwipeRows(content);
    }

    // ドラッグ、または開いた行を閉じる操作の直後は、続くクリック(入力欄フォーカス)を抑止する
    const suppress = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      content.removeEventListener("click", suppress, true);
    };
    content.addEventListener("click", suppress, true);
  }

  content.addEventListener("pointerup", endDrag);
  content.addEventListener("pointercancel", endDrag);

  content._closeSwipe = () => {
    currentX = 0;
    content.style.transition = "transform 0.2s ease";
    content.style.transform = "translateX(0)";
  };
}

function closeOtherSwipeRows(exceptContent) {
  currencyListEl.querySelectorAll(".row-content").forEach((el) => {
    if (el !== exceptContent && el._closeSwipe) {
      el._closeSwipe();
    }
  });
}

// アクティブ行の入力中、他の行の表示だけをその場で更新する(DOM再構築なし)
function updateOtherRowsLive(activeRowCode) {
  const rows = currencyListEl.querySelectorAll(".currency-row");
  rows.forEach((row) => {
    const code = row.dataset.code;
    if (code === activeRowCode) return;
    const input = row.querySelector(".amount-input");
    if (input) {
      input.value = formatAmount(convertedValue(code), code);
      sizeAmountInput(input);
    }
  });
}

// 入力確定(blur/Enter)時: 該当通貨をリスト先頭へ移動し、状態を保存して再描画する
function confirmActiveInput(code) {
  activeCode = code;
  homeList = [code, ...homeList.filter((c) => c !== code)];
  persistState();
  renderMainList();
}

function removeCurrency(code) {
  if (code === BASE_CODE) return;
  const master = CURRENCY_MAP.get(code);
  homeList = homeList.filter((c) => c !== code);
  if (activeCode === code) {
    activeCode = homeList[0];
    activeAmount = DEFAULT_AMOUNT;
  }
  persistState();
  renderMainList();
  showToast(`${master ? master.nameJa : code} を削除しました`, "success");
}

// ===== 検索/追加画面 =====

function openSearchView() {
  searchInputEl.value = "";
  renderSearchResults("");
  searchView.classList.remove("hidden");
  mainView.classList.add("hidden");
  window.setTimeout(() => searchInputEl.focus(), 50);
}

function closeSearchView() {
  searchView.classList.add("hidden");
  mainView.classList.remove("hidden");
  renderMainList();
}

function renderSearchResults(query) {
  const q = query.trim().toLowerCase();
  searchResultsEl.innerHTML = "";

  // JPYは常時登録・削除不可のため候補から除外し、それ以外は常に一覧に残す
  const candidates = CURRENCIES.filter((c) => c.code !== BASE_CODE);
  const filtered = q
    ? candidates.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.nameJa.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q)
      )
    : candidates;

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "search-empty";
    empty.textContent = "該当する通貨が見つかりません";
    searchResultsEl.appendChild(empty);
    return;
  }

  filtered.forEach((c) => {
    const li = document.createElement("li");
    li.className = "search-result-row";

    const flag = document.createElement("img");
    flag.className = "flag-icon";
    flag.alt = c.code;
    const url = flagUrl(c.code);
    if (url) flag.src = url;
    flag.onerror = () => {
      flag.style.visibility = "hidden";
    };

    const info = document.createElement("div");
    info.className = "currency-info";
    const nameEl = document.createElement("div");
    nameEl.className = "currency-name";
    nameEl.textContent = c.nameJa;
    const codeEl = document.createElement("div");
    codeEl.className = "currency-code";
    codeEl.textContent = `${c.code} (${c.nameEn})`;
    info.appendChild(nameEl);
    info.appendChild(codeEl);

    const inHome = homeList.includes(c.code);
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-row-button " + (inHome ? "remove" : "add");
    toggleBtn.setAttribute("aria-label", inHome ? "削除" : "追加");
    toggleBtn.textContent = inHome ? "－" : "＋";
    toggleBtn.addEventListener("click", () => {
      if (inHome) {
        removeCurrency(c.code);
      } else {
        addCurrency(c.code);
      }
      renderSearchResults(searchInputEl.value);
    });

    li.appendChild(flag);
    li.appendChild(info);
    li.appendChild(toggleBtn);
    searchResultsEl.appendChild(li);
  });
}

function addCurrency(code) {
  if (homeList.includes(code)) return;
  homeList.push(code);
  persistState();
  const master = CURRENCY_MAP.get(code);
  showToast(`${master ? master.nameJa : code} を追加しました`, "success");
}

// ===== イベント登録 =====

addButton.addEventListener("click", openSearchView);
closeSearchButton.addEventListener("click", closeSearchView);
searchInputEl.addEventListener("input", () => {
  renderSearchResults(searchInputEl.value);
});

// ===== 起動 =====
init();
