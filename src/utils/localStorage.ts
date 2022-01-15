import { KeyValuePair } from "../types/common";
import { BROADCAST_UPDATE_LIST } from "./constanst";
import { IStorageManager } from "./storageManager";

export class LocalStorageManager implements IStorageManager<string> {
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  getMultiple(keys: string[]): Record<string, string | null> {
    const values: Record<string, string | null> = {};

    keys.forEach((k) => (values[k] = this.get(k)));

    return values;
  }

  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  setMultiple(entries: KeyValuePair<string>[]): void {
    entries.forEach((e) => this.set(e.key, e.value));
  }

  delete(key: string): void {
    localStorage.removeItem(key);
  }

  deleteMultiple(keys: string[]): void {
    keys.forEach((k) => this.delete(k));
  }
}

export const localStorageManager = new LocalStorageManager();
