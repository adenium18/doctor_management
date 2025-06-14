export default {
  template: `
    <div class="p-3">
      <h4>Patient Casepaper History</h4>
      <div v-if="casepapers.length > 0">
        <table class="table table-bordered table-striped">
          <thead class="thead-dark">
            <tr>
              <th>Date</th>
              <th>Symptoms</th>
              <th>Diagnosis</th>
              <th>Prescription</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in casepapers" :key="c.id">
              <td>{{ c.created_at }}</td>
              <td>{{ c.symptoms }}</td>
              <td>{{ c.diagnosis }}</td>
              <td>{{ c.prescription }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-muted mt-3">No casepapers found for this patient.</div>
    </div>
  `,
  data() {
    return {
      token: localStorage.getItem('auth-token'),
      casepapers: []
    };
  },
  methods: {
    async fetchCasepapersForPatient() {
      const patientId = localStorage.getItem("selected_patient_id");
      try {
        const res = await fetch(`/api/casepapers/patient/${patientId}`, {
          headers: {
            'Authentication-Token': this.token
          }
        });
        const data = await res.json();
        if (res.ok) {
          this.casepapers = data.casepapers;
        } else {
          this.casepapers = [];
        }
      } catch (error) {
        console.error("Error fetching casepapers:", error);
        this.casepapers = [];
      }
    }
  },
  mounted() {
    this.fetchCasepapersForPatient();
  }
};
