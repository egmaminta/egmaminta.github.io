// Illustrative shelf prices in US cents. The benchmarks measure retrieval, not prices.
export const demoPrices = {
  beans: { Can: 149, Box: 249, Bag: 319 },
  ranch: { 'Blue cap': 449, 'Green cap': 399 },
};
export const dollars = (cents) => '$' + (cents / 100).toFixed(2);
