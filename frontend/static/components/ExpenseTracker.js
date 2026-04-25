export default {
  template: `
  <div class="container p-4">
    <h2 class="fw-bold mb-1">Expense Tracker</h2>
    <p class="text-muted mb-4">Track clinic expenses — rent, supplies, staff, equipment</p>
    <hr class="custom-hr">

    <!-- Add Expense Form -->
    <div class="card border-0 shadow-sm mb-5">
      <div class="card-body">
        <h5 class="fw-bold mb-3">Add New Expense</h5>
        <div class="row g-2">
          <div class="col-md-3">
            <input v-model="form.title" class="form-control" placeholder="Title e.g. Clinic Rent" required />
          </div>
          <div class="col-md-2">
            <select v-model="form.category" class="form-select">
              <option value="Rent">Rent</option>
              <option value="Supplies">Supplies</option>
              <option value="Equipment">Equipment</option>
              <option value="Staff">Staff</option>
              <option value="Utilities">Utilities</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="col-md-2">
            <input v-model.number="form.amount" type="number" class="form-control" placeholder="Amount (₹)" min="0" required />
          </div>
          <div class="col-md-2">
            <input v-model="form.date" type="date" class="form-control" :max="today" required />
          </div>
          <div class="col-md-2">
            <input v-model="form.description" class="form-control" placeholder="Notes (optional)" />
          </div>
          <div class="col-md-1">
            <button @click="addExpense" class="btn btn-success w-100">Add</button>
          </div>
        </div>
        <div class="text-danger mt-2" v-if="formError">{{ formError }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="row g-2 mb-3">
      <div class="col-md-3">
        <select v-model="filterMonth" class="form-select">
          <option value="">All Months</option>
          <option v-for="(m, i) in months" :key="i+1" :value="i+1">{{ m }}</option>
        </select>
      </div>
      <div class="col-md-2">
        <input v-model.number="filterYear" type="number" class="form-control" placeholder="Year" />
      </div>
      <div class="col-md-2">
        <select v-model="filterCategory" class="form-select">
          <option value="">All Categories</option>
          <option>Rent</option>
          <option>Supplies</option>
          <option>Equipment</option>
          <option>Staff</option>
          <option>Utilities</option>
          <option>Other</option>
        </select>
      </div>
      <div class="col-md-2">
        <button @click="fetchExpenses" class="btn btn-primary w-100">Apply</button>
      </div>
      <div class="col-md-2">
        <button @click="clearFilters" class="btn btn-secondary w-100">Reset</button>
      </div>
    </div>

    <!-- Summary -->
    <div class="alert alert-warning d-flex justify-content-between mb-4" v-if="expenses.length">
      <span><strong>{{ expenses.length }}</strong> expense entries</span>
      <strong>Total: ₹ {{ totalExpenses }}</strong>
    </div>

    <!-- Expense Table -->
    <div class="table-responsive" v-if="expenses.length">
      <table class="table table-bordered table-hover">
        <thead class="table-dark">
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Category</th>
            <th>Amount (₹)</th>
            <th>Date</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(e, i) in filteredExpenses" :key="e.id">
            <td>{{ i + 1 }}</td>
            <td>{{ e.title }}</td>
            <td><span class="badge bg-secondary">{{ e.category }}</span></td>
            <td><span class="text-danger fw-bold">₹ {{ e.amount }}</span></td>
            <td>{{ e.date }}</td>
            <td>{{ e.description || '—' }}</td>
            <td>
              <button class="btn btn-sm btn-danger" @click="deleteExpense(e.id)">Delete</button>
            </td>
          </tr>
        </tbody>
        <tfoot class="table-light">
          <tr>
            <td colspan="3" class="text-end fw-bold">Total</td>
            <td colspan="4"><span class="badge bg-danger fs-6">₹ {{ totalExpenses }}</span></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div v-else class="text-center text-muted mt-4">No expenses recorded for the selected period.</div>
  </div>
  `,

  data() {
    return {
      token:          localStorage.getItem("auth-token"),
      userId:         localStorage.getItem("user_id"),
      expenses:       [],
      filterMonth:    new Date().getMonth() + 1,
      filterYear:     new Date().getFullYear(),
      filterCategory: '',
      today:          new Date().toISOString().split("T")[0],
      formError:      null,
      form: {
        title:       '',
        category:    'Other',
        amount:      null,
        date:        new Date().toISOString().split("T")[0],
        description: ''
      },
      months: ["January","February","March","April","May","June",
               "July","August","September","October","November","December"]
    };
  },

  computed: {
    filteredExpenses() {
      return this.expenses.filter(e =>
        !this.filterCategory || e.category === this.filterCategory
      );
    },
    totalExpenses() {
      return this.filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    }
  },

  methods: {
    async fetchExpenses() {
      try {
        const params = new URLSearchParams({ doctor_id: this.userId });
        if (this.filterMonth) params.append("month", this.filterMonth);
        if (this.filterYear)  params.append("year",  this.filterYear);

        const res = await fetch(`/api/expenses?${params}`, {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.expenses = await res.json();
      } catch (err) { console.error("Expense fetch error:", err); }
    },

    async addExpense() {
      this.formError = null;
      if (!this.form.title || !this.form.amount || !this.form.date) {
        this.formError = "Title, amount, and date are required.";
        return;
      }
      try {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": this.token
          },
          body: JSON.stringify({ ...this.form, doctor_id: parseInt(this.userId) })
        });
        if (res.ok) {
          this.form = { title: '', category: 'Other', amount: null,
                        date: this.today, description: '' };
          await this.fetchExpenses();
        } else {
          this.formError = "Failed to add expense.";
        }
      } catch (err) { console.error("Add expense error:", err); }
    },

    async deleteExpense(id) {
      if (!confirm("Delete this expense?")) return;
      try {
        const res = await fetch(`/api/expenses/${id}`, {
          method: "DELETE",
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) await this.fetchExpenses();
      } catch (err) { console.error("Delete expense error:", err); }
    },

    clearFilters() {
      this.filterMonth    = '';
      this.filterYear     = '';
      this.filterCategory = '';
      this.fetchExpenses();
    }
  },

  async mounted() {
    await this.fetchExpenses();
  }
};