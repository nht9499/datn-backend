export const roundMoney = (amount: number): number => {
  return Math.round(amount / 1000) * 1000;
};

export const formatMoney = (amount: number): string => {
  // Add "." to thoudsands
  let str = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  str = `${str}đ`;

  return str;
};
