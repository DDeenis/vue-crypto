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
      <ticker-list
        v-if="tickers.length"
        :tickers="tickers"
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
import { fetchPrice } from "./utils/cryptoApi";

export default defineComponent({
  components: { Chart, NewTickerForm, TickerList, PageLoader },
  name: "App",

  data() {
    return {
      ticker: "",
      tickers: [] as TickerType[],
      selectedTiker: null as TickerType | null,
      trackedTickers: new Map<string, number>(),
      isError: false,
      graph: [] as number[],
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
      localStorage.setItem("addedCoins", JSON.stringify(this.tickers));

      this.startTickerTimer(currentTicker);
    },

    removeTicker(ticker: TickerType) {
      this.tickers = this.tickers.filter((t) => t.name !== ticker.name);
      localStorage.setItem("addedCoins", JSON.stringify(this.tickers));
      this.stopTickerTimer(ticker);

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

    startTickerTimer(currentTicker: TickerType) {
      const intervalId = setInterval(async () => {
        const price = await fetchPrice(currentTicker.name);

        const currencyPrice =
          price?.USD && price?.USD > 0.001
            ? price.USD?.toFixed(2) ?? "-"
            : price.USD?.toPrecision(2) ?? "-";
        currentTicker.price = currencyPrice;

        if (price?.USD && currentTicker?.name === this.selectedTiker?.name) {
          this.graph.push(price?.USD);
        }
      }, 3000);

      this.trackedTickers.set(currentTicker.name, intervalId);
    },

    stopTickerTimer(ticker: TickerType) {
      clearInterval(this.trackedTickers.get(ticker.name));
      this.trackedTickers.delete(ticker.name);
    },
  },

  computed: {
    normalizedGraph(): number[] {
      const min = Math.min(...this.graph);
      const max = Math.max(...this.graph);

      return this.graph.map((p) => 5 + ((p - min) * 95) / (max - min));
    },
  },

  created() {
    const savedCoins = localStorage.getItem("addedCoins");

    if (savedCoins) {
      this.tickers = JSON.parse(savedCoins);

      this.tickers.forEach((t) => this.startTickerTimer(t));
    }
  },
});
</script>
