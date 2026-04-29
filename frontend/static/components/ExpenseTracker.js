export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Expense Tracker</h4>
        <p class="text-muted small mb-0">Track clinic expenses — rent, supplies, staff, equipment</p>
      </div>
    </div>

    <!-- Add Expense Card -->
    <div class="card mb-4">
      <div class="card-body">
        <h6 class="fw-semibold mb-3">Add New Expense</h6>
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label small">Title</label>
            <input v-model="form.title" class="form-control form-control-sm" placeholder="e.g. Clinic Rent" />
          </div>
          <div class="col-md-2">
            <label class="form-label small">Category</label>
            <select v-model="form.category" class="form-select form-select-sm">
              <option>Rent</option>
              <option>Supplies</option>
              <option>Equipment</option>
              <option>Staff</option>
              <option>Utilities</option>
              <option>Other</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small">Amount (&#8377;)</label>
            <input v-model.number="form.amount" type="number" class="form-control form-control-sm" placeholder="0" min="0" />
          </div>
          <div class="col-md-2">
            <label class="form-label small">Date</label>
            <input v-model="form.date" type="date" class="form-control form-control-sm" :max="today" />
          </div>
          <div class="col-md-2">
            <label class="form-label small">Notes</label>
            <input v-model="form.description" class="form-control form-control-sm" placeholder="Optional" />
          </div>
          <div class="col-md-1">
            <button @click="addExpense" class="btn btn-success btn-sm w-100">Add</button>
          </div>
        </div>
        <div class="text-danger mt-2 small" v-if="formError">{{ formError }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body py-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <select v-model="filterMonth" class="form-select form-select-sm">
              <option value="">All Months</option>
              <option v-for="(m, i) in months" :key="i+1" :value="i+1">{{ m }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <input v-model.number="filterYear" type="number" class="form-control form-control-sm" placeholder="Year" />
          </div>
          <div class="col-md-2">
            <select v-model="filterCategory" class="form-select form-select-sm">
              <option value="">All Categories</option>
              <option>Rent</option><option>Supplies</option><option>Equipment</option>
              <option>Staff</option><option>Utilities</option><option>Other</option>
            </select>
          </div>
          <div class="col-auto d-flex gap-2">
            <button @click="fetchExpenses" class="btn btn-primary btn-sm">Apply</button>
            <button @click="clearFilters" class="btn btn-outline-secondary btn-sm">Reset</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="alert alert-warning d-flex justify-content-between align-items-center mb-4" v-if="filteredExpenses.length">
      <span><strong>{{ filteredExpenses.length }}</strong> expense entries</span>
      <strong>Total: &#8377; {{ totalExpenses.toLocaleString('en-IN') }}</strong>
    </div>

    <!-- Table -->
    <div v-if="filteredExpenses.length" class="card">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>#</th><th>Title</th><th>Category</th>
              <th>Amount (&#8377;)</th><th>Date</th><th>Notes</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(e, i) in filteredExpenses" :key="e.id">
              <td class="text-muted">{{ i + 1 }}</td>
              <td class="fw-semibold">{{ e.title }}</td>
              <td><span class="badge bg-secondary">{{ e.category }}</span></td>
              <td class="text-danger fw-bold">&#8377; {{ e.amount }}</td>
              <td class="text-muted">{{ e.date }}</td>
              <td class="text-muted">{{ e.description || '—' }}</td>
              <td>
                <button class="btn btn-sm btn-outline-danger" @click="deleteExpense(e.id)">Delete</button>
              </td>
            </tr>
          </tbody>
          <tfoot class="table-light">
            <tr>
              <td colspan="3" class="text-end fw-bold">Total</td>
              <td colspan="4">
                <span class="badge bg-danger fs-6">&#8377; {{ totalExpenses.toLocaleString('en-IN') }}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div v-else class="card p-5 text-center">
      <div style="font-size:48px">&#129534;</div>
      <h5 class="mt-3 text-muted">No expenses recorded</h5>
      <p class="text-muted small">Add your first expense above.</p>
    </div>
  </div>
  `,

  data() {
    return {
      token:          localStorage.getItem("auth-token"),
      expenses:       [],
      filterMonth:    new Date().getMonth() + 1,
      filterYear:     new Date().getFullYear(),
      filterCategory: "",
      today:          new Date().toISOString().split("T")[0],
      formError:      null,
      form:           { title: "", category: "Other", amount: null, date: new Date().toISOString().split("T")[0], description: "" },
      months:         ["January","February","March","April","May","June",
                       "July","August","September","October","November","December"]
    };
  },

  computed: {
    filteredExpenses() {
      return this.expenses.filter(e => !this.filterCategory || e.category === this.filterCategory);
    },
    totalExpenses() {
      return this.filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    }
  },

  methods: {
    async fetchExpenses() {
      try {
        const params = new URLSearchParams();
        if (this.filterMonth) params.append("month", this.filterMonth);
        if (this.filterYear)  params.append("year",  this.filterYear);
        const res = await fetch(`/api/expenses?${params}`, {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.expenses = await res.json();
      } catch (err) {
        console.error("Expense fetch error:", err);
      }
    },

    async addExpense() {
      this.formError = null;
      if (!this.form.title || !this.form.amount || !this.form.date) {
        this.formError = "Title, amount, and date are required.";
        return;
      }
      try {
        const res = await fetch("/api/expenses", {
          method:  "POST",
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
          body:    JSON.stringify(this.form)
        });
        if (res.ok) {
          this.$toast("Expense added successfully!");
          this.form = { title: "", category: "Other", amount: null, date: this.today, description: "" };
          await this.fetchExpenses();
        } else {
          this.formError = "Failed to add expense.";
        }
      } catch (err) {
        console.error("Add expense error:", err);
      }
    },

    async deleteExpense(id) {
      if (!window.confirm("Delete this expense?")) return;
      try {
        const res = await fetch(`/api/expenses/${id}`, {
          method:  "DELETE",
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) {
          this.$toast("Expense deleted.", "info");
          await this.fetchExpenses();
        } else {
          this.$toast("Failed to delete expense.", "danger");
        }
      } catch (err) {
        console.error("Delete expense error:", err);
        this.$toast("Network error. Please try again.", "danger");
      }
    },

    clearFilters() {
      this.filterMonth    = "";
      this.filterYear     = "";
      this.filterCategory = "";
      this.fetchExpenses();
    }
  },

  async mounted() {
    await this.fetchExpenses();
  }
};
