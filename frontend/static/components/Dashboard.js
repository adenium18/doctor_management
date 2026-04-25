export default {
  template: `
  <div class="container-fluid p-4">
    <h2 class="fw-bold mb-1">Dashboard</h2>
    <p class="text-muted mb-4">{{ stats.month || '' }} Overview</p>
    <hr class="custom-hr">

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Loading dashboard...</p>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="!loading">
      <!-- Stat Cards -->
      <div class="row g-4 mb-5">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #0d6efd !important;">
            <div class="card-body">
              <div class="text-muted small mb-1">Total Patients</div>
              <h2 class="fw-bold text-primary">{{ stats.total_patients ?? '—' }}</h2>
              <div class="text-muted small">All time</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #198754 !important;">
            <div class="card-body">
              <div class="text-muted small mb-1">This Month's Earnings</div>
              <h2 class="fw-bold text-success">₹ {{ stats.monthly_earnings ?? 0 }}</h2>
              <div class="text-muted small">{{ stats.monthly_casepapers ?? 0 }} consultations</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #fd7e14 !important;">
            <div class="card-body">
              <div class="text-muted small mb-1">Total Earnings</div>
              <h2 class="fw-bold text-warning">₹ {{ stats.total_earnings ?? 0 }}</h2>
              <div class="text-muted small">All time</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm h-100" style="border-left: 4px solid #6f42c1 !important;">
            <div class="card-body">
              <div class="text-muted small mb-1">Total Casepapers</div>
              <h2 class="fw-bold" style="color:#6f42c1">{{ stats.total_casepapers ?? '—' }}</h2>
              <div class="text-muted small">All time</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Glance + Quick Actions -->
      <div class="row g-4 mb-5">
        <div class="col-md-6">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="fw-bold mb-3">This Month at a Glance</h5>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Gross Income</span>
                <strong class="text-success">₹ {{ stats.monthly_earnings ?? 0 }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Total Expenses</span>
                <strong class="text-danger">₹ {{ monthlyExpenses }}</strong>
              </div>
              <hr>
              <div class="d-flex justify-content-between">
                <span class="fw-bold">Net Profit</span>
                <strong :class="netProfit >= 0 ? 'text-success' : 'text-danger'">
                  ₹ {{ netProfit }}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="fw-bold mb-3">Quick Actions</h5>
              <div class="d-grid gap-2">
                <button class="btn btn-outline-primary" @click="$router.push('/billing')">💰 View Billing</button>
                <button class="btn btn-outline-success" @click="$router.push('/reports')">📊 Download Reports</button>
                <button class="btn btn-outline-warning" @click="$router.push('/expenses')">🧾 Manage Expenses</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Casepapers -->
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h5 class="fw-bold mb-3">Recent Casepapers</h5>
          <div class="table-responsive" v-if="recentCasepapers.length">
            <table class="table table-sm table-hover">
              <thead class="table-light">
                <tr>
                  <th>Patient</th>
                  <th>Symptoms</th>
                  <th>Diagnosis</th>
                  <th>Charges</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cp in recentCasepapers" :key="cp.casepaper_id">
                  <td>{{ cp.full_name }}</td>
                  <td>{{ cp.symptoms }}</td>
                  <td>{{ cp.diagnosis }}</td>
                  <td><span class="badge bg-success">₹ {{ cp.charges ?? 150 }}</span></td>
                  <td>{{ formatDate(cp.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-muted text-center py-3">No casepapers yet.</div>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      token:            localStorage.getItem("auth-token"),
      // ✅ Read doctor_id directly from localStorage — set at login time
      doctorId:         localStorage.getItem("doctor_id"),
      stats:            {},
      recentCasepapers: [],
      monthlyExpenses:  0,
      loading:          true,
      error:            null
    };
  },

  computed: {
    netProfit() {
      return (this.stats.monthly_earnings || 0) - this.monthlyExpenses;
    }
  },

  methods: {
    async fetchStats() {
      // ✅ Guard — if doctorId is missing, show clear error instead of sending null
      if (!this.doctorId) {
        this.error = "Doctor ID not found. Please log out and log in again.";
        return;
      }
      try {
        const res = await fetch(`/api/dashboard/stats?doctor_id=${this.doctorId}`, {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) {
          this.stats = await res.json();
        } else {
          const err = await res.json();
          this.error = err.error || "Failed to load stats.";
        }
      } catch (err) {
        console.error("Stats error:", err);
        this.error = "Network error loading stats.";
      }
    },

    async fetchRecentCasepapers() {
      try {
        const res = await fetch("/api/casepapers", {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) {
          const data = await res.json();
          this.recentCasepapers = Array.isArray(data) ? data.slice(0, 5) : [];
        }
      } catch (err) {
        console.error("Casepapers error:", err);
      }
    },

    async fetchMonthlyExpenses() {
      if (!this.doctorId) return;
      const now = new Date();
      try {
        const res = await fetch(
          `/api/expenses?doctor_id=${this.doctorId}&month=${now.getMonth()+1}&year=${now.getFullYear()}`,
          { headers: { "Authentication-Token": this.token } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            this.monthlyExpenses = data.reduce((sum, e) => sum + (e.amount || 0), 0);
          }
        }
      } catch (err) {
        console.warn("Expenses not available:", err);
        this.monthlyExpenses = 0;
      }
    },

    formatDate(dt) {
      if (!dt) return "N/A";
      return new Date(dt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
    }
  },

  async mounted() {
    this.loading = true;
    await Promise.all([
      this.fetchStats(),
      this.fetchRecentCasepapers(),
      this.fetchMonthlyExpenses()
    ]);
    this.loading = false;
  }
};