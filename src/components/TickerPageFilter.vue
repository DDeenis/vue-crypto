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
        v-model="filter"
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

  emits: ["previous", "next", "changeFilter"],

  props: {
    page: Number,
    pageSize: Number,
    hasNext: {
      type: Boolean,
      required: true,
    },
  },

  data() {
    return {
      filter: "",
    };
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
    changeFilter() {
      this.$emit("changeFilter", this.filter);
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

  watch: {
    filter() {
      this.changeFilter();
    },
  },
});
</script>
