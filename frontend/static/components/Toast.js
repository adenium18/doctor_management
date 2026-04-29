export default {
  name: "ToastContainer",
  template: `
  <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:9999;min-width:300px">
    <transition-group name="toast-slide">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast show mb-2 border-0 shadow"
        :class="bgClass(t.type)"
        role="alert"
        style="min-width:280px;max-width:380px"
      >
        <div class="d-flex align-items-center px-3 py-2">
          <span class="me-2 fs-5">{{ icon(t.type) }}</span>
          <div class="toast-body fw-semibold p-0 flex-grow-1" style="font-size:14px">{{ t.message }}</div>
          <button type="button" class="btn-close btn-close-white ms-2 flex-shrink-0"
            style="opacity:.8" @click="remove(t.id)"></button>
        </div>
      </div>
    </transition-group>
  </div>
  `,

  data() {
    return { toasts: [] };
  },

  methods: {
    add(message, type = "success", duration = 3500) {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, message, type });
      setTimeout(() => this.remove(id), duration);
    },

    remove(id) {
      const idx = this.toasts.findIndex(t => t.id === id);
      if (idx !== -1) this.toasts.splice(idx, 1);
    },

    bgClass(type) {
      return {
        success: "text-bg-success",
        danger:  "text-bg-danger",
        warning: "text-bg-warning text-dark",
        info:    "text-bg-info text-dark",
      }[type] || "text-bg-secondary";
    },

    icon(type) {
      return { success: "✅", danger: "❌", warning: "⚠️", info: "ℹ️" }[type] || "💬";
    }
  }
};
