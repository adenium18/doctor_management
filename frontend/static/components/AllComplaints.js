export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">All Casepapers</h4>
        <p class="text-muted small mb-0">{{ filtered.length }} records across all doctors</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body py-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <input v-model="query" class="form-control form-control-sm"
              placeholder="Search patient, symptoms, diagnosis..." @input="fetch" />
          </div>
          <div class="col-md-2">
            <select v-model="filterMonth" class="form-select form-select-sm" @change="fetch">
              <option value="">All Months</option>
              <option v-for="(m,i) in months" :key="i+1" :value="i+1">{{ m }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <input v-model.number="filterYear" type="number" class="form-control form-control-sm"
              placeholder="Year" @input="fetch" />
          </div>
          <div class="col-auto">
            <button @click="clearFilters" class="btn btn-outline-secondary btn-sm">Reset</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else-if="filtered.length" class="card">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>#</th><th>Patient</th><th>Pincode</th>
              <th>Symptoms</th><th>Diagnosis</th><th>Charges</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filtered" :key="r.casepaper_id">
              <td class="text-muted">{{ i + 1 }}</td>
              <td class="fw-semibold">{{ r.full_name }}</td>
              <td class="text-muted">{{ r.pincode || '—' }}</td>
              <td style="max-width:160px">
                <div class="text-truncate" style="max-width:150px" :title="r.symptoms">{{ r.symptoms }}</div>
              </td>
              <td style="max-width:160px">
                <div class="text-truncate" style="max-width:150px" :title="r.diagnosis">{{ r.diagnosis }}</div>
              </td>
              <td><span class="badge bg-success">&#8377; {{ r.charges || 0 }}</span></td>
              <td class="text-muted small text-nowrap">{{ formatDate(r.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="!loading" class="card p-5 text-center">
      <div style="font-size:48px">&#128203;</div>
      <h5 class="mt-3 text-muted">No casepapers found</h5>
    </div>
  </div>
  `,

  data() {
    return {
      token:       localStorage.getItem("auth-token"),
      records:     [],
      loading:     true,
      query:       "",
      filterMonth: "",
      filterYear:  "",
      months:      ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"]
    };
  },

  computed: {
    filtered() {
      const q = this.query.trim().toLowerCase();
      return this.records.filter(r => {
        const matchQ = !q || [r.full_name, r.symptoms, r.diagnosis, r.prescription]
          .some(f => f?.toLowerCase().includes(q));
        const d = new Date(r.created_at);
        const matchM = !this.filterMonth || (d.getMonth() + 1) === parseInt(this.filterMonth);
        const matchY = !this.filterYear  || d.getFullYear() === parseInt(this.filterYear);
        return matchQ && matchM && matchY;
      });
    }
  },

  methods: {
    async fetch() {
      this.loading = true;
      try {
        const params = new URLSearchParams();
        if (this.query)       params.append("query", this.query);
        if (this.filterMonth) params.append("month", this.filterMonth);
        if (this.filterYear)  params.append("year",  this.filterYear);
        const res  = await fetch(`/api/casepapers/admin?${params}`, {
          headers: { "Authentication-Token": this.token }
        });
        this.records = res.ok ? await res.json() : [];
      } catch (err) {
        console.error("Error loading casepapers:", err);
      } finally {
        this.loading = false;
      }
    },
    clearFilters() {
      this.query = ""; this.filterMonth = ""; this.filterYear = "";
      this.fetch();
    },
    formatDate(dt) {
      if (!dt) return "N/A";
      return new Date(dt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
    }
  },

  mounted() { this.fetch(); }
};
