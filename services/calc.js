import { rates } from "../assets/data/rates.js";

function calcExchangeRate(code, amount) {
    const baseRate = rates.exchangeRate["JPY"];
    const targetRate = rates.exchangeRate[code];

    return amount * (targetRate / baseRate);
} 