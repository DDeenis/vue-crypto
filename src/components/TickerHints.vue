<template>
  <div
    v-if="matchedNames.length"
    class="flex bg-white shadow-md p-1 rounded-md flex-wrap"
  >
    <span
      v-for="tickerName in matchedNames"
      @click="selectHint(tickerName)"
      class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-200 text-gray-800 cursor-pointer"
    >
      {{ tickerName }}
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { fetchCoinsList } from "../utils/cryptoApi";

export default defineComponent({
  props: {
    tickerInput: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      coinNames: [] as string[],
    };
  },

  computed: {
    matchedNames() {
      if (!this.tickerInput) {
        return [];
      }

      const matched = this.coinNames.filter((n) =>
        n.toLowerCase().startsWith(this.tickerInput)
      );
      return matched.slice(0, 4);
    },
  },

  methods: {
    selectHint(hint: string) {
      this.$emit("selectHint", hint);
    },
  },

  emits: ["selectHint"],

  async created() {
    const savedNames = localStorage.getItem("coinNames");

    if (savedNames) {
      this.coinNames = JSON.parse(savedNames);
      return;
    }

    const coinNames = await fetchCoinsList();

    this.coinNames = coinNames;
    localStorage.setItem("coinNames", JSON.stringify(coinNames));
  },
});
</script>
