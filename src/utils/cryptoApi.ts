import { createNanoEvents, Unsubscribe } from "nanoevents";
import {
  ApiMessage,
  SocketResponseTypes,
  SubscribeCallback,
} from "../types/api";
import { API_KEY, BROADCAST_CHANNEL_KEY, INVALID_COIN } from "./constanst";

export const fetchPrice = async (
  coin: string,
  currencies: string[] = ["USD"]
): Promise<Record<typeof currencies[number], number | undefined>> => {
  const currenciesStr = currencies.join(",");

  const url = new URL("https://min-api.cryptocompare.com/data/price");
  url.searchParams.set("fsym", coin);
  url.searchParams.set("tsyms", currenciesStr);
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
  broadcast: BroadcastChannel;
  messageQueue: string[];
  subscribed: string[];
  usdBtcRate?: number;
  usdBtcUpdateTimeout: number = 15000;

  constructor() {
    this.socket = new WebSocket(
      `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
    );
    this.broadcast = new BroadcastChannel(BROADCAST_CHANNEL_KEY);
    this.messageQueue = [];
    this.subscribed = [];
    this.initSocket();
    this.initEvents();
    this.updateUsdBtcRate();
    setInterval(() => this.updateUsdBtcRate(), this.usdBtcUpdateTimeout);
  }

  send(msg: unknown) {
    const msgStr = JSON.stringify(msg);

    if (this.socket.readyState === this.socket.CONNECTING) {
      this.messageQueue.push(msgStr);
    } else {
      this.socket.send(msgStr);
    }
  }

  subscribeTicker(coin: string, currency = "USD") {
    this.subscribed.push(coin);
    this.send({
      action: "SubAdd",
      subs: [`5~CCCAGG~${coin.toUpperCase()}~${currency}`],
    });
  }

  unsubscribeTicker(coin: string, currency = "USD") {
    const index = this.subscribed.indexOf(coin);

    if (index !== -1) {
      this.subscribed.splice(index, 1);
      this.send({
        action: "SubRemove",
        subs: [`5~CCCAGG~${coin.toUpperCase()}~${currency}`],
      });
    }
  }

  async updateUsdBtcRate() {
    const res = await fetchPrice("USD", ["BTC"]);
    const btcRate = res?.BTC;

    if (btcRate) {
      this.usdBtcRate = btcRate;
    }
  }

  initEvents() {
    emitter.on(ApiMessage.SUBSCRIBE, (coin) => this.subscribeTicker(coin));
    emitter.on(ApiMessage.UNSUBSCRIBE, (coin) => this.unsubscribeTicker(coin));
  }

  initSocket() {
    this.socket.onmessage = async (e) => {
      const response = JSON.parse(e.data);
      const { TYPE, FROMSYMBOL, TOSYMBOL, PRICE, PARAMETER, FLAGS } = response;

      if (TYPE === SocketResponseTypes.AGGREGATE_INDEX) {
        if (FLAGS && FLAGS === 4) {
          return;
        }

        let correctPrice = PRICE;

        if (TOSYMBOL === "BTC" && this.usdBtcRate) {
          correctPrice = PRICE / this.usdBtcRate;
        }

        // emitter.emit(`${FROMSYMBOL?.toLowerCase()}-update`, correctPrice);
        this.broadcast.postMessage(
          JSON.stringify({
            to: TOSYMBOL,
            from: FROMSYMBOL,
            price: correctPrice,
          })
        );
      } else if (TYPE === SocketResponseTypes.INVALID_SUBSCRIBE) {
        const parts = PARAMETER?.split("~")?.map((p: string) =>
          p?.toLowerCase()
        );
        const coin = parts[2];
        const tosymbol = parts[3];
        const hasExchange = tosymbol !== "btc";

        if (!hasExchange) {
          emitter.emit(ApiMessage.INVALID_SUBSCRIBE, coin);
        } else {
          this.subscribeTicker(coin, "BTC");
        }
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
  broadcast: BroadcastChannel;

  constructor() {
    this.unbindHandlers = new Map();
    this.broadcast = new BroadcastChannel(BROADCAST_CHANNEL_KEY);
  }

  subscribe(coin: string, callback: SubscribeCallback) {
    const key = `${coin}-update`;

    this.broadcast.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (coin == msg.from?.toLowerCase()) {
        callback(msg.price);
      }
    });

    const unbindUpdate = emitter.on(key, (price) => callback(price));
    const unbindError = emitter.on(
      ApiMessage.INVALID_SUBSCRIBE,
      (invalidCoin) => {
        if (coin === invalidCoin) {
          callback(INVALID_COIN);
        }
      }
    );
    emitter.emit(ApiMessage.SUBSCRIBE, coin);

    const unbinds = this.unbindHandlers.get(key) ?? [];
    this.unbindHandlers.set(key, [...unbinds, unbindUpdate, unbindError]);
  }

  unsubscribe(coin: string) {
    const unbinds = this.unbindHandlers.get(`${coin}-subscribe`) ?? [];
    unbinds.forEach((unbind) => unbind());
    emitter.emit(ApiMessage.UNSUBSCRIBE, coin);
  }
}
