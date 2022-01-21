<template>
  <hr class="w-full border-t border-gray-500 my-4" />
  <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
    <ticker
      v-for="t in tickers"
      :key="t.name"
      :ticker="t"
      :isSelected="selectedTicker?.name === t.name"
      @select="selectTicker"
      @remove="openModal"
    />
  </dl>
  <hr class="w-full border-t border-gray-600 my-4" />
  <risk-modal
    :open="modalOpen"
    :coin="tickerToRemove?.name ?? ''"
    @confirm="tickerToRemove && removeTicker(tickerToRemove)"
    @close="closeModal"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { TickerType } from "../types/ticker";
import Ticker from "./Ticker.vue";
import RiskModal from "./common/RiskModal.vue";

export default defineComponent({
  components: { Ticker, RiskModal },
  props: {
    tickers: {
      type: Array as PropType<TickerType[]>,
      required: true,
    },
  },

  data() {
    return {
      selectedTicker: null as TickerType | null,
      tickerToRemove: null as TickerType | null,
    };
  },

  methods: {
    openModal(ticker: TickerType) {
      this.tickerToRemove = ticker;
    },

    closeModal() {
      this.tickerToRemove = null;
    },

    removeTicker(ticker: TickerType) {
      this.$emit("remove", ticker);
      this.closeModal();
    },

    selectTicker(ticker: TickerType) {
      this.selectedTicker = ticker;
      this.$emit("select", ticker);
    },
  },

  emits: {
    remove: (val: any) => val instanceof String,
    select: (val: any) => val instanceof String,
  },

  computed: {
    modalOpen() {
      return Boolean(this.tickerToRemove);
    },
  },
});
</script>
