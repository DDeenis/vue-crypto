import { KeyValuePair } from "../types/common";

export abstract class StorageManager<T> {
  constructor(entries?: KeyValuePair<T>[]) {
    if (entries) {
      this.setMultiple(entries);
    }
  }

  abstract get(key: string): T | null;
  abstract getMultiple(keys: string[]): Record<string, T | null>;

  abstract set(key: string, value: T): void;
  abstract setMultiple(entries: KeyValuePair<T>[]): void;

  abstract delete(key: string): void;
  abstract deleteMultiple(keys: string[]): void;

  abstract update(): void;
}
