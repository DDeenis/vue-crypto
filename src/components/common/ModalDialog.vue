<template>
  <teleport to="#app">
    <div
      :class="{
        'opacity-0': !open,
        'opacity-100': open,
        'z-10': open,
        '-z-10': !open,
      }"
      class="bg-black/60 fixed inset-0 flex justify-center items-center transition-opacity px-2 md:px-0"
      @click="requestClose"
    >
      <div
        :class="{ 'scale-0': !open, 'scale-100': open }"
        class="bg-white rounded-md py-3 px-4 w-full max-w-xl flex flex-col justify-between transition-transform"
        @click.stop
      >
        <button
          type="button"
          @click="requestClose"
          class="close-button absolute right-2 top-2 w-4 h-4"
        />
        <slot />
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    open: {
      type: Boolean,
      required: true,
    },
    size: {
      type: String as PropType<"lg" | "md" | "sm">,
      default: "sm",
    },
  },

  emits: {
    close: null,
  },

  methods: {
    requestClose() {
      this.$emit("close");
    },

    onClose() {
      console.log("modal closed");
    },

    onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        this.requestClose();
      }
    },
  },

  mounted() {
    window.addEventListener("keydown", this.onEscape);
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.onEscape);
  },
});
</script>

<style scoped>
.close-button {
  margin: 0;
  padding: 0;
  background: none;
  position: absolute;
}

.close-button::before {
  content: "";
  position: absolute;
  top: 50%;
  left: -1px;
  border: 1px solid gray;
  width: 17px;
  height: 1px;
  transform: rotate(45deg) translateY(-50%);
}

.close-button::after {
  content: "";
  position: absolute;
  top: 50%;
  right: -1px;
  border: 1px solid gray;
  width: 17px;
  transform: rotate(-45deg) translateY(-50%);
}
</style>
