export default {
    template: `
    <div class="container">
        <h2 class="text-center fw-bold mb-4">Admin Dashboard</h2>
        <hr class="custom-hr">

        <!-- Stats Row -->
        <div class="row text-center mb-4">
            <div class="col-md-4">
                <div class="card p-3">
                    <h5>Total Doctors</h5>
                    <h2 class="text-primary">{{ doctors.length }}</h2>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card p-3">
                    <h5>Total Patients</h5>
                    <h2 class="text-success">{{ patients.length }}</h2>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card p-3">
                    <h5>Total Casepapers</h5>
                    <h2 class="text-warning">{{ casepapers.length }}</h2>
                </div>
            </div>
        </div>

        <!-- Add Doctor Button -->
        <div class="text-center mb-3">
            <button class="btn btn-outline-success" @click="$router.push('/doctor-signup')">
                + Add New Doctor
            </button>
        </div>

        <!-- Doctors Table -->
        <h4 class="mt-4">Registered Doctors</h4>
        <div class="table-responsive" v-if="doctors.length">
            <table class="table table-striped table-hover text-center">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Degree</th>
                        <th>Address</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="doctor in doctors" :key="doctor.id">
                        <td>{{ doctor.id }}</td>
                        <td>{{ doctor.full_name }}</td>
                        <td>{{ doctor.degree }}</td>
                        <td>{{ doctor.address }}</td>
                        <td>
                            <span :class="doctor.active ? 'badge bg-success' : 'badge bg-danger'">
                                {{ doctor.active ? 'Active' : 'Blocked' }}
                            </span>
                        </td>
                        <td>
                            <button
                                class="btn btn-sm"
                                :class="doctor.active ? 'btn-danger' : 'btn-success'"
                                @click="toggleDoctor(doctor)">
                                {{ doctor.active ? 'Block' : 'Unblock' }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else class="text-center text-danger">No doctors registered yet.</div>

        <!-- Patients Table -->
        <h4 class="mt-5">Registered Patients</h4>
        <div class="table-responsive" v-if="patients.length">
            <table class="table table-striped table-hover text-center">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Sex</th>
                        <th>Phone</th>
                        <th>Pincode</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="patient in patients" :key="patient.id">
                        <td>{{ patient.id }}</td>
                        <td>{{ patient.full_name }}</td>
                        <td>{{ patient.age }}</td>
                        <td>{{ patient.sex }}</td>
                        <td>{{ patient.phone }}</td>
                        <td>{{ patient.pincode }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else class="text-center text-danger">No patients registered yet.</div>

    </div>
    `,

    data() {
        return {
            doctors: [],
            patients: [],
            casepapers: [],
            token: localStorage.getItem("auth-token")
        };
    },

    methods: {
        async fetchDoctors() {
            try {
                const res = await fetch("/api/doctors", {
                    headers: { "Authentication-Token": this.token }
                });
                if (res.ok) {
                    this.doctors = await res.json();
                } else {
                    console.error("Failed to fetch doctors");
                }
            } catch (err) {
                console.error("Error fetching doctors:", err);
            }
        },

        async fetchPatients() {
            try {
                const res = await fetch("/api/patients", {
                    headers: { "Authentication-Token": this.token }
                });
                if (res.ok) {
                    this.patients = await res.json();
                } else {
                    console.error("Failed to fetch patients");
                }
            } catch (err) {
                console.error("Error fetching patients:", err);
            }
        },

        async fetchCasepapers() {
            try {
                const res = await fetch("/api/casepapers", {
                    headers: { "Authentication-Token": this.token }
                });
                if (res.ok) {
                    this.casepapers = await res.json();
                } else {
                    console.error("Failed to fetch casepapers");
                }
            } catch (err) {
                console.error("Error fetching casepapers:", err);
            }
        },

        // ✅ Block or unblock a doctor
        async toggleDoctor(doctor) {
            const action = doctor.active ? "block" : "unblock";
            if (!confirm(`Are you sure you want to ${action} Dr. ${doctor.full_name}?`)) return;

            try {
                const res = await fetch(`/api/doctors/${doctor.id}/toggle`, {
                    method: "POST",
                    headers: {
                        "Authentication-Token": this.token,
                        "Content-Type": "application/json"
                    }
                });
                if (res.ok) {
                    alert(`Doctor ${action}ed successfully!`);
                    this.fetchDoctors();
                } else {
                    alert(`Failed to ${action} doctor.`);
                }
            } catch (err) {
                console.error(`Error during ${action}:`, err);
            }
        }
    },

    async mounted() {
        await Promise.all([
            this.fetchDoctors(),
            this.fetchPatients(),
            this.fetchCasepapers()
        ]);
    }
};