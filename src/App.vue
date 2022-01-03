<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-50 p-4">
    <!-- Loader -->
    <!-- <div
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
    >
      <svg
        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div> -->
    <div class="container">
      <new-ticker-form
        v-model="ticker"
        :isError="isError"
        @create="addTicker"
      />
      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-500 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <ticker
            v-for="t in tickers"
            :key="t.name"
            :ticker="t"
            :isSelected="selectedTiker?.name === t.name"
            @select="selectTicker"
            @remove="removeTicker"
          />
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
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
import Ticker from "./components/Ticker.vue";
import type { TickerType } from "./types/ticker";
import { fetchPrice } from "./utils/cryptoApi";

export default defineComponent({
  components: { Ticker, Chart, NewTickerForm },
  name: "App",
  data() {
    return {
      ticker: "",
      tickers: [] as TickerType[],
      selectedTiker: null as TickerType | null,
      isError: false,
      graph: [] as number[],
    };
  },
  methods: {
    addTicker() {
      const currentTicker: TickerType = reactive({
        name: this.ticker,
        price: "-",
      });

      if (!this.ticker) {
        return;
      }

      if (this.tickers.find((t) => t.name === currentTicker.name)) {
        this.isError = true;
        return;
      }

      this.isError = false;
      this.tickers.push(currentTicker);
      this.ticker = "";

      setInterval(async () => {
        const price = await fetchPrice(currentTicker.name);
        const currencyPrice =
          price.USD > 0 ? price.USD.toFixed(2) : price.USD.toPrecision(2);
        currentTicker.price = currencyPrice;

        if (currentTicker?.name === this.selectedTiker?.name) {
          this.graph.push(price.USD);
        }
      }, 3000);
    },

    removeTicker(ticker: TickerType) {
      this.tickers = this.tickers.filter((t) => t.name !== ticker.name);

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
  },
  computed: {
    normalizedGraph() {
      const min = Math.min(...this.graph);
      const max = Math.max(...this.graph);

      // @ts-ignore
      return this.graph.map((p) => 5 + ((p - min) * 95) / (max - min));
    },
  },
});
</script>
