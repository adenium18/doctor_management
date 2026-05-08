export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Billing</h4>
        <p class="text-muted small mb-0">Track consultation charges</p>
      </div>
      <!-- View Toggle -->
      <div class="btn-group btn-group-sm" role="group">
        <button @click="viewMode='list'" :class="['btn', viewMode==='list' ? 'btn-primary' : 'btn-outline-primary']">
          List View
        </button>
        <button @click="viewMode='daywise'" :class="['btn', viewMode==='daywise' ? 'btn-primary' : 'btn-outline-primary']">
          Day-wise
        </button>
      </div>
    </div>

    <!-- Filters: month + year -->
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

    <!-- LIST VIEW -->
    <div v-else-if="records.length && viewMode==='list'" class="card">
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

    <!-- DAY-WISE VIEW -->
    <div v-else-if="records.length && viewMode==='daywise'">
      <div v-for="day in groupedByDay" :key="day.date" class="card mb-3">
        <!-- Day header -->
        <div class="card-header d-flex justify-content-between align-items-center py-2"
             style="background:#f0f4ff;cursor:pointer"
             @click="toggleDay(day.date)">
          <span class="fw-semibold">{{ day.label }}</span>
          <div class="d-flex align-items-center gap-3">
            <span class="badge bg-secondary">{{ day.records.length }} patient{{ day.records.length !== 1 ? 's' : '' }}</span>
            <span class="badge bg-success fs-6">&#8377; {{ day.dayTotal.toLocaleString('en-IN') }}</span>
            <span class="text-muted small">{{ expandedDays[day.date] ? '▲' : '▼' }}</span>
          </div>
        </div>
        <!-- Day records (collapsible) -->
        <div v-if="expandedDays[day.date]" class="table-responsive">
          <table class="table table-sm mb-0">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Phone</th>
                <th>Pincode</th>
                <th>Charges (&#8377;)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in day.records" :key="r.casepaper_id">
                <td class="text-muted">{{ i + 1 }}</td>
                <td class="fw-semibold">{{ r.full_name }}</td>
                <td class="text-muted">{{ r.phone || '—' }}</td>
                <td class="text-muted">{{ r.pincode || '—' }}</td>
                <td><span class="badge bg-success">&#8377; {{ r.charges }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Grand total -->
      <div class="card">
        <div class="card-body d-flex justify-content-between align-items-center py-2">
          <span class="fw-bold">Grand Total</span>
          <span class="badge bg-primary fs-6">&#8377; {{ total.toLocaleString('en-IN') }}</span>
        </div>
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
      token:        localStorage.getItem("auth-token"),
      records:      [],
      total:        0,
      loading:      false,
      filterMonth:  new Date().getMonth() + 1,
      filterYear:   new Date().getFullYear(),
      viewMode:     "list",
      expandedDays: {},
      months:       ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"]
    };
  },

  computed: {
    groupedByDay() {
      const map = {};
      for (const r of this.records) {
        const dateKey = r.created_at ? r.created_at.slice(0, 10) : "Unknown";
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(r);
      }
      return Object.keys(map)
        .sort((a, b) => b.localeCompare(a))
        .map(date => ({
          date,
          label:    this.formatDate(date),
          records:  map[date],
          dayTotal: map[date].reduce((s, r) => s + (r.charges || 0), 0)
        }));
    }
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
          const data    = await res.json();
          this.records  = data.records || [];
          this.total    = data.total   || 0;
          this.expandedDays = {};
          // Auto-expand today if present in day-wise view
          const today = new Date().toISOString().slice(0, 10);
          if (this.records.some(r => r.created_at && r.created_at.startsWith(today))) {
            this.expandedDays[today] = true;
          }
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

    toggleDay(date) {
      this.expandedDays = { ...this.expandedDays, [date]: !this.expandedDays[date] };
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
