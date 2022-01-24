<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2 my-4">
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
        v-model="filterValue"
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

  emits: {
    previous: (val: any) => Number.isInteger(val),
    next: (val: any) => Number.isInteger(val),
    "update:filter": (val: any) => typeof val === "string",
    "update:page": (val: any) => Number.isInteger(val),
  },

  props: {
    page: Number,
    pageSize: Number,
    hasNext: {
      type: Boolean,
      required: true,
    },
    filter: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      filterValue: "",
    };
  },

  created() {
    this.filterValue = this.filter;
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
      this.$emit("update:filter", this.filterValue);
    },

    next() {
      if (this.hasNext) {
        this.$emit("update:page", ++this.currentPage);
      }
    },

    prev() {
      if (this.currentPage > 1) {
        this.$emit("update:page", --this.currentPage);
      }
    },
  },

  watch: {
    filterValue() {
      this.changeFilter();
    },
  },
});
</script>
