export default {
  template: `
  <div>

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Admin Dashboard</h4>
        <p class="text-muted small mb-0">Clinic-wide overview</p>
      </div>
      <button class="btn btn-success btn-sm" @click="$router.push('/doctor-signup')">+ Add New Doctor</button>
    </div>

    <!-- Top stat cards -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="stat-card">
          <div class="text-muted small">Total Doctors</div>
          <div class="h3 fw-bold text-primary mt-1">{{ doctors.length }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="stat-card" style="border-left-color:#16a34a">
          <div class="text-muted small">Active Doctors</div>
          <div class="h3 fw-bold text-success mt-1">{{ activeDoctors }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="stat-card" style="border-left-color:#d97706">
          <div class="text-muted small">Total Patients</div>
          <div class="h3 fw-bold text-warning mt-1">{{ totalPatients }}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="stat-card" style="border-left-color:#7c3aed">
          <div class="text-muted small">Total Revenue</div>
          <div class="h3 fw-bold mt-1" style="color:#7c3aed">₹{{ totalRevenue.toLocaleString() }}</div>
        </div>
      </div>
    </div>

    <!-- Search + sort bar -->
    <div class="d-flex flex-wrap gap-2 mb-3 align-items-center">
      <input
        v-model="search"
        class="form-control form-control-sm"
        placeholder="Search by name or degree..."
        style="max-width:240px"
      />
      <select v-model="sortBy" class="form-select form-select-sm" style="max-width:180px">
        <option value="full_name">Sort: Name</option>
        <option value="total_revenue">Sort: Revenue ↓</option>
        <option value="total_patients">Sort: Patients ↓</option>
        <option value="today_patients">Sort: Today's Patients ↓</option>
        <option value="avg_per_day">Sort: Avg/Day ↓</option>
      </select>
      <select v-model="filterStatus" class="form-select form-select-sm" style="max-width:140px">
        <option value="all">All Status</option>
        <option value="active">Active only</option>
        <option value="blocked">Blocked only</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div> Loading doctor stats…
    </div>

    <!-- No results -->
    <div v-else-if="!filteredDoctors.length" class="card p-5 text-center text-muted">
      No doctors match your filter.
    </div>

    <!-- Doctor cards -->
    <div v-else class="row g-3">
      <div class="col-12" v-for="d in filteredDoctors" :key="d.id">
        <div class="card" :style="{ borderLeft: '4px solid ' + (d.active ? '#16a34a' : '#ef4444') }">

          <!-- Card header -->
          <div class="card-body pb-2">
            <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">

              <!-- Identity -->
              <div>
                <div class="fw-bold fs-6">{{ d.full_name }}</div>
                <div class="text-muted small">{{ d.degree || 'No degree specified' }}</div>
              </div>

              <!-- Actions -->
              <div class="d-flex gap-2 align-items-center flex-wrap">
                <span :class="d.active ? 'badge bg-success' : 'badge bg-danger'">
                  {{ d.active ? 'Active' : 'Blocked' }}
                </span>
                <button
                  class="btn btn-sm"
                  :class="d.active ? 'btn-outline-danger' : 'btn-outline-success'"
                  @click="toggleDoctor(d)"
                >
                  {{ d.active ? 'Block' : 'Unblock' }}
                </button>
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="toggleExpand(d.id)"
                >
                  {{ expandedId === d.id ? 'Hide Analytics ▲' : 'Analytics ▼' }}
                </button>
              </div>
            </div>

            <!-- Info row -->
            <div class="row g-2 mt-2 mb-3">
              <div class="col-12 col-md-4">
                <div class="small">
                  <table class="table table-borderless table-sm mb-0" style="font-size:13px">
                    <tbody>
                      <tr>
                        <td class="text-muted pe-2" style="white-space:nowrap">Doctor ID</td>
                        <td class="fw-semibold">{{ d.id }}</td>
                      </tr>
                      <tr>
                        <td class="text-muted pe-2">User ID</td>
                        <td class="fw-semibold">{{ d.user_id }}</td>
                      </tr>
                      <tr>
                        <td class="text-muted pe-2">Email</td>
                        <td class="fw-semibold text-break">{{ d.email || '—' }}</td>
                      </tr>
                      <tr>
                        <td class="text-muted pe-2">Address</td>
                        <td class="fw-semibold">{{ d.address || '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Stats grid -->
              <div class="col-12 col-md-8">
                <div class="row g-2">
                  <div class="col-6 col-lg-4">
                    <div class="border rounded p-2 text-center h-100">
                      <div class="text-muted" style="font-size:11px">Today's Patients</div>
                      <div class="fw-bold fs-5 text-primary">{{ d.today_patients }}</div>
                      <div class="text-muted" style="font-size:11px">{{ d.today_casepapers }} visits</div>
                    </div>
                  </div>
                  <div class="col-6 col-lg-4">
                    <div class="border rounded p-2 text-center h-100">
                      <div class="text-muted" style="font-size:11px">This Month</div>
                      <div class="fw-bold fs-5 text-info">{{ d.monthly_patients }}</div>
                      <div class="text-muted" style="font-size:11px">patients</div>
                    </div>
                  </div>
                  <div class="col-6 col-lg-4">
                    <div class="border rounded p-2 text-center h-100">
                      <div class="text-muted" style="font-size:11px">Total Patients</div>
                      <div class="fw-bold fs-5 text-success">{{ d.total_patients }}</div>
                      <div class="text-muted" style="font-size:11px">{{ d.total_casepapers }} casepapers</div>
                    </div>
                  </div>
                  <div class="col-6 col-lg-4">
                    <div class="border rounded p-2 text-center h-100">
                      <div class="text-muted" style="font-size:11px">Avg / Day</div>
                      <div class="fw-bold fs-5 text-warning">{{ d.avg_per_day }}</div>
                      <div class="text-muted" style="font-size:11px">last 30 days</div>
                    </div>
                  </div>
                  <div class="col-6 col-lg-4">
                    <div class="border rounded p-2 text-center h-100">
                      <div class="text-muted" style="font-size:11px">Monthly Revenue</div>
                      <div class="fw-bold fs-5" style="color:#7c3aed">₹{{ d.monthly_revenue.toLocaleString() }}</div>
                      <div class="text-muted" style="font-size:11px">this month</div>
                    </div>
                  </div>
                  <div class="col-6 col-lg-4">
                    <div class="border rounded p-2 text-center h-100">
                      <div class="text-muted" style="font-size:11px">Total Revenue</div>
                      <div class="fw-bold fs-5 text-danger">₹{{ d.total_revenue.toLocaleString() }}</div>
                      <div class="text-muted" style="font-size:11px">all time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Inline analytics chart -->
            <div v-if="expandedId === d.id" class="border-top pt-3 mt-1">
              <div class="text-muted small mb-2 fw-semibold">Last 14 Days — Patients & Revenue</div>
              <canvas :id="'chart-' + d.id" style="max-height:200px"></canvas>
            </div>

          </div>
        </div>
      </div>
    </div>

  </div>
  `,

  data() {
    return {
      token:        localStorage.getItem("auth-token"),
      doctors:      [],
      loading:      true,
      search:       "",
      sortBy:       "full_name",
      filterStatus: "all",
      expandedId:   null,
      chartInstances: {},
    };
  },

  computed: {
    activeDoctors()  { return this.doctors.filter(d => d.active).length; },
    totalPatients()  { return this.doctors.reduce((s, d) => s + d.total_patients, 0); },
    totalRevenue()   { return this.doctors.reduce((s, d) => s + d.total_revenue, 0); },

    filteredDoctors() {
      const q = this.search.trim().toLowerCase();
      let list = this.doctors.filter(d => {
        if (this.filterStatus === "active"  && !d.active) return false;
        if (this.filterStatus === "blocked" &&  d.active) return false;
        if (q && !d.full_name.toLowerCase().includes(q) &&
                 !(d.degree || "").toLowerCase().includes(q)) return false;
        return true;
      });

      const key = this.sortBy;
      list.sort((a, b) => {
        if (key === "full_name") return a.full_name.localeCompare(b.full_name);
        return (b[key] || 0) - (a[key] || 0);
      });
      return list;
    }
  },

  methods: {
    async fetchDoctorStats() {
      this.loading = true;
      try {
        const res = await fetch("/api/admin/doctor-stats", {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.doctors = await res.json();
      } catch (e) {
        console.error("Failed to fetch doctor stats", e);
      } finally {
        this.loading = false;
      }
    },

    async toggleDoctor(doctor) {
      const action = doctor.active ? "block" : "unblock";
      if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} Dr. ${doctor.full_name}?`)) return;
      try {
        const res = await fetch(`/api/doctors/${doctor.id}/toggle`, {
          method:  "POST",
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) await this.fetchDoctorStats();
      } catch (e) {
        console.error(e);
      }
    },

    toggleExpand(id) {
      if (this.expandedId === id) {
        // collapse — destroy chart
        if (this.chartInstances[id]) {
          this.chartInstances[id].destroy();
          delete this.chartInstances[id];
        }
        this.expandedId = null;
      } else {
        // collapse previous
        if (this.expandedId && this.chartInstances[this.expandedId]) {
          this.chartInstances[this.expandedId].destroy();
          delete this.chartInstances[this.expandedId];
        }
        this.expandedId = id;
        this.$nextTick(() => this.renderChart(id));
      }
    },

    renderChart(id) {
      const doctor = this.doctors.find(d => d.id === id);
      if (!doctor) return;
      const canvas = document.getElementById("chart-" + id);
      if (!canvas) return;

      this.chartInstances[id] = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
          labels: doctor.chart.labels,
          datasets: [
            {
              label:           "Patients",
              data:            doctor.chart.patients,
              backgroundColor: "rgba(59,130,246,0.7)",
              yAxisID:         "yPatients",
              order:           2,
            },
            {
              label:           "Revenue (₹)",
              data:            doctor.chart.revenue,
              type:            "line",
              borderColor:     "#7c3aed",
              backgroundColor: "rgba(124,58,237,0.1)",
              tension:         0.3,
              fill:            true,
              yAxisID:         "yRevenue",
              order:           1,
            }
          ]
        },
        options: {
          responsive:          true,
          maintainAspectRatio: true,
          interaction:         { mode: "index", intersect: false },
          plugins: {
            legend: { position: "top" }
          },
          scales: {
            yPatients: {
              type:     "linear",
              position: "left",
              title:    { display: true, text: "Patients" },
              ticks:    { stepSize: 1 },
              min:      0,
            },
            yRevenue: {
              type:     "linear",
              position: "right",
              title:    { display: true, text: "Revenue (₹)" },
              grid:     { drawOnChartArea: false },
              min:      0,
            }
          }
        }
      });
    }
  },

  async mounted() {
    await this.fetchDoctorStats();
  },

  beforeDestroy() {
    Object.values(this.chartInstances).forEach(c => c.destroy());
  }
};
