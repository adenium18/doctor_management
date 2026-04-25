export default {
    template: `
    <div class="container p-3">
        <h2 class="text-center fw-bold mb-4">All Patients</h2>
        <hr class="custom-hr">

        <div v-if="patients.length > 0">
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Pincode</th>
                        <th>Address</th>
                        <th>Sex</th>
                        <th>DOB</th>
                        <th>Weight</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="patient in patients" :key="patient.id">
                        <td>
                            <a href="#" @click.prevent="viewPatientHistory(patient.id)">
                                {{ patient.full_name }}
                            </a>
                        </td>
                        <td>{{ patient.age }} Yrs</td>
                        <td>{{ patient.pincode }}</td>
                        <td>{{ patient.address }}</td>
                        <td>{{ patient.sex }}</td>
                        <td>{{ patient.dob }}</td>
                        <td>{{ patient.weight }}</td>
                        <td>{{ patient.phone }}</td>
                        <td>
                            <button class="btn btn-sm btn-secondary" @click="openEditModal(patient.id)">Edit</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else class="text-center text-muted mt-3">
            No patient information recorded.
        </div>

        <!-- Edit Patient Modal -->
        <div class="modal fade" id="updatePatientModal" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <form class="modal-content" @submit.prevent="submitUpdate">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Patient</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <input v-model="editPatient.full_name" class="form-control mb-2" placeholder="Full Name" required />
                        <input v-model="editPatient.address" class="form-control mb-2" placeholder="Address" />
                        <input v-model="editPatient.pincode" class="form-control mb-2" placeholder="Pincode" />
                        <input v-model="editPatient.dob" type="date" class="form-control mb-2" @change="calculateAge" />
                        <input :value="editPatient.age" type="number" class="form-control mb-2" placeholder="Age" readonly />
                        <input v-model="editPatient.weight" type="number" class="form-control mb-2" placeholder="Weight (kg)" />
                        <select v-model="editPatient.sex" class="form-select mb-2">
                            <option disabled value="">Select Gender</option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                        <input v-model="editPatient.phone" class="form-control mb-2" placeholder="Phone" />
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            token: localStorage.getItem('auth-token'),
            role: localStorage.getItem('role'),
            patients: [],
            editPatient: {
                id: null,
                full_name: '',
                address: '',
                pincode: '',
                dob: '',
                age: 0,
                weight: '',
                sex: '',
                phone: ''
            }
        };
    },

    methods: {
        async fetchpatients() {
            try {
                const res = await fetch('/api/patients', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': this.token
                    }
                });
                const data = await res.json();
                this.patients = res.ok ? data : [];
            } catch (err) {
                console.error("Error fetching patients:", err);
                this.patients = [];
            }
        },

        async openEditModal(id) {
            try {
                const res = await fetch(`/api/update-patient/${id}`, {
                    headers: { 'Authentication-Token': this.token }
                });
                const data = await res.json();
                if (res.ok) {
                    this.editPatient = { ...data };
                    this.calculateAge();
                    $('#updatePatientModal').modal('show');
                }
            } catch (err) {
                alert("Error fetching patient data.");
                console.error(err);
            }
        },

        calculateAge() {
            if (this.editPatient.dob) {
                const dob = new Date(this.editPatient.dob);
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                this.editPatient.age = age;
            }
        },

        viewPatientHistory(patientId) {
            localStorage.setItem("selected_patient_id", patientId);
            this.$router.push('/patient_history');
        },

        async submitUpdate() {
            try {
                const res = await fetch(`/api/update-patient/${this.editPatient.id}`, {
                    method: "PUT",   // ✅ matches corrected views.py route
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": this.token
                    },
                    body: JSON.stringify(this.editPatient)
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    $('#updatePatientModal').modal('hide');
                    await this.fetchpatients();
                } else {
                    alert("Failed to update patient.");
                }
            } catch (err) {
                alert("Error updating patient.");
                console.error(err);
            }
        }
    },

    async mounted() {
        await this.fetchpatients();
    }
};