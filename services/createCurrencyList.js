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
            <span class="fi fi-${className}"></span>
            <div class="currency-info">
                <span class="currency-name">${name}</span>
                <span class="currency-code">${code}</span>
            </div>
            <input class="amount" type="text" inputmode="decimal" value="0" />
        `;
        currencyListElement.appendChild(li);

        // format input value with thousand separators
        const input = li.querySelector('.amount');
        input.addEventListener('input', () => {
            let val = input.value.replace(/,/g, '');
            if (val === '' || isNaN(val)) return;
            val = parseFloat(val);
            input.value = val.toLocaleString('en-US');
        });
    });
}

export default createCurrencyList;