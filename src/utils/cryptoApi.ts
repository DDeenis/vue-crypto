import { SubscribeCallback } from "../types/api";
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

export class CryptoApi {
  socket: WebSocket;
  handlers: Map<string, SubscribeCallback[]>;
  timeout: number;
  _updateInterval?: number;

  constructor() {
    this.socket = new WebSocket(
      `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
    );
    this.handlers = new Map();
    this.timeout = 5000;
  }

  subscribe(coin: string, callback: SubscribeCallback) {
    const subscribers = this.handlers.get(coin) ?? [];
    this.handlers.set(coin, [...subscribers, callback]);
  }

  unsubscribe(coin: string, callback: SubscribeCallback) {
    const subscribers = this.handlers.get(coin) ?? [];
    this.handlers.set(
      coin,
      subscribers.filter((cb) => cb !== callback)
    );
  }

  unsubscribeAll(coin: string) {
    this.handlers.delete(coin);
  }

  async update() {
    if (!this.handlers.size) {
      return;
    }

    // bad
    const response = await fetchMultiplePrices([...this.handlers.keys()]);

    this.handlers.forEach((callbacks, coin) => {
      const price = response[coin.toUpperCase()]?.USD;
      callbacks.forEach((fn) => fn(price));
    });
  }

  startUpdate() {
    this.stopUpdate();
    this._updateInterval = setInterval(() => this.update(), this.timeout);
  }

  stopUpdate() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }
  }

  _init() {
    this.socket.send(
      JSON.stringify({
        action: "SubAdd",
        subs: ["2~Binance~BTC~USD"],
      })
    );
  }
}
