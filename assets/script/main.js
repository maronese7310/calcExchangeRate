import fetchRate from "../../services/api/fetchRate.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initialProcess();
});

async function initialProcess() {
    // 1) 為替レートの取得
    const rateData = await fetchRate();
    console.log(rateData);
}
