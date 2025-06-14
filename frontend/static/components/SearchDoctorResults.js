export default {
  template: `
    <div class="p-3">
      <h4>Doctor Search Results</h4>
      <div v-if="results.length > 0">
        <table class="table table-striped">
          <thead>
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
      <div v-else class="text-muted mt-3">No results found.</div>
    </div>
  `,

  data() {
    return {
      token: localStorage.getItem("auth-token"),
      results: []
    };
  },

  methods: {
    formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }
  },

  async mounted() {
    const { type, query } = this.$route.query;
    if (!type || !query) {
      console.warn("Missing query parameters.");
      return;
    }

    try {
      const response = await fetch(`/api/search-for-doctor?type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}`, {
        headers: {
          "Authentication-Token": this.token
        }
      });

      const data = await response.json();
      this.results = response.ok ? data.results : [];

    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }
};
