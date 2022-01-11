<template>
  <div class="flex flex-col gap-2">
    <span>Страница: {{ _page }}</span>
    <div class="flex gap-2">
      <app-button @click="prev" :disabled="_page <= 1">Назад</app-button>
      <app-button @click="next" :disabled="!hasNext">Вперед</app-button>
    </div>
    <div class="flex gap-3 items-center">
      <label for="tickersFilter">Фильтр:</label>
      <app-input
        id="tickersFilter"
        type="text"
        placeholder="Название валюты"
        class="max-w-xs"
        :value="modelValue"
        @input="changeModel"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import AppButton from "./common/AppButton.vue";
import AppInput from "./common/AppInput.vue";

export default defineComponent({
  components: { AppButton, AppInput },
  emits: ["previous", "next", "update:modelValue"],
  props: {
    modelValue: String,
    page: Number,
    pageSize: Number,
    hasNext: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const _page = ref(props.page || 1);
    const _pageSize = ref(props.pageSize || 6);
    return {
      _page,
      _pageSize,
    };
  },
  methods: {
    changeModel(event: Event) {
      this.$emit("update:modelValue", (event.target as HTMLInputElement).value);
    },

    next() {
      if (this.hasNext) {
        this.$emit("next", ++this._page);
      }
    },

    prev() {
      if (this._page > 1) {
        this.$emit("previous", --this._page);
      }
    },
  },
});
</script>
