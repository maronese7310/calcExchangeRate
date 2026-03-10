import { rates } from "../assets/data/rates.js";

function calcExchangeRate(code, amount) {
    const targetRate = rates.exchangeRate[code];
    const exchangeRate = targetRate / rates.exchangeRate["JPY"];
    return amount * exchangeRate;
}

export default calcExchangeRate;