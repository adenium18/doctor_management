export default {
    template: `
    <div>
        <div class="p-2" v-if="role === 'doctor'">
            <div v-if="patients.length > 0">
                <table class="table table-bordered table-striped">
                    <thead class="thead-dark">
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
                            <td><a href="#" @click.prevent="viewPatientHistory(patient.id)">{{ patient.full_name }}</a></td>
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
        </div>

        <!-- Edit Patient Modal -->
        <div class="modal fade" id="updatePatientModal" tabindex="-1" role="dialog" aria-labelledby="editLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <form class="modal-content" @submit.prevent="submitUpdate">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editLabel">Edit Patient</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <input v-model="editPatient.full_name" class="form-control mb-2" placeholder="Full Name" required />
                        <input v-model="editPatient.address" class="form-control mb-2" placeholder="Address" />
                        <input v-model="editPatient.pincode" class="form-control mb-2" placeholder="Pincode" />
                        <input v-model="editPatient.dob" type="date" class="form-control mb-2" placeholder="DOB" required @change="calculateAge" />
                        <input :value="editPatient.age" type="number" class="form-control mb-2" placeholder="Age" readonly />
                        <input v-model="editPatient.weight" type="number" class="form-control mb-2" placeholder="Weight" />
                        <input v-model="editPatient.sex" class="form-control mb-2" placeholder="Sex" />
                        <input v-model="editPatient.phone" class="form-control mb-2" placeholder="Phone" />
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Extra Requirements Modal -->
        <div class="modal fade" id="extraRequirementsModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Extra Requirements</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <input type="text" class="form-control" v-model="extraRequirements" placeholder="Any specific needs or requests?" />
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" @click="submitPatientRequest">Submit Request</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            token: localStorage.getItem('auth-token'),
            role: localStorage.getItem('role'),
            patients: [],
            extraRequirements: '',
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
            },
            patient_request: {
                patient_id: null,
                doctor_id: null,
                user_req: ''
            }
        };
    },
    methods: {
        async fetchpatients() {
            try {
                const res = await fetch('/api/patients', {
                    headers: {
                        "Content-Type": "application/json",
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
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                this.editPatient.age = age;
            }
        },
        
        viewPatientHistory(patientId) {
            localStorage.setItem("selected_patient_id", patientId);
            this.$router.push({ path: `/patient_history` });
        },   

        async submitUpdate() {
            try {
                const res = await fetch(`/api/update-patient/${this.editPatient.id}`, {
                    method: "POST",
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
        },
        async submitPatientRequest() {
            const patient_id = this.patient_request.patient_id || localStorage.getItem('currentpatientId');
            if (!patient_id) {
                alert('Patient ID is missing.');
                return;
            }
            const requestData = {
                patient_id,
                doctor_id: localStorage.getItem("user_id"),
                user_req: this.extraRequirements
            };
            try {
                const response = await fetch(`/api/request/patients`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        'Authentication-Token': this.token
                    },
                    body: JSON.stringify(requestData)
                });
                if (response.ok) {
                    alert('Patient requested successfully');
                    $('#extraRequirementsModal').modal('hide');
                } else {
                    const errorText = await response.text();
                    alert(`Request failed: ${errorText}`);
                }
            } catch (error) {
                alert('Error while sending request');
                console.error("Error:", error);
            }
        }
    },
    async mounted() {
        await this.fetchpatients();
    }
};
