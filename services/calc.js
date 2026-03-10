import { rates } from "../assets/data/rates.js";

function calcExchangeRate(code, amount) {
    // amount は JPY での価値
    // JPYに変換する場合は、そのままの値を返す
    if (code === "JPY") {
        return amount;
    }

    const targetRate = rates.exchangeRate[code];
    const exchangeRate = targetRate / rates.exchangeRate["JPY"];
    return amount * exchangeRate;
}

export default calcExchangeRate;