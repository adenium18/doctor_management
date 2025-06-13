export default {
    template: `
    <div>
        <div class="p-2" v-if="role == 'doctor'">
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
                            <td>{{ patient.full_name }}</td>
                            <td>{{ patient.age }} Yrs</td>
                            <td>{{ patient.pincode }}</td>
                            <td>{{ patient.address }}</td>
                            <td>{{ patient.sex }}</td>
                            <td>{{ patient.dob }}</td>
                            <td>{{ patient.weight }}</td>
                            <td>{{ patient.phone }}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" @click="update(patient.id)">Edit</button>
                                <button class="btn btn-sm btn-danger" @click="del(patient.id)">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="text-center text-muted mt-3">
                No patient information recorded.
            </div>
        </div>

        <!-- Modal for Extra Requirements -->
        <div class="modal fade" id="extraRequirementsModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalLabel">Extra Requirements</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <input type="text" class="form-control" v-model="extraRequirements" placeholder="Any specific needs or requests?">
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
    props: ['patient'],
    data() {
        return {
            token: localStorage.getItem('auth-token'),
            role: localStorage.getItem('role'),
            patients: [],
            extraRequirements: '',
            patient_request: {
                patient_id: null,
                doctor_id: null,
                user_req: ''
            }
        }
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
            console.log("Status:", res.status);
            const data = await res.json();
            console.log("Fetched patients:", data);
            if (res.ok) {
                this.patients = data;
            } else {
                this.patients = [];
            }
            } catch (err) {
                console.error("Error fetching patients:", err);
                this.patients = [];
            }
        },

        async del(id) {
            const res = await fetch(`delete/patient/${id}`, {
                headers: { 'Authentication-Token': this.token }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                await this.fetchpatients();
            }
        },
        async update(id) {
            localStorage.setItem('update_patient_id', id);
            this.$router.push({ path: `/update-patient` });
        },
        async submitPatientRequest() {
            const patient_id = this.patient_request.patient_id || localStorage.getItem('currentpatientId');
            if (!patient_id) {
                alert('Patient ID is missing or incorrect.');
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
                    const errorData = await response.text();
                    alert(`Failed to request patient: ${errorData}`);
                }
            } catch (error) {
                alert('Failed to request patient');
                console.error("Error:", error);
            }
        }
    },
    async mounted() {
        await this.fetchpatients();
    }
}
