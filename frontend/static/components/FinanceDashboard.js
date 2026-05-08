export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Finance Dashboard</h4>
        <p class="text-muted small mb-0">Practice revenue, profit &amp; patient analytics</p>
      </div>
      <div class="text-muted small">{{ todayLabel }}</div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted small">Loading financial data...</p>
    </div>

    <div v-else>
      <!-- KPI Row -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-2">
          <div class="stat-card">
            <div class="text-muted small">Today Revenue</div>
            <div class="h4 fw-bold text-primary mt-1">&#8377; {{ fmt(kpis.today_revenue) }}</div>
            <div class="text-muted small">{{ kpis.today_visits || 0 }} visits</div>
          </div>
        </div>
        <div class="col-6 col-md-2">
          <div class="stat-card" style="border-left-color:#16a34a">
            <div class="text-muted small">Month Revenue</div>
            <div class="h4 fw-bold text-success mt-1">&#8377; {{ fmt(kpis.month_revenue) }}</div>
            <div class="text-muted small">{{ kpis.month_visits || 0 }} visits</div>
          </div>
        </div>
        <div class="col-6 col-md-2">
          <div class="stat-card" :style="{ borderLeftColor: kpis.net_profit >= 0 ? '#16a34a' : '#dc2626' }">
            <div class="text-muted small">Net Profit</div>
            <div class="h4 fw-bold mt-1" :class="kpis.net_profit >= 0 ? 'text-success' : 'text-danger'">
              &#8377; {{ fmt(kpis.net_profit) }}
            </div>
            <div class="text-muted small">after expenses</div>
          </div>
        </div>
        <div class="col-6 col-md-2">
          <div class="stat-card" :style="{ borderLeftColor: growthColor }">
            <div class="text-muted small">Revenue Growth</div>
            <div class="h4 fw-bold mt-1" :class="kpis.revenue_growth >= 0 ? 'text-success' : 'text-danger'">
              {{ kpis.revenue_growth >= 0 ? '+' : '' }}{{ kpis.revenue_growth || 0 }}%
            </div>
            <div class="text-muted small">vs last month</div>
          </div>
        </div>
        <div class="col-6 col-md-2">
          <div class="stat-card" style="border-left-color:#f59e0b">
            <div class="text-muted small">Unpaid</div>
            <div class="h4 fw-bold text-warning mt-1">&#8377; {{ fmt(kpis.unpaid_revenue) }}</div>
            <div class="text-muted small">outstanding</div>
          </div>
        </div>
        <div class="col-6 col-md-2">
          <div class="stat-card" style="border-left-color:#6f42c1">
            <div class="text-muted small">Patients</div>
            <div class="h4 fw-bold mt-1" style="color:#6f42c1">{{ kpis.total_patients || 0 }}</div>
            <div class="text-muted small">{{ kpis.new_this_month || 0 }} new, {{ kpis.repeat_this_month || 0 }} repeat</div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="row g-3 mb-4">
        <div class="col-md-8">
          <div class="card">
            <div class="card-body">
              <!-- Chart header: title + mode controls -->
              <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                <div>
                  <h6 class="fw-semibold mb-0">Revenue Trend</h6>
                  <p class="text-muted small mb-0">{{ trendSubtitle }}</p>
                </div>

                <!-- Mode toggle buttons -->
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <div class="btn-group btn-group-sm" role="group">
                    <button v-for="m in trendModes" :key="m.value"
                      type="button" class="btn"
                      :class="trendMode === m.value ? 'btn-primary' : 'btn-outline-secondary'"
                      @click="setTrendMode(m.value)">
                      {{ m.label }}
                    </button>
                  </div>

                  <!-- Daily: last-N-days selector -->
                  <select v-if="trendMode === 'daily'"
                    v-model="trendDays" @change="fetchRevenueTrend"
                    class="form-select form-select-sm" style="width:110px">
                    <option value="7">Last 7 days</option>
                    <option value="14">Last 14 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="60">Last 60 days</option>
                    <option value="90">Last 90 days</option>
                  </select>

                  <!-- Monthly: year selector -->
                  <select v-if="trendMode === 'monthly'"
                    v-model="trendYear" @change="fetchRevenueTrend"
                    class="form-select form-select-sm" style="width:90px">
                    <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                  </select>

                  <!-- Custom: date pickers + apply -->
                  <template v-if="trendMode === 'custom'">
                    <input type="date" v-model="customFrom" class="form-control form-control-sm" style="width:140px" />
                    <span class="text-muted small">to</span>
                    <input type="date" v-model="customTo"   class="form-control form-control-sm" style="width:140px" />
                    <button class="btn btn-primary btn-sm" @click="fetchRevenueTrend" :disabled="trendLoading">
                      {{ trendLoading ? '...' : 'Apply' }}
                    </button>
                  </template>
                </div>
              </div>

              <!-- Loading overlay for chart refresh -->
              <div v-if="trendLoading" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                <span class="ms-2 text-muted small">Updating chart...</span>
              </div>
              <canvas ref="trendChart" height="100" :style="{ opacity: trendLoading ? 0.3 : 1 }"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h6 class="fw-semibold mb-3">Busiest Days</h6>
              <canvas ref="weekdayChart" height="180"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Patients + Quick P&L -->
      <div class="row g-3">
        <div class="col-md-7">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-semibold mb-0">Top Patients by Revenue</h6>
                <router-link to="/profit-loss" class="btn btn-outline-primary btn-sm">Full P&amp;L &#8594;</router-link>
              </div>
              <div class="table-responsive">
                <table class="table mb-0">
                  <thead>
                    <tr>
                      <th>#</th><th>Patient</th><th>Visits</th>
                      <th>Total Revenue</th><th>Avg / Visit</th><th>Last Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(p, i) in topPatients" :key="p.id">
                      <td class="text-muted">{{ i + 1 }}</td>
                      <td class="fw-semibold">{{ p.full_name }}</td>
                      <td>{{ p.total_visits }}</td>
                      <td><span class="badge bg-success">&#8377; {{ fmt(p.total_revenue) }}</span></td>
                      <td class="text-muted">&#8377; {{ fmt(p.avg_per_visit) }}</td>
                      <td class="text-muted">{{ fmtDate(p.last_visit) }}</td>
                    </tr>
                    <tr v-if="!topPatients.length">
                      <td colspan="6" class="text-center text-muted py-3">No data yet</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-5">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="fw-semibold mb-3">This Month at a Glance</h6>
              <div class="d-flex justify-content-between mb-3">
                <span class="text-muted">Gross Revenue</span>
                <strong class="text-success">&#8377; {{ fmt(kpis.month_revenue) }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span class="text-muted">Paid</span>
                <strong class="text-success">&#8377; {{ fmt((kpis.month_revenue || 0) - (kpis.unpaid_revenue || 0)) }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span class="text-muted">Unpaid</span>
                <strong class="text-warning">&#8377; {{ fmt(kpis.unpaid_revenue) }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span class="text-muted">Expenses</span>
                <strong class="text-danger">&#8377; {{ fmt(kpis.month_expenses) }}</strong>
              </div>
              <hr>
              <div class="d-flex justify-content-between">
                <span class="fw-bold">Net Profit</span>
                <strong :class="kpis.net_profit >= 0 ? 'text-success' : 'text-danger'" class="fs-6">
                  &#8377; {{ fmt(kpis.net_profit) }}
                </strong>
              </div>
              <div class="mt-3">
                <div class="progress" style="height:8px" title="Profit margin">
                  <div class="progress-bar bg-success" :style="{ width: profitMarginPct + '%' }"></div>
                </div>
                <div class="text-muted small mt-1">Profit margin: {{ profitMarginPct }}%</div>
              </div>
              <!-- Payment method breakdown -->
              <div v-if="kpis.payment_method_breakdown" class="mt-3">
                <div class="text-muted small fw-semibold mb-2" style="letter-spacing:.5px">PAYMENT METHODS</div>
                <div v-for="(amt, method) in kpis.payment_method_breakdown" :key="method"
                     class="d-flex justify-content-between align-items-center mb-1" style="font-size:13px">
                  <span>
                    <span v-if="method==='cash'">💵</span>
                    <span v-else-if="method==='upi'">📱</span>
                    <span v-else-if="method==='netbanking'">🏦</span>
                    <span v-else>🔖</span>
                    <span class="text-capitalize ms-1">{{ method }}</span>
                  </span>
                  <span class="fw-semibold">&#8377; {{ fmt(amt) }}</span>
                </div>
              </div>
              <div class="mt-3 d-grid">
                <router-link to="/profit-loss" class="btn btn-primary btn-sm">View Full P&amp;L Report</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    const now  = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, "0");
    const dd   = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    // default custom range: first of this month → today
    const firstOfMonth = `${yyyy}-${mm}-01`;

    return {
      token:       localStorage.getItem("auth-token"),
      loading:     true,
      trendLoading:false,
      kpis:        {},
      topPatients: [],

      // trend controls
      trendMode:   "monthly",                         // daily | monthly | yearly | custom
      trendYear:   yyyy,
      trendDays:   "30",
      customFrom:  firstOfMonth,
      customTo:    todayStr,

      trendModes: [
        { value: "daily",   label: "Daily"   },
        { value: "monthly", label: "Monthly" },
        { value: "yearly",  label: "Yearly"  },
        { value: "custom",  label: "Custom"  },
      ],
      yearOptions: [yyyy - 2, yyyy - 1, yyyy],

      // chart instances
      trendChart:  null,
      weekdayChart:null,

      todayLabel: now.toLocaleDateString("en-IN", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
      })
    };
  },

  computed: {
    growthColor() {
      return (this.kpis.revenue_growth || 0) >= 0 ? "#16a34a" : "#dc2626";
    },
    profitMarginPct() {
      if (!this.kpis.month_revenue) return 0;
      const pct = Math.round(((this.kpis.net_profit || 0) / this.kpis.month_revenue) * 100);
      return Math.max(0, Math.min(100, pct));
    },
    trendSubtitle() {
      if (this.trendMode === "daily")   return `Last ${this.trendDays} days`;
      if (this.trendMode === "monthly") return `Jan – Dec ${this.trendYear}`;
      if (this.trendMode === "yearly")  return "All years";
      if (this.trendMode === "custom")  return `${this.customFrom} to ${this.customTo}`;
      return "";
    }
  },

  methods: {
    fmt(val) {
      return (val || 0).toLocaleString("en-IN");
    },
    fmtDate(dt) {
      if (!dt) return "—";
      return new Date(dt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    },

    setTrendMode(mode) {
      this.trendMode = mode;
      // Don't auto-fetch for custom — wait for user to pick dates and click Apply
      if (mode !== "custom") this.fetchRevenueTrend();
    },

    async fetchKpis() {
      try {
        const res = await fetch("/api/finance/kpis", {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.kpis = await res.json();
      } catch (err) { console.error("KPI fetch error:", err); }
    },

    async fetchTopPatients() {
      try {
        const res = await fetch("/api/finance/top-patients?limit=8", {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.topPatients = await res.json();
      } catch (err) { console.error("Top patients error:", err); }
    },

    async fetchRevenueTrend() {
      this.trendLoading = true;
      try {
        // Build query params based on active mode
        const params = new URLSearchParams({ mode: this.trendMode });
        if (this.trendMode === "daily")   params.set("days", this.trendDays);
        if (this.trendMode === "monthly") params.set("year", this.trendYear);
        if (this.trendMode === "custom") {
          if (this.customFrom) params.set("from", this.customFrom);
          if (this.customTo)   params.set("to",   this.customTo);
        }

        const res = await fetch(`/api/finance/revenue-trend?${params}`, {
          headers: { "Authentication-Token": this.token }
        });
        if (!res.ok) return;
        const data = await res.json();

        if (this.trendChart) { this.trendChart.destroy(); this.trendChart = null; }
        await this.$nextTick();

        this.trendChart = new Chart(this.$refs.trendChart, {
          data: {
            labels: data.labels,
            datasets: [
              {
                type:            "bar",
                label:           "Revenue (₹)",
                data:            data.revenue,
                backgroundColor: "rgba(37,99,235,0.15)",
                borderColor:     "#2563eb",
                borderWidth:     2,
                borderRadius:    4,
                yAxisID:         "y"
              },
              {
                type:        "line",
                label:       "Visits",
                data:        data.visits,
                borderColor: "#16a34a",
                borderWidth: 2,
                tension:     0.4,
                fill:        false,
                yAxisID:     "y1",
                pointRadius: data.labels.length > 60 ? 0 : 4,
                pointHoverRadius: 5
              }
            ]
          },
          options: {
            responsive:  true,
            interaction: { mode: "index", intersect: false },
            scales: {
              x: {
                ticks: {
                  maxRotation: 45,
                  // auto-skip labels when there are many data points
                  maxTicksLimit: data.labels.length > 30 ? 15 : undefined
                }
              },
              y: {
                beginAtZero: true,
                ticks: { callback: v => "₹" + v.toLocaleString("en-IN") }
              },
              y1: {
                beginAtZero: true,
                position:    "right",
                grid:        { drawOnChartArea: false },
                title:       { display: true, text: "Visits" }
              }
            },
            plugins: {
              legend: { position: "top" },
              tooltip: {
                callbacks: {
                  label: ctx => ctx.dataset.yAxisID === "y"
                    ? `Revenue: ₹${(ctx.raw || 0).toLocaleString("en-IN")}`
                    : `Visits: ${ctx.raw}`
                }
              }
            }
          }
        });
      } catch (err) {
        console.error("Revenue trend error:", err);
      } finally {
        this.trendLoading = false;
      }
    },

    async fetchWeekday() {
      try {
        const res = await fetch("/api/finance/by-weekday", {
          headers: { "Authentication-Token": this.token }
        });
        if (!res.ok) return;
        const data = await res.json();

        if (this.weekdayChart) this.weekdayChart.destroy();

        const maxIdx = data.revenue.indexOf(Math.max(...data.revenue));
        this.weekdayChart = new Chart(this.$refs.weekdayChart, {
          type: "bar",
          data: {
            labels: data.labels,
            datasets: [{
              label:           "Revenue (₹)",
              data:            data.revenue,
              backgroundColor: data.revenue.map((_, i) =>
                i === maxIdx ? "rgba(37,99,235,0.9)" : "rgba(37,99,235,0.25)"
              ),
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { callback: v => "₹" + v } }
            }
          }
        });
      } catch (err) { console.error("Weekday chart error:", err); }
    }
  },

  async mounted() {
    this.loading = true;
    await Promise.all([this.fetchKpis(), this.fetchTopPatients()]);
    this.loading = false;
    await this.$nextTick();
    await Promise.all([this.fetchRevenueTrend(), this.fetchWeekday()]);
  },

  beforeDestroy() {
    if (this.trendChart)   this.trendChart.destroy();
    if (this.weekdayChart) this.weekdayChart.destroy();
  }
};
