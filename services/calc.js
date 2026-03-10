import { rates } from "../assets/data/rates.js";
import { selectedCurrency } from "../assets/data/localStorageData.js";

function calcExchangeRate(code, amount) {
    const targetRate = rates.exchangeRate[code];
    const exchangeRate = targetRate / rates.exchangeRate[selectedCurrency[0]];
    return amount * exchangeRate;
}

export default calcExchangeRate;