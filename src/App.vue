<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-50 p-4">
    <page-loader :visible="false" />
    <div class="container">
      <new-ticker-form
        v-model="ticker"
        :isError="isError"
        @create="addTicker"
        @input="isError = false"
      />
      <hr v-if="tickers.length" class="w-full border-t border-gray-500 my-4" />
      <ticker-page-filter
        v-if="tickers.length"
        v-model="filter"
        :page="page"
        :pageSize="pageSize"
        :hasNext="hasNextPage"
        @next="changePage"
        @previous="changePage"
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
import { defineComponent, reactive } from "vue";
import Chart from "./components/Chart.vue";
import NewTickerForm from "./components/NewTickerForm.vue";
import TickerList from "./components/TickerList.vue";
import PageLoader from "./components/PageLoader.vue";
import type { TickerType } from "./types/ticker";
import { fetchMultiplePrices } from "./utils/cryptoApi";
import TickerPageFilter from "./components/TickerPageFilter.vue";
import { searchParamsUtils } from "./utils/history";

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
      ticker: "",
      tickers: [] as TickerType[],
      selectedTiker: null as TickerType | null,
      isError: false,
      graph: [] as number[],
      filter: "",
      page: 1,
      pageSize: 6,
    };
  },

  methods: {
    addTicker(tickerName: string) {
      const currentTicker: TickerType = reactive({
        name: tickerName.toLowerCase(),
        price: "-",
      });

      if (!tickerName) {
        return;
      }

      if (this.tickers.find((t) => t.name === currentTicker.name)) {
        this.isError = true;
        return;
      }

      this.isError = false;
      this.tickers.push(currentTicker);
      this.ticker = "";
      this.filter = "";
      localStorage.setItem("addedCoins", JSON.stringify(this.tickers));
    },

    removeTicker(ticker: TickerType) {
      this.tickers = this.tickers.filter((t) => t.name !== ticker.name);
      localStorage.setItem("addedCoins", JSON.stringify(this.tickers));

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

    startTickers() {
      setInterval(async () => {
        const coinsList = this.tickers.map((t) => t.name);
        const prices = await fetchMultiplePrices(coinsList);

        this.tickers.forEach((t) => {
          const price = prices[t.name.toUpperCase()];
          const currencyPrice =
            price?.USD && price?.USD > 0.001
              ? price.USD?.toFixed(2) ?? "-"
              : price.USD?.toPrecision(2) ?? "-";

          t.price = currencyPrice;

          if (price?.USD && t?.name === this.selectedTiker?.name) {
            this.graph.push(price?.USD);
          }
        });
      }, 3000);
    },

    changePage(newPage: number) {
      this.page = newPage;
    },

    getParamsFromSearchQuery() {
      const searchParams = searchParamsUtils.getValues("filter", "page");
      const savedPage = parseInt(searchParams.page || "1");
      const page =
        savedPage > 0 && savedPage * this.pageSize < this.tickers.length
          ? savedPage
          : 1;

      this.filter = searchParams.filter || "";
      this.page = page;
    },
  },

  computed: {
    normalizedGraph(): number[] {
      const min = Math.min(...this.graph);
      const max = Math.max(...this.graph);

      return this.graph.map((p) => {
        const height = 5 + ((p - min) * 95) / (max - min);
        return isNaN(height) ? 5 : height;
      });
    },

    hasNextPage(): boolean {
      const end = this.pageSize * this.page;
      return this.tickers.length > end;
    },

    pagedTickers(): TickerType[] {
      const start = this.pageSize * (this.page - 1);
      const end = this.pageSize * this.page;

      return this.tickers
        .filter((t) => t.name.includes(this.filter))
        .slice(start, end);
    },

    urlParams(): { key: string; value: string }[] {
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
    const savedCoins = localStorage.getItem("addedCoins");
    this.getParamsFromSearchQuery();

    if (savedCoins) {
      this.tickers = JSON.parse(savedCoins);
    }

    this.startTickers();
  },

  watch: {
    filter() {
      searchParamsUtils.setValues(this.urlParams);
    },

    page() {
      searchParamsUtils.setValues(this.urlParams);
    },
  },
});
</script>
