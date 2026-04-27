export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Search Results</h4>
        <p class="text-muted small mb-0" v-if="searchType && searchQuery">
          Searching <strong>{{ searchType }}</strong> for
          "<strong>{{ searchQuery }}</strong>" &mdash; {{ results.length }} result(s)
        </p>
      </div>
      <button class="btn btn-outline-secondary btn-sm" @click="$router.go(-1)">&larr; Back</button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else-if="results.length" class="card">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Patient</th>
              <th>Pincode</th>
              <th>Symptoms</th>
              <th>Diagnosis</th>
              <th>Prescription</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in results" :key="r.casepaper_id">
              <td class="text-muted">{{ i + 1 }}</td>
              <td class="fw-semibold" v-html="highlight(r.full_name)"></td>
              <td class="text-muted" v-html="highlight(r.pincode)"></td>
              <td v-html="highlight(r.symptoms)"></td>
              <td v-html="highlight(r.diagnosis)"></td>
              <td v-html="highlight(r.prescription)"></td>
              <td class="text-muted small text-nowrap">{{ formatDate(r.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="searched" class="card p-5 text-center">
      <div style="font-size:48px">&#128269;</div>
      <h5 class="mt-3 text-muted">No results found</h5>
      <p class="text-muted small">Try a different search term or type.</p>
    </div>
  </div>
  `,

  data() {
    return {
      token:       localStorage.getItem("auth-token"),
      results:     [],
      searchType:  "",
      searchQuery: "",
      searched:    false,
      loading:     false
    };
  },

  methods: {
    highlight(text) {
      if (!text || !this.searchQuery) return text || "";
      const escaped = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return String(text).replace(
        new RegExp(`(${escaped})`, "gi"),
        '<mark style="background:#fef08a;padding:0 2px;border-radius:2px">$1</mark>'
      );
    },
    formatDate(dt) {
      if (!dt) return "N/A";
      return new Date(dt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
    }
  },

  async mounted() {
    const { type, query } = this.$route.query;
    if (!type || !query) { this.searched = true; return; }

    this.searchType  = type;
    this.searchQuery = query;
    this.loading     = true;

    try {
      const res  = await fetch(
        `/api/search-for-doctor?type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}`,
        { headers: { "Authentication-Token": this.token } }
      );
      const data = await res.json();
      this.results = res.ok ? (data.results || []) : [];
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      this.searched = true;
      this.loading  = false;
    }
  }
};
