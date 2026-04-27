export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Patient History</h4>
        <p class="text-muted small mb-0" v-if="patientName">{{ patientName }}</p>
      </div>
      <button class="btn btn-outline-secondary btn-sm" @click="$router.push('/patients')">
        &larr; Back to Patients
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted small">Loading history...</p>
    </div>

    <div v-else-if="casepapers.length" class="card">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Symptoms</th>
              <th>Diagnosis</th>
              <th>Prescription</th>
              <th>Charges</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, i) in casepapers" :key="c.id">
              <td class="text-muted">{{ i + 1 }}</td>
              <td class="text-nowrap">{{ formatDate(c.created_at) }}</td>
              <td>{{ c.symptoms }}</td>
              <td>{{ c.diagnosis }}</td>
              <td>{{ c.prescription }}</td>
              <td><span class="badge bg-success">&#8377; {{ c.charges || 150 }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="card p-5 text-center">
      <div style="font-size:48px">&#128203;</div>
      <h5 class="mt-3 text-muted">No casepapers found</h5>
      <p class="text-muted small">No visit records found for this patient.</p>
    </div>
  </div>
  `,

  data() {
    return {
      token:       localStorage.getItem("auth-token"),
      casepapers:  [],
      patientName: "",
      patientId:   null,
      loading:     true
    };
  },

  methods: {
    async fetchCasepapersForPatient() {
      this.patientId = localStorage.getItem("selected_patient_id")
                    || this.$route.query.patient_id;

      if (!this.patientId) {
        this.loading = false;
        return;
      }

      try {
        const res  = await fetch(`/api/casepapers/patient/${this.patientId}`, {
          headers: { "Authentication-Token": this.token }
        });
        const data = await res.json();
        if (res.ok) {
          this.casepapers  = data.casepapers || [];
          this.patientName = data.patient_name || "";
        }
      } catch (err) {
        console.error("Error fetching casepapers:", err);
      } finally {
        this.loading = false;
      }
    },

    formatDate(dt) {
      if (!dt) return "N/A";
      return new Date(dt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
    }
  },

  mounted() {
    this.fetchCasepapersForPatient();
  }
};
