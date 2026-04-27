export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Billing</h4>
        <p class="text-muted small mb-0">Track consultation charges</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body py-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label small text-muted mb-1">Month</label>
            <select v-model="filterMonth" class="form-select form-select-sm">
              <option value="">All Months</option>
              <option v-for="(m, i) in months" :key="i+1" :value="i+1">{{ m }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small text-muted mb-1">Year</label>
            <input v-model.number="filterYear" type="number" class="form-control form-control-sm" placeholder="e.g. 2025" />
          </div>
          <div class="col-auto d-flex gap-2">
            <button @click="fetchBilling" class="btn btn-primary btn-sm">Apply</button>
            <button @click="clearFilters" class="btn btn-outline-secondary btn-sm">Reset</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="row g-3 mb-4" v-if="records.length">
      <div class="col-md-4">
        <div class="stat-card">
          <div class="text-muted small">Total Consultations</div>
          <div class="h3 fw-bold text-primary mt-1">{{ records.length }}</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card" style="border-left-color: var(--success)">
          <div class="text-muted small">Total Revenue</div>
          <div class="h3 fw-bold text-success mt-1">&#8377; {{ total.toLocaleString('en-IN') }}</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card" style="border-left-color: #6f42c1">
          <div class="text-muted small">Avg per Consultation</div>
          <div class="h3 fw-bold mt-1" style="color:#6f42c1">
            &#8377; {{ records.length ? Math.round(total / records.length) : 0 }}
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <!-- Table -->
    <div v-else-if="records.length" class="card">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Patient</th>
              <th>Phone</th>
              <th>Pincode</th>
              <th>Date</th>
              <th>Charges (&#8377;)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in records" :key="r.casepaper_id">
              <td class="text-muted">{{ i + 1 }}</td>
              <td class="fw-semibold">{{ r.full_name }}</td>
              <td class="text-muted">{{ r.phone || '—' }}</td>
              <td class="text-muted">{{ r.pincode || '—' }}</td>
              <td class="text-muted">{{ formatDate(r.created_at) }}</td>
              <td><span class="badge bg-success">&#8377; {{ r.charges }}</span></td>
            </tr>
          </tbody>
          <tfoot class="table-light">
            <tr>
              <td colspan="5" class="text-end fw-bold">Total</td>
              <td><span class="badge bg-primary fs-6">&#8377; {{ total.toLocaleString('en-IN') }}</span></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div v-else-if="!loading" class="card p-5 text-center">
      <div style="font-size:48px">&#128176;</div>
      <h5 class="mt-3 text-muted">No billing records</h5>
      <p class="text-muted small">No records found for the selected period.</p>
    </div>
  </div>
  `,

  data() {
    return {
      token:       localStorage.getItem("auth-token"),
      records:     [],
      total:       0,
      loading:     false,
      filterMonth: new Date().getMonth() + 1,
      filterYear:  new Date().getFullYear(),
      months:      ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"]
    };
  },

  methods: {
    async fetchBilling() {
      this.loading = true;
      try {
        const params = new URLSearchParams();
        if (this.filterMonth) params.append("month", this.filterMonth);
        if (this.filterYear)  params.append("year",  this.filterYear);

        const res = await fetch(`/api/billing?${params}`, {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) {
          const data   = await res.json();
          this.records = data.records || [];
          this.total   = data.total   || 0;
        }
      } catch (err) {
        console.error("Billing fetch error:", err);
      } finally {
        this.loading = false;
      }
    },

    clearFilters() {
      this.filterMonth = "";
      this.filterYear  = "";
      this.fetchBilling();
    },

    formatDate(dt) {
      if (!dt) return "N/A";
      return new Date(dt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
    }
  },

  async mounted() {
    await this.fetchBilling();
  }
};
