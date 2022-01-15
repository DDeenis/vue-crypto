export type SubscribeCallback = (price?: number) => void;

export enum SocketResponseTypes {
  TICKER = "2",
  AGGREGATE_INDEX = "5",
  INVALID_SUBSCRIBE = "500",
}

export enum ApiMessage {
  SUBSCRIBE = "subscribeTicker",
  UNSUBSCRIBE = "unsubscribeTicker",
  INVALID_SUBSCRIBE = "invaidSubscribe",
}

export interface SubscribedTicker {
  from: string;
  to: string;
}
