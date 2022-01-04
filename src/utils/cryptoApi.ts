import { API_KEY } from "./constanst";

export const fetchPrice = async (
  cryptocurrency: string,
  currencies: string[] = ["USD"]
): Promise<Record<typeof currencies[number], number>> => {
  const currenciesStr = currencies.join(",");
  const link = `https://min-api.cryptocompare.com/data/price?fsym=${cryptocurrency}&tsyms=${currenciesStr}&api_key=${API_KEY}`;

  const response = await fetch(link);
  return await response.json();
};