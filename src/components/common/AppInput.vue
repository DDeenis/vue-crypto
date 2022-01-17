<template>
  <input
    type="text"
    class="block w-full p-2 px-3 pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
    @input="onInput"
    :value="modelValue"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    modelValue: String,
  },

  methods: {
    onInput(e: Event) {
      const target = e.target as HTMLInputElement;
      this.$emit("update:modelValue", target.value);
    },
  },

  emits: ["update:modelValue"],
});
</script>
