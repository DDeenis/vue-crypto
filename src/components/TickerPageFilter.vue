<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2">
      <app-button @click="prev" :disabled="currentPage <= 1">Назад</app-button>
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
    const currentPage = ref(props.page || 1);
    const currentPageSize = ref(props.pageSize || 6);
    return {
      currentPage,
      currentPageSize,
    };
  },
  methods: {
    changeModel(event: Event) {
      this.$emit("update:modelValue", (event.target as HTMLInputElement).value);
    },

    next() {
      if (this.hasNext) {
        this.$emit("next", ++this.currentPage);
      }
    },

    prev() {
      if (this.currentPage > 1) {
        this.$emit("previous", --this.currentPage);
      }
    },
  },
});
</script>
