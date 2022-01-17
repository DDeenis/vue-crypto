<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700">
          Тикер
        </label>
        <div class="mt-1 relative rounded-md shadow-md">
          <app-input
            @keydown.enter="create"
            v-model="tickerName"
            type="text"
            name="wallet"
            id="wallet"
            placeholder="Например DOGE"
          />
        </div>
        <ticker-hints :tickerInput="tickerName" @selectHint="selectHint" />
        <div v-if="isError" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <app-button @click="create" type="button">
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
    </app-button>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import TickerHints from "./TickerHints.vue";
import AppButton from "./common/AppButton.vue";
import AppInput from "./common/AppInput.vue";

export default defineComponent({
  props: {
    isError: Boolean,
  },

  data() {
    return { tickerName: "" };
  },

  methods: {
    create() {
      this.$emit("create", this.tickerName);
      this.tickerName = "";
    },

    selectHint(hint: string) {
      this.$emit("create", hint);
      this.tickerName = "";
    },
  },
  emits: ["create", "input"],
  components: { TickerHints, AppButton, AppInput },
});
</script>
