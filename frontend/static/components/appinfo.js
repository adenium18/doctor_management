export default {
    template: `
    <div class="container">
        <h2 class="text-center fw-bold mb-4">All Casepapers</h2>
        <hr class="custom-hr">

        <!-- Search & Filter Bar -->
        <div class="row mb-4">
            <div class="col-md-4">
                <input
                    v-model="searchQuery"
                    type="text"
                    class="form-control"
                    placeholder="Search by name, symptoms, diagnosis..."
                    @input="fetchCasepapers"
                />
            </div>
            <div class="col-md-2">
                <input v-model="filterYear" type="number" class="form-control" placeholder="Year" @change="fetchCasepapers" />
            </div>
            <div class="col-md-2">
                <input v-model="filterMonth" type="number" class="form-control" placeholder="Month (1-12)" min="1" max="12" @change="fetchCasepapers" />
            </div>
            <div class="col-md-2">
                <input v-model="filterDay" type="number" class="form-control" placeholder="Day (1-31)" min="1" max="31" @change="fetchCasepapers" />
            </div>
            <div class="col-md-2">
                <button class="btn btn-secondary w-100" @click="clearFilters">Clear</button>
            </div>
        </div>

        <!-- Casepapers Table -->
        <div class="table-responsive" v-if="casepapers.length">
            <table class="table table-striped table-hover text-center">
                <thead class="table-dark">
                    <tr>
                        <th>#</th>
                        <th>Patient Name</th>
                        <th>Pincode</th>
                        <th>Symptoms</th>
                        <th>Diagnosis</th>
                        <th>Prescription</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(cp, index) in casepapers" :key="cp.casepaper_id">
                        <td>{{ index + 1 }}</td>
                        <td>{{ cp.full_name }}</td>
                        <td>{{ cp.pincode || 'N/A' }}</td>
                        <td>{{ cp.symptoms }}</td>
                        <td>{{ cp.diagnosis }}</td>
                        <td>{{ cp.prescription }}</td>
                        <td>{{ formatDate(cp.created_at) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else-if="loading" class="text-center text-muted mt-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p>Loading casepapers...</p>
        </div>

        <div v-else class="text-center text-danger mt-4">
            No casepapers found.
        </div>
    </div>
    `,

    data() {
        return {
            token: localStorage.getItem('auth-token'),
            casepapers: [],
            searchQuery: '',
            filterYear: '',
            filterMonth: '',
            filterDay: '',
            loading: false,
        };
    },

    methods: {
        async fetchCasepapers() {
            this.loading = true;
            try {
                // Build query string from active filters
                const params = new URLSearchParams();
                if (this.searchQuery.trim()) params.append('query', this.searchQuery.trim());
                if (this.filterYear)          params.append('year',  this.filterYear);
                if (this.filterMonth)         params.append('month', this.filterMonth);
                if (this.filterDay)           params.append('day',   this.filterDay);

                const res = await fetch(`/api/casepapers?${params.toString()}`, {
                    headers: { 'Authentication-Token': this.token }
                });

                if (res.ok) {
                    this.casepapers = await res.json();
                } else {
                    console.error('Failed to fetch casepapers');
                }
            } catch (err) {
                console.error('Error fetching casepapers:', err);
            } finally {
                this.loading = false;
            }
        },

        clearFilters() {
            this.searchQuery = '';
            this.filterYear  = '';
            this.filterMonth = '';
            this.filterDay   = '';
            this.fetchCasepapers();
        },

        formatDate(dateTime) {
            if (!dateTime) return 'N/A';
            return new Date(dateTime).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        }
    },

    async mounted() {
        await this.fetchCasepapers();
    }
};