export default {
    template: `
    <div class="container p-3">
        <h4 class="fw-bold mb-3">Patient Casepaper History</h4>
        <hr class="custom-hr">

        <!-- ✅ Show patient name at top if available -->
        <p v-if="patientId" class="text-muted">Showing records for patient ID: {{ patientId }}</p>

        <div v-if="casepapers.length > 0">
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Date</th>
                        <th>Symptoms</th>
                        <th>Diagnosis</th>
                        <th>Prescription</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="c in casepapers" :key="c.id">
                        <td>{{ formatDate(c.created_at) }}</td>   <!-- ✅ Bug 1 fix — format date properly -->
                        <td>{{ c.symptoms }}</td>
                        <td>{{ c.diagnosis }}</td>
                        <td>{{ c.prescription }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="text-muted mt-3">No casepapers found for this patient.</div>

        <!-- ✅ Bug 2 fix — back button to return to patients list -->
        <button class="btn btn-secondary mt-3" @click="$router.push('/patients')">
            ← Back to Patients
        </button>
    </div>
    `,

    data() {
        return {
            token: localStorage.getItem('auth-token'),
            casepapers: [],
            patientId: null
        };
    },

    methods: {
        async fetchCasepapersForPatient() {
            // ✅ Bug 3 fix — also check route query param as fallback
            this.patientId = localStorage.getItem("selected_patient_id")
                          || this.$route.query.patient_id;

            if (!this.patientId) {
                console.warn("No patient ID found.");
                return;
            }

            try {
                const res = await fetch(`/api/casepapers/patient/${this.patientId}`, {
                    headers: { 'Authentication-Token': this.token }
                });
                const data = await res.json();
                this.casepapers = res.ok ? (data.casepapers || []) : [];
            } catch (error) {
                console.error("Error fetching casepapers:", error);
                this.casepapers = [];
            }
        },

        formatDate(dateTime) {
            if (!dateTime) return 'N/A';
            return new Date(dateTime).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        }
    },

    mounted() {
        this.fetchCasepapersForPatient();
    }
};