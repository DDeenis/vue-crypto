<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-50 p-4">
    <page-loader :visible="false" />
    <div class="container">
      <new-ticker-form
        :isError="isError"
        @create="addTicker"
        @input="isError = false"
      />
      <hr v-if="tickers.length" class="w-full border-t border-gray-500 my-4" />
      <ticker-page-filter
        v-if="tickers.length"
        :page="page"
        :pageSize="pageSize"
        :hasNext="hasNextPage"
        @next="changePage"
        @previous="changePage"
        @change-filter="changeFilter"
      />
      <ticker-list
        v-if="pagedTickers.length"
        :tickers="pagedTickers"
        @remove="removeTicker"
        @select="selectTicker"
      />
      <chart
        v-if="selectedTiker"
        :cryptocurrencyName="selectedTiker?.name"
        :graph="normalizedGraph"
        @close="closeChart"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Chart from "./components/Chart.vue";
import NewTickerForm from "./components/NewTickerForm.vue";
import TickerList from "./components/TickerList.vue";
import PageLoader from "./components/PageLoader.vue";
import { CryptoApi, CryptoObserver } from "./utils/cryptoApi";
import TickerPageFilter from "./components/TickerPageFilter.vue";
import { searchParamsUtils } from "./utils/history";
import type { TickerType } from "./types/ticker";
import type { SearchParamEntry } from "./types/history";
import { localStorageManager } from "./utils/localStorage";
import { BROADCAST_UPDATE_LIST } from "./utils/constanst";

export default defineComponent({
  components: {
    Chart,
    NewTickerForm,
    TickerList,
    PageLoader,
    TickerPageFilter,
  },
  name: "App",

  data() {
    return {
      tickers: [] as TickerType[],
      selectedTiker: null as TickerType | null,

      isError: false,
      graph: [] as number[],

      filter: "",
      page: 1,
      pageSize: 6,

      observer: new CryptoObserver(),
      api: new CryptoApi(),
      broadcast: new BroadcastChannel(BROADCAST_UPDATE_LIST),
    };
  },

  methods: {
    addTicker(tickerName: string) {
      const currentTicker: TickerType = {
        name: tickerName.toLowerCase(),
        price: "-",
      };

      if (!tickerName) {
        return;
      }

      if (this.tickers.find((t) => t.name === currentTicker.name)) {
        this.isError = true;
        return;
      }

      this.isError = false;
      this.tickers.push(currentTicker);
      this.filter = "";

      this.subscribeTicker(currentTicker.name);
    },

    removeTicker(ticker: TickerType) {
      this.tickers = this.tickers.filter((t) => t.name !== ticker.name);
      this.observer.unsubscribe(ticker.name);

      if (ticker.name === this.selectedTiker?.name) {
        this.selectedTiker = null;
        this.graph = [];
      }
    },

    selectTicker(ticker: TickerType) {
      this.selectedTiker = ticker;
      this.graph = [];
    },

    closeChart() {
      this.selectedTiker = null;
    },

    updateTicker(name: string, price?: number) {
      const ticker = this.tickers.find((t) => t.name === name);

      if (ticker) {
        ticker.price = price ?? ticker.price;
      }

      if (ticker?.name === this.selectedTiker?.name) {
        this.addGraphElement(price);
      }
    },

    addGraphElement(price?: number) {
      if (price) {
        this.graph.push(price);
      }
    },

    subscribeTickers() {
      this.tickers.forEach((t) => this.subscribeTicker(t.name));
    },

    subscribeTicker(name: string) {
      this.observer.subscribe(name, (price) => this.updateTicker(name, price));
    },

    changePage(newPage: number) {
      this.page = newPage;
    },

    getParamsFromSearchQuery() {
      const searchParams = searchParamsUtils.getMultiple(["filter", "page"]);
      const savedPage = parseInt(searchParams.page || "1");
      const page =
        savedPage > 0 && savedPage * this.pageSize < this.tickers.length
          ? savedPage
          : 1;

      this.filter = searchParams.filter || "";
      this.page = page;
    },

    getTickersFromLocalStorage() {
      const savedCoins = localStorageManager.get("addedCoins");
      const tickers: TickerType[] | undefined =
        savedCoins && JSON.parse(savedCoins);

      return tickers ?? [];
    },

    changeFilter(newVal: string) {
      this.filter = newVal;
    },
  },

  computed: {
    normalizedGraph(): number[] {
      const min = Math.min(...this.graph);
      const max = Math.max(...this.graph);

      if (min === max) {
        return this.graph.map(() => 50);
      }

      return this.graph.map((p) => {
        const height = 5 + ((p - min) * 95) / (max - min);
        return height;
      });
    },

    hasNextPage(): boolean {
      return this.tickers.length > this.pageEnd;
    },

    pageStart(): number {
      return this.pageSize * (this.page - 1);
    },

    pageEnd(): number {
      return this.pageSize * this.page;
    },

    pagedTickers(): TickerType[] {
      return this.tickers
        .filter((t) => t.name.includes(this.filter))
        .slice(this.pageStart, this.pageEnd);
    },

    urlParams(): SearchParamEntry[] {
      return [
        {
          key: "filter",
          value: this.filter,
        },
        {
          key: "page",
          value: String(this.page),
        },
      ];
    },
  },

  created() {
    this.getParamsFromSearchQuery();
    this.api.connect();
    this.tickers = this.getTickersFromLocalStorage();
    this.subscribeTickers();

    this.broadcast.addEventListener("message", (ev) => {
      const { event } = JSON.parse(ev.data);

      if (event === "ticketsListChanged") {
        this.tickers = this.getTickersFromLocalStorage();
      }
    });
  },

  unmounted() {
    this.api.disconnect();
  },

  watch: {
    urlParams: {
      handler() {
        searchParamsUtils.setMultiple(this.urlParams);
      },
      deep: true,
    },

    filter() {
      this.page = 1;
    },

    pagedTickers() {
      if (this.pagedTickers.length === 0 && this.page > 1) {
        --this.page;
      }
    },

    tickers: {
      handler() {
        localStorageManager.set("addedCoins", JSON.stringify(this.tickers));

        this.broadcast.postMessage(
          JSON.stringify({
            event: "ticketsListChanged",
          })
        );
      },
      deep: true,
    },
  },
});
</script>
