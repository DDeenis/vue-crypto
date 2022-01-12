import {
  createNanoEvents,
  DefaultEvents,
  Emitter,
  Unsubscribe,
} from "nanoevents";
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

const emitter = createNanoEvents();

export class CryptoSocket {
  socket: WebSocket;
  AGGREGATE_INDEX = "5" as const;
  messageQueue: string[];
  subscribed: string[];

  constructor() {
    this.socket = new WebSocket(
      `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
    );
    this.messageQueue = [];
    this.subscribed = [];
    this.initSocket();
    this.initEvents();
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

  initEvents() {
    emitter.on("subscribeTicker", (coin) => this.subscribeTicker(coin));
    emitter.on("unsubscribeTicker", (coin) => this.unsubscribeTicker(coin));
  }

  initSocket() {
    this.socket.onmessage = (e) => {
      const response = JSON.parse(e.data);
      const { TYPE, FROMSYMBOL, PRICE } = response;

      if (TYPE === this.AGGREGATE_INDEX) {
        emitter.emit(`${FROMSYMBOL?.toLowerCase()}-update`, PRICE);
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

export class CryptoApi {
  api?: CryptoSocket;
  connected?: boolean;

  constructor(autoConnect: boolean = false) {
    if (autoConnect) {
      this.connect();
    }
  }

  connect() {
    if (!this.connected) {
      this.api = new CryptoSocket();
      this.connected = true;
    }
  }

  disconnect() {
    if (this.connected) {
      this.api?.close();
      this.connected = false;
    }
  }
}

export class CryptoObserver {
  unbindHandlers: Map<string, Unsubscribe[]>;

  constructor() {
    this.unbindHandlers = new Map();
  }

  subscribe(coin: string, callback: SubscribeCallback) {
    const key = `${coin}-update`;
    const unbind = emitter.on(key, (price) => callback(price));
    emitter.emit("subscribeTicker", coin);

    const unbinds = this.unbindHandlers.get(key) ?? [];
    this.unbindHandlers.set(key, [...unbinds, unbind]);
  }

  unsubscribe(coin: string) {
    const unbinds = this.unbindHandlers.get(`${coin}-subscribe`) ?? [];
    unbinds.forEach((unbind) => unbind());
    emitter.emit(`unsubscribeTicker`, coin);
  }
}
