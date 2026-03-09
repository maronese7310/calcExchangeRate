import localStorageData from '../assets/data/localStorageData.js';

async function createCurrencyList() {
    const response = await fetch('assets/data/currencies.json');
    const currencyData = await response.json();

    const currencyListElement = document.getElementById('currency-list');
    currencyListElement.innerHTML = '';

    localStorageData.forEach(code => {
        const className = currencyData[code]?.flag || '';
        const name = currencyData[code]?.name || '';

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="currency-info">
                <span class="fi fi-${className}"></span>
                <span class="currency-name">${name}</span>
                <span class="currency-code">${code}</span>
            </div>
            <input class="amount" type="text" value="0" />
        `;
        currencyListElement.appendChild(li);
    });
}

export default createCurrencyList;