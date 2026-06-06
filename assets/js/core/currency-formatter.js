// assets/js/core/currency-formatter.js

export const formatSovereignPrice = function(amount, currency = 'EUR') {
    if (amount === undefined || amount === null || amount === 'Bilgi Al') return amount;
    
    // Some legacy strings might already have symbols, check if it's purely a number
    const num = Number(amount);
    if (isNaN(num)) return amount; // return raw if it's text like "Bilgi Al"

    return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);
};

// Global fallback if not used as module
if (typeof window !== 'undefined') {
    window.formatSovereignPrice = formatSovereignPrice;
}
