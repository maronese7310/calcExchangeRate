import localStorageData from '../assets/data/localStorageData.js';

function createCurrencyList() {
    const currencyListElement = document.getElementById('currency-list');
    currencyListElement.innerHTML = '';

    localStorageData.forEach(currency => {
        const li = document.createElement('li');
        li.textContent = currency;
        currencyListElement.appendChild(li);
    });
}

export { createCurrencyList };