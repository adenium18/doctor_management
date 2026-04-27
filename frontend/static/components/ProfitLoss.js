export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Profit &amp; Loss Statement</h4>
        <p class="text-muted small mb-0">Detailed income vs expense breakdown</p>
      </div>
      <router-link to="/finance" class="btn btn-outline-secondary btn-sm">&larr; Finance Dashboard</router-link>
    </div>

    <!-- Period Filter -->
    <div class="card mb-4">
      <div class="card-body py-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-2">
            <label class="form-label small text-muted mb-1">Period</label>
            <select v-model="period" @change="onPeriodChange" class="form-select form-select-sm">
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <template v-if="period === 'custom'">
            <div class="col-md-2">
              <label class="form-label small text-muted mb-1">From</label>
              <input v-model="startDate" type="date" class="form-control form-control-sm" />
            </div>
            <div class="col-md-2">
              <label class="form-label small text-muted mb-1">To</label>
              <input v-model="endDate" type="date" class="form-control form-control-sm" :max="today" />
            </div>
          </template>
          <div class="col-auto">
            <button @click="fetchPL" class="btn btn-primary btn-sm">Generate</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted small">Generating P&amp;L...</p>
    </div>

    <div v-else-if="pl">

      <!-- Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="text-muted small">Gross Revenue</div>
            <div class="h4 fw-bold text-primary mt-1">&#8377; {{ fmt(pl.gross_revenue) }}</div>
            <div class="text-muted small">{{ pl.total_visits }} visits</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card" style="border-left-color:#16a34a">
            <div class="text-muted small">Paid Revenue</div>
            <div class="h4 fw-bold text-success mt-1">&#8377; {{ fmt(pl.paid_revenue) }}</div>
            <div class="text-muted small">collected</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card" style="border-left-color:#dc2626">
            <div class="text-muted small">Total Expenses</div>
            <div class="h4 fw-bold text-danger mt-1">&#8377; {{ fmt(pl.total_expenses) }}</div>
            <div class="text-muted small">{{ pl.expense_ratio || 0 }}% of revenue</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card" :style="{ borderLeftColor: pl.net_profit >= 0 ? '#16a34a' : '#dc2626' }">
            <div class="text-muted small">Net Profit</div>
            <div class="h4 fw-bold mt-1" :class="pl.net_profit >= 0 ? 'text-success' : 'text-danger'">
              &#8377; {{ fmt(pl.net_profit) }}
            </div>
            <div class="text-muted small">{{ pl.profit_margin || 0 }}% margin</div>
          </div>
        </div>
      </div>

      <!-- Detail Row -->
      <div class="row g-3 mb-4">
        <!-- Revenue Breakdown -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="fw-semibold mb-3">Revenue Breakdown by Visit Type</h6>

              <!-- Paid / Unpaid bar -->
              <div class="mb-3">
                <div class="d-flex justify-content-between small text-muted mb-1">
                  <span>Payment Status</span>
                  <span>&#8377; {{ fmt(pl.gross_revenue) }} total</span>
                </div>
                <div class="progress mb-2" style="height:10px">
                  <div class="progress-bar bg-success" :style="{ width: paidPct + '%' }" :title="'Paid: ₹' + fmt(pl.paid_revenue)"></div>
                  <div class="progress-bar bg-warning" :style="{ width: partialPct + '%' }" :title="'Partial: ₹' + fmt(pl.partial_revenue)"></div>
                  <div class="progress-bar bg-danger"  :style="{ width: unpaidPct + '%' }" :title="'Unpaid: ₹' + fmt(pl.unpaid_revenue)"></div>
                </div>
                <div class="d-flex gap-3 small">
                  <span><span class="badge bg-success">Paid</span> &#8377; {{ fmt(pl.paid_revenue) }}</span>
                  <span><span class="badge bg-warning text-dark">Partial</span> &#8377; {{ fmt(pl.partial_revenue) }}</span>
                  <span><span class="badge bg-danger">Unpaid</span> &#8377; {{ fmt(pl.unpaid_revenue) }}</span>
                </div>
              </div>

              <hr>
              <table class="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Visit Type</th><th>Visits</th><th>Revenue (&#8377;)</th><th>Avg (&#8377;)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="vt in pl.visit_breakdown" :key="vt.visit_type">
                    <td class="text-capitalize">{{ vt.visit_type || 'Consultation' }}</td>
                    <td>{{ vt.count }}</td>
                    <td class="text-success fw-semibold">&#8377; {{ fmt(vt.revenue) }}</td>
                    <td class="text-muted">&#8377; {{ fmt(vt.avg_charge) }}</td>
                  </tr>
                  <tr v-if="!pl.visit_breakdown || !pl.visit_breakdown.length">
                    <td colspan="4" class="text-muted text-center">No data</td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <td class="fw-bold">Total</td>
                    <td class="fw-bold">{{ pl.total_visits }}</td>
                    <td class="fw-bold text-success">&#8377; {{ fmt(pl.gross_revenue) }}</td>
                    <td class="fw-bold text-muted">&#8377; {{ fmt(pl.avg_per_visit) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Expense Breakdown -->
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="fw-semibold mb-3">Expense Breakdown by Category</h6>
              <div v-if="pl.expense_breakdown && pl.expense_breakdown.length">
                <div v-for="ex in pl.expense_breakdown" :key="ex.category" class="mb-2">
                  <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">{{ ex.category }}</span>
                    <span class="fw-semibold">&#8377; {{ fmt(ex.amount) }}</span>
                  </div>
                  <div class="progress" style="height:6px">
                    <div class="progress-bar bg-danger"
                      :style="{ width: expensePct(ex.amount) + '%' }">
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-muted text-center py-3">No expenses recorded</div>
              <hr>
              <div class="d-flex justify-content-between">
                <span class="fw-bold">Total Expenses</span>
                <span class="fw-bold text-danger">&#8377; {{ fmt(pl.total_expenses) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Full P&L Statement -->
      <div class="card">
        <div class="card-body">
          <h6 class="fw-semibold mb-3">Statement Summary</h6>
          <table class="table table-sm mb-0" style="max-width:420px">
            <tbody>
              <tr>
                <td class="text-muted">Gross Revenue</td>
                <td class="text-end fw-semibold">&#8377; {{ fmt(pl.gross_revenue) }}</td>
              </tr>
              <tr>
                <td class="text-muted ps-3">— Paid</td>
                <td class="text-end text-success">&#8377; {{ fmt(pl.paid_revenue) }}</td>
              </tr>
              <tr>
                <td class="text-muted ps-3">— Unpaid (receivable)</td>
                <td class="text-end text-warning">&#8377; {{ fmt(pl.unpaid_revenue) }}</td>
              </tr>
              <tr class="table-light">
                <td class="fw-bold">Total Expenses</td>
                <td class="text-end fw-bold text-danger">— &#8377; {{ fmt(pl.total_expenses) }}</td>
              </tr>
              <tr class="table-light">
                <td class="fw-bold">Net Profit</td>
                <td class="text-end fw-bold" :class="pl.net_profit >= 0 ? 'text-success' : 'text-danger'">
                  &#8377; {{ fmt(pl.net_profit) }}
                </td>
              </tr>
              <tr>
                <td class="text-muted">Profit Margin</td>
                <td class="text-end">{{ pl.profit_margin || 0 }}%</td>
              </tr>
              <tr>
                <td class="text-muted">Avg Revenue / Visit</td>
                <td class="text-end">&#8377; {{ fmt(pl.avg_per_visit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="card p-5 text-center">
      <div style="font-size:48px">&#128202;</div>
      <h5 class="mt-3 text-muted">Select a period and click Generate</h5>
    </div>
  </div>
  `,

  data() {
    const today = new Date().toISOString().split("T")[0];
    return {
      token:     localStorage.getItem("auth-token"),
      loading:   false,
      period:    "month",
      startDate: today,
      endDate:   today,
      today,
      pl:        null
    };
  },

  computed: {
    paidPct() {
      if (!this.pl || !this.pl.gross_revenue) return 0;
      return Math.round((this.pl.paid_revenue / this.pl.gross_revenue) * 100);
    },
    partialPct() {
      if (!this.pl || !this.pl.gross_revenue) return 0;
      return Math.round(((this.pl.partial_revenue || 0) / this.pl.gross_revenue) * 100);
    },
    unpaidPct() {
      if (!this.pl || !this.pl.gross_revenue) return 0;
      return Math.round((this.pl.unpaid_revenue / this.pl.gross_revenue) * 100);
    }
  },

  methods: {
    fmt(val) {
      return (val || 0).toLocaleString("en-IN");
    },
    expensePct(amount) {
      if (!this.pl || !this.pl.total_expenses) return 0;
      return Math.round((amount / this.pl.total_expenses) * 100);
    },
    onPeriodChange() {
      if (this.period !== "custom") this.fetchPL();
    },
    async fetchPL() {
      this.loading = true;
      this.pl = null;
      try {
        const params = new URLSearchParams({ period: this.period });
        if (this.period === "custom") {
          if (!this.startDate || !this.endDate) {
            alert("Please select both start and end dates.");
            this.loading = false;
            return;
          }
          params.append("from", this.startDate);
          params.append("to",   this.endDate);
        }
        const res = await fetch(`/api/finance/pl?${params}`, {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.pl = await res.json();
        else console.error("P&L fetch failed:", await res.text());
      } catch (err) {
        console.error("P&L error:", err);
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    this.fetchPL();
  }
};
