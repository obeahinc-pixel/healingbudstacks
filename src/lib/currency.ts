// Currency utility for country-based formatting
// Maps country codes to their respective currencies

const currencyMap: Record<string, string> = {
  PT: 'EUR',
  ZA: 'ZAR',
  GB: 'GBP',
  TH: 'THB',
  US: 'USD',
};

const currencySymbols: Record<string, string> = {
  EUR: '€',
  ZAR: 'R',
  GBP: '£',
  THB: '฿',
  USD: '$',
};

export function getCurrencyForCountry(countryCode: string): string {
  return currencyMap[countryCode] || 'ZAR';
}

export function getCurrencySymbol(currencyCode: string): string {
  return currencySymbols[currencyCode] || 'R';
}

export function formatPrice(
  amount: number,
  countryCode: string = 'ZA',
  options?: { showSymbol?: boolean }
): string {
  const { showSymbol = true } = options || {};
  
  // ALWAYS default to ZA if countryCode is empty/invalid
  const validCountryCode = countryCode && currencyMap[countryCode] ? countryCode : 'ZA';
  const currency = getCurrencyForCountry(validCountryCode);
  
  // Handle invalid amounts
  let displayAmount = amount;
  if (isNaN(displayAmount) || displayAmount === null || displayAmount === undefined) {
    displayAmount = 0;
  }
  
  try {
    const formatter = new Intl.NumberFormat(getLocaleForCountry(validCountryCode), {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(displayAmount);
  } catch {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${displayAmount.toFixed(2)}`;
  }
}

function getLocaleForCountry(countryCode: string): string {
  const localeMap: Record<string, string> = {
    PT: 'pt-PT',
    ZA: 'en-ZA',
    GB: 'en-GB',
    TH: 'th-TH',
    US: 'en-US',
  };
  return localeMap[countryCode] || 'en-ZA';
}
