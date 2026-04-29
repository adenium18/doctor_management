export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0">Admin Dashboard</h4>
      <button class="btn btn-success btn-sm" @click="$router.push('/doctor-signup')">+ Add New Doctor</button>
    </div>

    <!-- Stats -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="text-muted small">Total Doctors</div>
          <div class="h3 fw-bold text-primary mt-1">{{ doctors.length }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card" style="border-left-color:#16a34a">
          <div class="text-muted small">Total Patients</div>
          <div class="h3 fw-bold text-success mt-1">{{ patients.length }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card" style="border-left-color:#d97706">
          <div class="text-muted small">Total Casepapers</div>
          <div class="h3 fw-bold text-warning mt-1">{{ casepapers.length }}</div>
        </div>
      </div>
    </div>

    <!-- Doctors Table -->
    <div class="card mb-4">
      <div class="card-body">
        <h6 class="fw-semibold mb-3">Registered Doctors</h6>
        <div class="table-responsive" v-if="doctors.length">
          <table class="table mb-0">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Degree</th><th>Address</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr v-for="d in doctors" :key="d.id">
                <td class="text-muted">{{ d.id }}</td>
                <td class="fw-semibold">{{ d.full_name }}</td>
                <td>{{ d.degree }}</td>
                <td class="text-muted">{{ d.address || '—' }}</td>
                <td>
                  <span :class="d.active ? 'badge bg-success' : 'badge bg-danger'">
                    {{ d.active ? 'Active' : 'Blocked' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm"
                    :class="d.active ? 'btn-outline-danger' : 'btn-outline-success'"
                    @click="toggleDoctor(d)">
                    {{ d.active ? 'Block' : 'Unblock' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted text-center py-3">No doctors registered yet.</div>
      </div>
    </div>

    <!-- Patients Table -->
    <div class="card">
      <div class="card-body">
        <h6 class="fw-semibold mb-3">All Patients</h6>
        <div class="table-responsive" v-if="patients.length">
          <table class="table mb-0">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Age</th><th>Sex</th><th>Phone</th><th>Pincode</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in patients" :key="p.id">
                <td class="text-muted">{{ p.id }}</td>
                <td class="fw-semibold">{{ p.full_name }}</td>
                <td>{{ p.age || '—' }}</td>
                <td>{{ p.sex || '—' }}</td>
                <td>{{ p.phone || '—' }}</td>
                <td>{{ p.pincode || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted text-center py-3">No patients yet.</div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      token:      localStorage.getItem("auth-token"),
      doctors:    [],
      patients:   [],
      casepapers: []
    };
  },

  methods: {
    async fetchDoctors() {
      try {
        const res = await fetch("/api/doctors", {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.doctors = await res.json();
      } catch (err) { console.error("Doctors error:", err); }
    },

    async fetchPatients() {
      try {
        const res = await fetch("/api/patients/admin", {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.patients = await res.json();
      } catch (err) { console.error("Patients error:", err); }
    },

    async fetchCasepapers() {
      try {
        const res = await fetch("/api/casepapers/admin", {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.casepapers = await res.json();
      } catch (err) { console.error("Casepapers error:", err); }
    },

    async toggleDoctor(doctor) {
      const action = doctor.active ? "block" : "unblock";
      const label  = action.charAt(0).toUpperCase() + action.slice(1);
      if (!window.confirm(`${label} Dr. ${doctor.full_name}?`)) return;
      try {
        const res = await fetch(`/api/doctors/${doctor.id}/toggle`, {
          method:  "POST",
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) {
          this.$toast(`Dr. ${doctor.full_name} ${action}ed.`, doctor.active ? "warning" : "success");
          this.fetchDoctors();
        } else {
          this.$toast(`Failed to ${action} doctor.`, "danger");
        }
      } catch (err) {
        console.error(err);
        this.$toast("Network error. Please try again.", "danger");
      }
    }
  },

  async mounted() {
    await Promise.all([this.fetchDoctors(), this.fetchPatients(), this.fetchCasepapers()]);
  }
};
