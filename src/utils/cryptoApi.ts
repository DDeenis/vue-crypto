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

export class CryptoSocket {
  socket: WebSocket;
  AGGREGATE_INDEX = "5" as const;
  messageQueue: string[];
  subscribed: string[];
  onmessage?: (e: any) => void;

  constructor(handler?: (e: MessageEvent<any>) => void) {
    this.socket = new WebSocket(
      `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
    );
    this.messageQueue = [];
    this.subscribed = [];
    this.onmessage = handler;
    this._initSocket();
  }

  send(msg: unknown) {
    const msgStr = JSON.stringify(msg);

    if (this.socket.readyState === this.socket.CONNECTING) {
      this.messageQueue.push(msgStr);
    } else {
      this.socket.send(msgStr);
    }
  }

  subscribeTicker(coin: string) {
    this.subscribed.push(coin);
    this.send({
      action: "SubAdd",
      subs: [`5~CCCAGG~${coin.toUpperCase()}~USD`],
    });
  }

  unsubscribeTicker(coin: string) {
    this.send({
      action: "SubRemove",
      subs: [`5~CCCAGG~${coin.toUpperCase()}~USD`],
    });
  }

  _initSocket() {
    this.socket.onmessage = (e) => {
      const response = JSON.parse(e.data);
      const { TYPE } = response;

      if (TYPE === this.AGGREGATE_INDEX) {
        this.onmessage?.(response);
      }
    };
    this.socket.addEventListener("open", () => this.sendQueueMessages(), {
      once: true,
    });
  }

  close() {
    const unsubCoins = this.subscribed.map(
      (c) => `5~CCCAGG~${c.toUpperCase()}~USD`
    );

    this.send({
      action: "SubRemove",
      subs: unsubCoins,
    });

    if (
      this.socket.readyState !== this.socket.CLOSED &&
      this.socket.readyState !== this.socket.CLOSING
    ) {
      this.socket.close();
    }
  }

  sendQueueMessages() {
    while (this.messageQueue.length) {
      if (this.socket.readyState !== this.socket.CONNECTING) {
        const msg = this.messageQueue.pop();

        if (msg) {
          this.socket.send(msg);
        }
      }
    }
  }
}

export class CryptoObserver {
  api: CryptoSocket;
  handlers: Map<string, SubscribeCallback[]>;

  constructor() {
    this.handlers = new Map();
    this.api = new CryptoSocket((e) => this.update(e));
  }

  subscribe(coin: string, callback: SubscribeCallback) {
    const subscribers = this.handlers.get(coin) ?? [];
    this.handlers.set(coin, [...subscribers, callback]);
    this.api.subscribeTicker(coin);
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
    this.api.unsubscribeTicker(coin);
  }

  async update(message: any) {
    if (!this.handlers.size) {
      return;
    }
    const { PRICE, FROMSYMBOL } = message;

    this.handlers.get(FROMSYMBOL.toLowerCase())?.forEach((fn) => fn(PRICE));
  }

  stopUpdate() {
    this.api.close();
  }
}
