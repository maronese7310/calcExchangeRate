import localStorageData from '../assets/data/localStorageData.js';
import currencyData from '../assets/data/currencies.json';

function createCurrencyList() {
    const currencyListElement = document.getElementById('currency-list');
    currencyListElement.innerHTML = '';

    localStorageData.forEach(code => {
        const li = document.createElement('li');
        const flagCode = currencyData[code]?.flag || '';
        li.innerHTML = `
            <span class="fi fi-${flagCode}"></span>
            <span class="currency-code">${code}</span>
        `;
        currencyListElement.appendChild(li);
    });
}

export default createCurrencyList;