import { KeyValuePair } from "../types/common";
import { StorageManager } from "./storageManager";

class URLManager extends StorageManager<string> {
  values: Map<string, string>;

  constructor() {
    super();
    this.values = new Map();
  }

  get(key: string): string | null {
    const url = new URLSearchParams(location.search);
    return url.get(key);
  }

  getMultiple(keys: string[]): Record<string, string | null> {
    const searchParams = new Map();

    keys.forEach((k) => searchParams.set(k, this.get(k)));

    return Object.fromEntries(searchParams.entries());
  }

  set(key: string, value: string): void {
    this.values.set(key, value);
    this.update();
  }

  setMultiple(entries: KeyValuePair<string>[]): void {
    entries.forEach((v) => this.set(v.key, v.value));
  }

  delete(key: string): void {
    this.values.delete(key);
    this.update();
  }

  deleteMultiple(keys: string[]): void {
    keys.forEach((k) => this.delete(k));
  }

  update(): void {
    const url = new URL(location.href);

    this.values.forEach((val, key) => {
      if (!val) {
        url.searchParams.delete(key);
        return;
      }

      url.searchParams.set(key, val);
    });

    history.pushState(null, "", url.toString());
  }
}

export const searchParamsUtils = new URLManager();
