export default {
    template: `
    <div class="container p-3">
        <h4 class="fw-bold mb-3">Search Results</h4>
        <hr class="custom-hr">

        <!-- ✅ Show what was searched -->
        <p class="text-muted" v-if="searchType && searchQuery">
            Showing results for <strong>{{ searchType }}</strong>: "{{ searchQuery }}"
        </p>

        <div v-if="results.length > 0">
            <table class="table table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Patient Name</th>
                        <th>Pincode</th>
                        <th>Symptoms</th>
                        <th>Diagnosis</th>
                        <th>Prescription</th>
                        <th>Visited On</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="r in results" :key="r.casepaper_id">
                        <td>{{ r.full_name }}</td>
                        <td>{{ r.pincode }}</td>
                        <td>{{ r.symptoms }}</td>
                        <td>{{ r.diagnosis }}</td>
                        <td>{{ r.prescription }}</td>
                        <td>{{ formatDate(r.created_at) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else-if="searched" class="text-muted mt-3">No results found.</div>

        <!-- ✅ Bug 1 fix — back button -->
        <button class="btn btn-secondary mt-3" @click="$router.go(-1)">← Back</button>
    </div>
    `,

    data() {
        return {
            token: localStorage.getItem("auth-token"),
            results: [],
            searchType: '',
            searchQuery: '',
            searched: false
        };
    },

    methods: {
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        }
    },

    async mounted() {
        const { type, query } = this.$route.query;

        // ✅ Bug 2 fix — gracefully handle missing params
        if (!type || !query) {
            console.warn("Missing search query parameters.");
            this.searched = true;
            return;
        }

        this.searchType = type;
        this.searchQuery = query;

        try {
            const res = await fetch(
                `/api/search-for-doctor?type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}`,
                { headers: { "Authentication-Token": this.token } }
            );
            const data = await res.json();
            this.results = res.ok ? (data.results || []) : [];
        } catch (error) {
            console.error("Error fetching search results:", error);
            this.results = [];
        } finally {
            this.searched = true;
        }
    }
};