import fetchRate from "../../services/fetchRate.js";
import formatTimestamp from "../../services/formatter.js";
import { fetchDate, exchangeRate } from "../data/rates.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initialProcess();
});

async function initialProcess() {
    // 1) 為替レートの取得
    const rawData = await fetchRate();

    let rateData = JSON.parse(rawData);

    // 2) データの加工
    fetchDate = formatTimestamp(rateData[timestamp]);
    console.log(fetchDate);

    exchangeRate = rateData[rates];
    console.log(exchangeRate);
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