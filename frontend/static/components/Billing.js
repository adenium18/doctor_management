export default {
  template: `
  <div class="container p-4">
    <h2 class="fw-bold mb-1">Billing</h2>
    <p class="text-muted mb-4">Track consultation charges per patient</p>
    <hr class="custom-hr">

    <!-- Filters -->
    <div class="row g-2 mb-4">
      <div class="col-md-3">
        <select v-model="filterMonth" class="form-select">
          <option value="">All Months</option>
          <option v-for="(m, i) in months" :key="i+1" :value="i+1">{{ m }}</option>
        </select>
      </div>
      <div class="col-md-3">
        <input v-model.number="filterYear" type="number" class="form-control" placeholder="Year e.g. 2025" />
      </div>
      <div class="col-md-2">
        <button @click="fetchBilling" class="btn btn-primary w-100">Apply</button>
      </div>
      <div class="col-md-2">
        <button @click="clearFilters" class="btn btn-secondary w-100">Reset</button>
      </div>
    </div>

    <!-- Summary Card -->
    <div class="alert alert-success d-flex justify-content-between align-items-center mb-4" v-if="records.length">
      <span>
        <strong>{{ records.length }}</strong> consultations
        <span v-if="filterMonth"> in {{ months[filterMonth-1] }}</span>
        <span v-if="filterYear"> {{ filterYear }}</span>
      </span>
      <strong class="fs-5">Total: ₹ {{ total }}</strong>
    </div>

    <!-- Table -->
    <div class="table-responsive" v-if="records.length">
      <table class="table table-bordered table-hover">
        <thead class="table-dark">
          <tr>
            <th>#</th>
            <th>Patient Name</th>
            <th>Phone</th>
            <th>Pincode</th>
            <th>Date</th>
            <th>Charges (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in records" :key="r.casepaper_id">
            <td>{{ i + 1 }}</td>
            <td>{{ r.full_name }}</td>
            <td>{{ r.phone || 'N/A' }}</td>
            <td>{{ r.pincode || 'N/A' }}</td>
            <td>{{ formatDate(r.created_at) }}</td>
            <td><span class="badge bg-success fs-6">₹ {{ r.charges }}</span></td>
          </tr>
        </tbody>
        <tfoot class="table-light">
          <tr>
            <td colspan="5" class="text-end fw-bold">Total</td>
            <td><span class="badge bg-primary fs-6">₹ {{ total }}</span></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div v-else class="text-center text-muted mt-4">
      No billing records found for the selected period.
    </div>
  </div>
  `,

  data() {
    return {
      token:       localStorage.getItem("auth-token"),
      userId:      localStorage.getItem("user_id"),
      records:     [],
      total:       0,
      filterMonth: new Date().getMonth() + 1,
      filterYear:  new Date().getFullYear(),
      months: ["January","February","March","April","May","June",
               "July","August","September","October","November","December"]
    };
  },

  methods: {
    async fetchBilling() {
      try {
        const params = new URLSearchParams({ doctor_id: this.userId });
        if (this.filterMonth) params.append("month", this.filterMonth);
        if (this.filterYear)  params.append("year",  this.filterYear);

        const res = await fetch(`/api/billing?${params}`, {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) {
          const data  = await res.json();
          this.records = data.records;
          this.total   = data.total;
        }
      } catch (err) { console.error("Billing fetch error:", err); }
    },

    clearFilters() {
      this.filterMonth = '';
      this.filterYear  = '';
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