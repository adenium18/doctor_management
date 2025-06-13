export default {
    template: `
    <div>
        <div class="p-2" v-if="role == 'doctor'">
            <div v-if="casepapers.length > 0">
                <table class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th>Patient name</th>
                            <th>Age</th>
                            <th>Address</th>
                            <th>Sex</th>
                            <th>Weight</th>
                            <th>Phone</th>
                            <th>Date of Arrival</th>
                            <th>Symptoms</th>
                            <th>Diagnosis</th>
                            <th>Prescription</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="casepaper in casepapers" :key="casepaper.id">
                            <td>{{ casepaper.patient_name }}</td>
                            <td>{{ casepaper.age }} Yrs</td>
                            <td>{{ casepaper.address }}</td>
                            <td>{{ casepaper.sex }}</td>
                            <td>{{ casepaper.weight }}</td>
                            <td>{{ casepaper.phone }}</td>
                            <td>{{ casepaper.created_at }}</td>
                            <td>{{ casepaper.symptoms}}</td>
                            <td>{{ casepaper.diagnosis}}</td>
                            <td>{{ casepaper.prescription}}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" @click="update(casepaper.id)">Edit</button>
                                <button class="btn btn-sm btn-danger" @click="del(casepaper.id)">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="text-center text-muted mt-3">
                No casepaper information recorded.
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
                        <button type="button" class="btn btn-primary" @click="submitcasepaperRequest">Submit Request</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    props: ['casepaper'],
    data() {
        return {
            token: localStorage.getItem('auth-token'),
            role: localStorage.getItem('role'),
            casepapers: [],
            extraRequirements: '',
            casepaper_request: {
                patient_id: null,
                doctor_id: null,
                user_req: ''
            }
        }
    },
    methods: {
        async fetchcasepapers() {
        try {
            const res = await fetch('/api/casepaper', {
                headers: {
                "Content-Type": "application/json",
                'Authentication-Token': this.token
                }
            });
            console.log("Status:", res.status);
            const data = await res.json();
            console.log("Fetched casepapers:", data);
            if (res.ok) {
                this.casepapers = data.casepaper;
            } else {
                this.casepapers = [];
            }
            } catch (err) {
                console.error("Error fetching casepapers:", err);
                this.casepapers = [];
            }
        },

        async del(id) {
            const res = await fetch(`delete/casepaper/${id}`, {
                headers: { 'Authentication-Token': this.token }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                await this.fetchcasepapers();
            }
        },
        async update(id) {
            localStorage.setItem('update_casepaper_id', id);
            this.$router.push({ path: `/update-casepaper` });
        },
        async submitcasepaperRequest() {
            const casepaper_id = this.casepaper_request.casepaper_id || localStorage.getItem('currentcasepaperId');
            if (!casepaper_id) {
                alert('casepaper ID is missing or incorrect.');
                return;
            }

            const requestData = {
                casepaper_id,
                doctor_id: localStorage.getItem("user_id"),
                user_req: this.extraRequirements
            };

            
        }
    },
    async mounted() {
        await this.fetchcasepapers();
    }
}
