import type { SearchParamEntry } from "../types/history";

class SearchParamsUtils {
  values: Map<string, string>;

  constructor() {
    this.values = new Map();
  }

  setValue(key: string, value: string) {
    this.values.set(key, value);
    this.updateUrl();
  }

  setValues(values: SearchParamEntry[]) {
    values.forEach((v) => this.setValue(v.key, v.value));
  }

  getValue(key: string) {
    const url = new URLSearchParams(location.search);
    return url.get(key);
  }

  getValues(...keys: string[]) {
    const searchParams = new Map();

    keys.forEach((k) => searchParams.set(k, this.getValue(k)));

    return Object.fromEntries(searchParams.entries());
  }

  removeValue(key: string) {
    this.values.delete(key);
    this.updateUrl();
  }

  removeValues(...keys: string[]) {
    keys.forEach((k) => this.removeValue(k));
  }

  updateUrl() {
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

export const searchParamsUtils = new SearchParamsUtils();
