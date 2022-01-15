import { KeyValuePair } from "../types/common";

export interface IStorageManager<T> {
  get(key: string): T | null;
  getMultiple(keys: string[]): Record<string, T | null>;

  set(key: string, value: T): void;
  setMultiple(entries: KeyValuePair<T>[]): void;

  delete(key: string): void;
  deleteMultiple(keys: string[]): void;
}
