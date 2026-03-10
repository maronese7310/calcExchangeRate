import { homeCurrencyCode, selectedCurrency } from '../assets/data/localStorageData.js';
import { rates } from '../assets/data/rates.js';
import calcExchangeRate from './calc.js';

async function createCurrencyList() {
    // List作成と責務分掌させる
    const response = await fetch('assets/data/currencies.json');
    const currencyData = await response.json();

    const currencyListElement = document.getElementById('currency-list');
    currencyListElement.innerHTML = '';

    // 初期表示の基準となる通貨と金額を取得
    const [initialCode, initialAmount] = selectedCurrency;
    const baseCurrency = 'JPY';

    // 基準通貨の金額を日本円(JPY)での価値に換算
    let initialValueInJpy;
    if (initialCode === "JPY") {
        initialValueInJpy = initialAmount;
    } else {
        initialValueInJpy = initialAmount * (rates.exchangeRate[baseCurrency] / rates.exchangeRate[initialCode]);
    }

    homeCurrencyCode.forEach(code => {
        const className = currencyData[code]?.flag || '';
        const name = currencyData[code]?.name || '';

        const li = document.createElement('li');
        li.dataset.currencyCode = code;

        const initialValue = calcExchangeRate(code, initialValueInJpy);

        li.innerHTML = `
            <span class="fi fi-${className}"></span>
            <div class="currency-info">
                <span class="currency-name">${name}</span>
                <span class="currency-code">${code}</span>
            </div>
            <input class="amount" type="text" inputmode="decimal" />
        `;

        const input = li.querySelector('.amount');
        // 計算した初期値を3桁区切りで設定
        const fractionDigits = checkDigits(rates.exchangeRate[code]);
        input.value = initialValue.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
        currencyListElement.appendChild(li);

        // 金額が入力された際のイベントリスナーを設定
        input.addEventListener('input', (event) => {
            const sourceInput = event.target;
            const sourceLi = sourceInput.closest('li');
            const sourceCode = sourceLi.dataset.currencyCode;

            // 入力値からカンマを削除して数値に変換
            const sourceValue = parseFloat(sourceInput.value.replace(/,/g, '')) || 0;

            selectedCurrency[0] = sourceCode;
            selectedCurrency[1] = sourceValue;

            document.querySelectorAll('#currency-list li').forEach(item => {
                const targetInput = item.querySelector('.amount');
                const targetCode = item.dataset.currencyCode;
                const newValue = calcExchangeRate(targetCode, sourceValue);

                const fractionDigits = checkDigits(rates.exchangeRate[targetCode]);
                targetInput.value = newValue.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
            });
        });
    });
}

export default createCurrencyList;


function checkDigits(exchangeRate, code) {
    if (code === selectedCurrency[0]) {
        return 0;
    }
    else if (exchangeRate < 1) {
        return 2;
    }
    else {
        return 0;
    }
}