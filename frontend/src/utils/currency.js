import axios from 'axios';

export async function getCurrentExchangeRate() {
  try {
    const response = await axios.get('/api/exchange-rates/current/');
    return response.data.usd_to_iqd_rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
}

export function convertUsdToIqd(usdAmount, rate) {
  return usdAmount * rate;
}

export function convertIqdToUsd(iqdAmount, rate) {
  return iqdAmount / rate;
}

export function formatCurrency(amount, currency = 'USD') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'IQD',
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });
  
  return formatter.format(amount);
}
