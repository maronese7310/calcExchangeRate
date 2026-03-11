import fetchRate from "../../services/fetchRate.js";
import formatTimestamp from "../../services/formatter.js";
import { rates } from "../data/rates.js";
import createCurrencyList from "../../services/createCurrencyList.js";
import createBottomSheet from "../../services/createBottomSheet.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initialProcess();
});

async function initialProcess() {
    // 1) 為替レートの取得
    const rateData = await fetchRate();


    // 2) データの加工
    rates.fetchDate = formatTimestamp(rateData.timestamp);

    rates.exchangeRate = rateData.rates;
    rates.exchangeRate["JPY"] = 1; // 基準通貨としてJPYを追加


    // 3) メイン画面へ遷移
    const rateTimeElement = document.getElementById("rate-time");
    if (rateTimeElement && rates && rates.fetchDate) {
        rateTimeElement.textContent = rates.fetchDate;
    }

    const startScreen = document.getElementById("start-screen");
    const mainScreen = document.getElementById("main-screen");

    startScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");

    // 4) 通貨リストの作成
    await createCurrencyList();

    // 5) ボトムシート イベントリスナーの起動
    createBottomSheet();
};