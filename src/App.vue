<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-50 p-4">
    <page-loader :visible="false" />
    <div class="container">
      <new-ticker-form
        v-model="ticker"
        :isError="isError"
        @create="addTicker"
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
    normalizedGraph(): number[] {
      const min = Math.min(...this.graph);
      const max = Math.max(...this.graph);

      return this.graph.map((p) => 5 + ((p - min) * 95) / (max - min));
    },
  },
});
</script>
