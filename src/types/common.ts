export interface KeyValuePair<T> {
  key: T;
  value: T;
}

export type OptionalKeyValue<T> = Partial<KeyValuePair<T>>;
