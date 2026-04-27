export default {
  name: "Pagination",
  props: {
    total:       { type: Number, required: true },
    perPage:     { type: Number, default: 15 },
    currentPage: { type: Number, default: 1 },
  },
  emits: ["page-change"],

  template: `
  <div v-if="totalPages > 1" class="d-flex align-items-center justify-content-between mt-3">
    <small class="text-muted">
      Showing {{ from }}–{{ to }} of {{ total }}
    </small>
    <ul class="pagination pagination-sm mb-0">
      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <button class="page-link" @click="go(currentPage - 1)">&laquo;</button>
      </li>
      <li
        v-for="p in visiblePages"
        :key="p"
        class="page-item"
        :class="{ active: p === currentPage, disabled: p === '…' }"
      >
        <button class="page-link" @click="p !== '…' && go(p)">{{ p }}</button>
      </li>
      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <button class="page-link" @click="go(currentPage + 1)">&raquo;</button>
      </li>
    </ul>
  </div>
  `,

  computed: {
    totalPages() {
      return Math.ceil(this.total / this.perPage) || 1;
    },
    from() {
      return (this.currentPage - 1) * this.perPage + 1;
    },
    to() {
      return Math.min(this.currentPage * this.perPage, this.total);
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const cur   = this.currentPage;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        if (cur > 3)          pages.push("…");
        for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
        if (cur < total - 2)  pages.push("…");
        pages.push(total);
      }
      return pages;
    }
  },

  methods: {
    go(page) {
      if (page < 1 || page > this.totalPages) return;
      this.$emit("page-change", page);
    }
  }
};
