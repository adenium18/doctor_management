export default {
    template: `
    <div>
        <div class="p-2" v-if="role === 'doctor'">
            <div v-if="casepapers.length > 0">
                <table class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th>Patient Name</th>
                            <th>Age</th>
                            <th>Address</th>
                            <th>Sex</th>
                            <th>Weight</th>
                            <th>Phone</th>
                            <th>Date of Arrival</th>
                            <th>Symptoms</th>
                            <th>Diagnosis</th>
                            <th>Prescription</th>
                            <th>Actions</th>
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
                            <td>{{ casepaper.symptoms }}</td>
                            <td>{{ casepaper.diagnosis }}</td>
                            <td>{{ casepaper.prescription }}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" @click="openEditModal(casepaper)">Edit</button>
                                <button class="btn btn-sm btn-danger" @click="openDeleteModal(casepaper.id)">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="text-center text-muted mt-3">
                No casepaper information recorded.
            </div>
        </div>

        <!-- Edit Modal -->
        <div class="modal fade" id="editCasepaperModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Casepaper</h5>
                        <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="submitCasepaperEdit">
                            <div class="form-group">
                                <label>Symptoms</label>
                                <input v-model="editCasepaper.symptoms" class="form-control" required />
                            </div>
                            <div class="form-group">
                                <label>Diagnosis</label>
                                <input v-model="editCasepaper.diagnosis" class="form-control" required />
                            </div>
                            <div class="form-group">
                                <label>Prescription</label>
                                <textarea v-model="editCasepaper.prescription" class="form-control" rows="3"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Update</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Modal -->
        <div class="modal fade" id="deleteCasepaperModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-sm" role="document">
                <div class="modal-content">
                    <div class="modal-body text-center">
                        <p>Are you sure you want to delete this casepaper?</p>
                        <button class="btn btn-danger" @click="deleteCasepaper">Yes, Delete</button>
                        <button class="btn btn-secondary" data-dismiss="modal">Cancel</button>
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
            casepapers: [],
            editCasepaper: {
                id: null,
                symptoms: '',
                diagnosis: '',
                prescription: ''
            },
            casepaperToDeleteId: null,
        };
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
                const data = await res.json();
                if (res.ok) {
                    this.casepapers = data.casepaper;
                }
            } catch (err) {
                console.error("Error fetching casepapers:", err);
            }
        },
        openEditModal(casepaper) {
            this.editCasepaper = {
                id: casepaper.id,
                symptoms: casepaper.symptoms,
                diagnosis: casepaper.diagnosis,
                prescription: casepaper.prescription
            };
            $('#editCasepaperModal').modal('show');
        },
        async submitCasepaperEdit() {
            try {
                const res = await fetch(`/api/casepaper/${this.editCasepaper.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': this.token
                    },
                    body: JSON.stringify({
                        symptoms: this.editCasepaper.symptoms,
                        diagnosis: this.editCasepaper.diagnosis,
                        prescription: this.editCasepaper.prescription
                    })
                });
                if (res.ok) {
                    alert("Casepaper updated successfully.");
                    $('#editCasepaperModal').modal('hide');
                    await this.fetchcasepapers();
                } else {
                    alert("Failed to update casepaper.");
                }
            } catch (error) {
                console.error("Edit error:", error);
            }
        },
        openDeleteModal(id) {
            this.casepaperToDeleteId = id;
            $('#deleteCasepaperModal').modal('show');
        },
        async deleteCasepaper() {
            try {
                const res = await fetch(`/delete/casepaper/${this.casepaperToDeleteId}`, {
                    method: "DELETE",
                    headers: {
                        'Authentication-Token': this.token
                    }
                });
                if (res.ok) {
                    alert("Casepaper deleted successfully.");
                    $('#deleteCasepaperModal').modal('hide');
                    await this.fetchcasepapers();
                } else {
                    alert("Failed to delete casepaper.");
                }
            } catch (error) {
                console.error("Delete error:", error);
            }
        }
    },
    async mounted() {
        await this.fetchcasepapers();
    }
}
