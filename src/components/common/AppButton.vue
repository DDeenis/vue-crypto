<template>
  <button
    :disabled="disabled"
    :class="{
      'bg-gray-300': disabled,
      'hover:bg-gray-400': disabled,
      'bg-gray-500': !disabled,
      'hover:bg-gray-600': !disabled,
    }"
    class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
  >
    <slot />
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    disabled: Boolean,
  },
});
</script>
