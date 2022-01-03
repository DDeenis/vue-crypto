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
      <!-- <section>
        <div class="flex">
          <div class="max-w-xs">
            <label for="wallet" class="block text-sm font-medium text-gray-700"
              >Тикер</label
            >
            <div class="mt-1 relative rounded-md shadow-md">
              <input
                v-model="ticker"
                @keydown.enter="addTicker"
                type="text"
                name="wallet"
                id="wallet"
                class="
                  block
                  w-full
                  p-2
                  px-3
                  pr-10
                  border-gray-300
                  text-gray-900
                  focus:outline-none focus:ring-gray-500 focus:border-gray-500
                  sm:text-sm
                  rounded-md
                "
                placeholder="Например DOGE"
              />
            </div>
            <div class="flex bg-white shadow-md p-1 rounded-md flex-wrap">
              <span
                class="
                  inline-flex
                  items-center
                  px-2
                  m-1
                  rounded-md
                  text-xs
                  font-medium
                  bg-gray-200
                  text-gray-800
                  cursor-pointer
                "
              >
                BTC
              </span>
              <span
                class="
                  inline-flex
                  items-center
                  px-2
                  m-1
                  rounded-md
                  text-xs
                  font-medium
                  bg-gray-200
                  text-gray-800
                  cursor-pointer
                "
              >
                DOGE
              </span>
              <span
                class="
                  inline-flex
                  items-center
                  px-2
                  m-1
                  rounded-md
                  text-xs
                  font-medium
                  bg-gray-200
                  text-gray-800
                  cursor-pointer
                "
              >
                BCH
              </span>
              <span
                class="
                  inline-flex
                  items-center
                  px-2
                  m-1
                  rounded-md
                  text-xs
                  font-medium
                  bg-gray-200
                  text-gray-800
                  cursor-pointer
                "
              >
                CHD
              </span>
            </div>
            <div v-if="isError" class="text-sm text-red-600">
              Такой тикер уже добавлен
            </div>
          </div>
        </div>
        <button
          @click="addTicker"
          type="button"
          class="
            my-4
            inline-flex
            items-center
            py-2
            px-4
            border border-transparent
            shadow-sm
            text-sm
            leading-4
            font-medium
            rounded-full
            text-white
            bg-gray-500
            hover:bg-gray-600
            transition-colors
            duration-300
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            focus:ring-gray-500
          "
        >
          <svg
            class="-ml-0.5 mr-2 h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="#ffffff"
          >
            <path
              d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            ></path>
          </svg>
          Добавить
        </button>
      </section> -->

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
