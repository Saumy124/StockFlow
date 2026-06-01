import { createContext, useContext, useEffect, useState } from 'react';

const CurrencyContext = createContext();

// Prices are stored in USD. This is the display conversion rate to INR.
// Update this single constant if you want a different rate.
const USD_TO_INR = 95;

const CONFIG = {
  USD: { symbol: '$', locale: 'en-US', code: 'USD', rate: 1 },
  INR: { symbol: '₹', locale: 'en-IN', code: 'INR', rate: USD_TO_INR },
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('stockflow-currency') || 'USD'
  );

  useEffect(() => {
    localStorage.setItem('stockflow-currency', currency);
  }, [currency]);

  const toggleCurrency = () =>
    setCurrency((c) => (c === 'USD' ? 'INR' : 'USD'));

  // Takes an amount in USD and returns a formatted string in the active currency.
  const format = (amountInUsd) => {
    const cfg = CONFIG[currency];
    const converted = (Number(amountInUsd) || 0) * cfg.rate;
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.code,
      maximumFractionDigits: currency === 'INR' ? 0 : 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, toggleCurrency, setCurrency, format, symbol: CONFIG[currency].symbol }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
