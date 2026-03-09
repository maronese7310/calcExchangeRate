import localStorageData from '../assets/data/localStorageData.js';

async function createCurrencyList() {
    const response = await fetch('assets/data/currencies.json');
    const currencyData = await response.json();

    const currencyListElement = document.getElementById('currency-list');
    currencyListElement.innerHTML = '';

    localStorageData.forEach(code => {
        const className = currencyData[code]?.flag || '';
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="fi fi-${className}" flag></span>
            <span class="currency-code">${code}</span>
        `;
        currencyListElement.appendChild(li);
    });
}

export default createCurrencyList;