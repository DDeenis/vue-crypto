import { API_KEY } from "./constanst";

export const fetchPrice = async (
  coin: string,
  currencies: string[] = ["USD"]
): Promise<Record<typeof currencies[number], number | undefined>> => {
  const currenciesStr = currencies.join(",");

  const url = new URL("https://min-api.cryptocompare.com/data/price");
  url.searchParams.set("fsym", coin);
  url.searchParams.set("tsyms", currenciesStr);
  url.searchParams.set("api_key", API_KEY);
  const link = url.toString();

  const response = await fetch(link);
  return await response.json();
};

export const fetchMultiplePrices = async (
  coins: string[],
  currencies: string[] = ["USD"]
): Promise<
  Record<
    typeof coins[number],
    Record<typeof currencies[number], number | undefined>
  >
> => {
  const coinsStr = coins.join(",");
  const currenciesStr = currencies.join(",");

  const url = new URL("https://min-api.cryptocompare.com/data/pricemulti");
  url.searchParams.set("fsyms", coinsStr);
  url.searchParams.set("tsyms", currenciesStr);
  url.searchParams.set("api_key", API_KEY);
  const link = url.toString();

  const response = await fetch(link);
  return await response.json();
};

export const fetchCoinsList = async () => {
  const link =
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true";
  const response = await fetch(link);
  const data = await response.json();
  const coinNames = Object.keys(data.Data);

  return coinNames;
};
