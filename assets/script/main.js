import fetchRate from "../../services/fetchRate.js";
import formatTimestamp from "../../services/formatter.js";
import { rates } from "../data/rates.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initialProcess();
});

async function initialProcess() {
    // 1) 為替レートの取得
    const rateData = await fetchRate();
    console.log(rateData);

    // 2) データの加工
    rates.fetchDate = formatTimestamp(rateData.timestamp);
    console.log(rates.fetchDate);

    rates.exchangeRate = rateData.rates;
    console.log(rates.exchangeRate);
}

/*
document.addEventListener("DOMContentLoaded", () => {

    const startScreen = document.getElementById("start-screen")
    const mainScreen = document.getElementById("main-screen")

    function showMainScreen() {

        startScreen.classList.add("hidden")
        mainScreen.classList.remove("hidden")

        console.log("done")
    }

    setTimeout(showMainScreen, 1000)

})
*/