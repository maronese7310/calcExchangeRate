async function fetchRate() {
    try {
        const url = "https://api.exchangerate.fun/latest?base=JPY"
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data;
    }
    catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        return error;
    }
}

export default fetchRate;
