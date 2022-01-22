<template>
  <modal-dialog :open="open" @close="requestClose">
    <p>Are you sure you want to remove {{ coin.toUpperCase() }} ticker?</p>
    <p>
      Type <b>{{ coin.toUpperCase() }}</b> to remove.
    </p>
    <hr class="border-[1px] border-gray-200 my-4" />
    <div class="flex gap-3">
      <app-input
        type="text"
        :placeholder="coin.toUpperCase()"
        v-model="value"
        @keydown.enter="confirmAction"
      />
      <app-button :disabled="isDisabled" @click="confirmAction">
        Confirm
      </app-button>
      <app-button @click="requestClose">Cancel</app-button>
    </div>
  </modal-dialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AppInput from "./AppInput.vue";
import AppButton from "./AppButton.vue";
import ModalDialog from "./ModalDialog.vue";

export default defineComponent({
  components: { AppInput, AppButton, ModalDialog },

  props: {
    open: {
      type: Boolean,
      required: true,
    },
    coin: {
      type: String,
      required: true,
    },
  },

  emits: {
    close: null,
    confirm: null,
  },

  data() {
    return {
      value: "",
    };
  },

  methods: {
    requestClose() {
      this.$emit("close");
      this.value = "";
    },

    confirmAction() {
      this.$emit("confirm");
      this.value = "";
    },
  },

  computed: {
    isDisabled() {
      return this.value.toLowerCase() !== this.coin.toLowerCase();
    },
  },
});
</script>
