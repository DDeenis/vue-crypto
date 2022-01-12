export type SubscribeCallback = (price?: number) => void;

export enum SocketResponseTypes {
  AGGREGATE_INDEX = "5",
  INVALID_SUBSCRIBE = "500",
}

export enum ApiMessage {
  SUBSCRIBE = "subscribeTicker",
  UNSUBSCRIBE = "unsubscribeTicker",
  INVALID_SUBSCRIBE = "invaidSubscribe",
}
