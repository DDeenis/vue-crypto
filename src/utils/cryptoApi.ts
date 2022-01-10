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
  AGGREGATE_INDEX = "5" as const;
  _updateInterval?: number;
  _messageQueue: string[];

  constructor() {
    this.socket = new WebSocket(
      `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
    );
    this.handlers = new Map();
    this.timeout = 5000;
    this._messageQueue = [];
  }

  subscribe(coin: string, callback: SubscribeCallback) {
    const subscribers = this.handlers.get(coin) ?? [];
    this.handlers.set(coin, [...subscribers, callback]);
    this._socketSubscribe(coin);
  }

  unsubscribe(coin: string, callback: SubscribeCallback) {
    const subscribers = this.handlers.get(coin) ?? [];
    this.handlers.set(
      coin,
      subscribers.filter((cb) => cb !== callback)
    );
  }

  _socketSend(msg: string) {
    if (this.socket.readyState === this.socket.CONNECTING) {
      this._messageQueue.push(msg);
    } else {
      this.socket.send(msg);
    }
  }

  _socketSubscribe(coin: string) {
    this._socketSend(
      JSON.stringify({
        action: "SubAdd",
        subs: [`5~CCCAGG~${coin.toUpperCase()}~USD`],
      })
    );
  }

  _socketUnsubscribe(coin: string) {
    this._socketSend(
      JSON.stringify({
        action: "SubRemove",
        subs: [`5~CCCAGG~${coin.toUpperCase()}~USD`],
      })
    );
  }

  unsubscribeAll(coin: string) {
    this.handlers.delete(coin);
    this._socketUnsubscribe(coin);
  }

  async update(message: MessageEvent<any>) {
    if (!this.handlers.size) {
      return;
    }

    const response = JSON.parse(message.data);
    const { PRICE, FROMSYMBOL, TYPE } = response;

    if (TYPE === this.AGGREGATE_INDEX) {
      this.handlers.get(FROMSYMBOL?.toLowerCase())?.forEach((fn) => fn(PRICE));
    }
  }

  startUpdate() {
    this.socket.onmessage = (e) => this.update(e);
    this.socket.addEventListener("open", () => this._startQueue(), {
      once: true,
    });
  }

  stopUpdate() {
    const coins = [...this.handlers.keys()];
    const unsubCoins = coins.map((c) => `5~CCCAGG~${c.toUpperCase()}~USD`);

    this._socketSend(
      JSON.stringify({
        action: "SubRemove",
        subs: unsubCoins,
      })
    );
    this.socket.close();
  }

  _startQueue() {
    while (this._messageQueue.length) {
      if (this.socket.readyState !== this.socket.CONNECTING) {
        const msg = this._messageQueue.pop();

        if (msg) {
          this.socket.send(msg);
        }
      }
    }
  }

  _init() {
    this._socketSend(
      JSON.stringify({
        action: "SubAdd",
        subs: ["2~Binance~BTC~USD"],
      })
    );
  }
}
