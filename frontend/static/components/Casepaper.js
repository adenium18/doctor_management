import Pagination from "./Pagination.js";
import Skeleton   from "./Skeleton.js";

export default {
  components: { Pagination, Skeleton },

  template: `
  <div>
    <div class="mb-4">
      <h4 class="fw-bold mb-0">Casepapers</h4>
      <p class="text-muted small mb-0">{{ filteredCasepapers.length }} record(s) found</p>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body py-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <input v-model="filters.query" class="form-control form-control-sm"
              placeholder="Search name, symptoms, diagnosis..." @input="currentPage = 1" />
          </div>
          <div class="col-md-2">
            <input v-model="filters.date" type="date" class="form-control form-control-sm" @change="currentPage = 1" />
          </div>
          <div class="col-md-2">
            <select v-model="filters.month" class="form-select form-select-sm" @change="currentPage = 1">
              <option value="">All Months</option>
              <option v-for="m in 12" :key="m" :value="m">{{ monthName(m) }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <input v-model.number="filters.year" type="number" class="form-control form-control-sm"
              placeholder="Year" @input="currentPage = 1" />
          </div>
          <div class="col-md-3 d-flex gap-2">
            <button @click="clearFilters" class="btn btn-outline-secondary btn-sm">Reset</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton -->
    <Skeleton v-if="loading" type="table" :rows="8" />

    <!-- Table -->
    <div v-else-if="paginatedCasepapers.length" class="card">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Patient</th>
              <th>Age/Sex</th>
              <th>Date</th>
              <th>Symptoms</th>
              <th>Diagnosis</th>
              <th>Prescription</th>
              <th>Charges</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, i) in paginatedCasepapers" :key="c.casepaper_id">
              <td class="text-muted">{{ (currentPage-1)*perPage + i + 1 }}</td>
              <td>
                <div class="fw-semibold">{{ c.full_name }}</div>
                <small class="text-muted">{{ c.phone || '' }}</small>
              </td>
              <td class="text-muted small">{{ c.age ? c.age + 'y' : '' }} {{ c.sex || '' }}</td>
              <td class="text-muted small text-nowrap">{{ formatDate(c.created_at) }}</td>
              <td style="max-width:150px">
                <div class="text-truncate" style="max-width:140px" :title="c.symptoms">{{ c.symptoms }}</div>
              </td>
              <td style="max-width:150px">
                <div class="text-truncate" style="max-width:140px" :title="c.diagnosis">{{ c.diagnosis }}</div>
              </td>
              <td style="max-width:150px">
                <div class="text-truncate" style="max-width:140px" :title="c.prescription">{{ c.prescription }}</div>
              </td>
              <td>
                <span class="badge bg-success">&#8377; {{ c.charges ?? 150 }}</span>
              </td>
              <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-primary me-1" @click="$router.push('/casepapers/' + c.casepaper_id)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" @click="openDeleteModal(c.casepaper_id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-3 pb-3">
        <Pagination
          :total="filteredCasepapers.length"
          :perPage="perPage"
          :currentPage="currentPage"
          @page-change="currentPage = $event"
        />
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="card p-5 text-center">
      <div style="font-size:48px">&#128203;</div>
      <h5 class="mt-3 text-muted">No casepapers found</h5>
      <p class="text-muted small">Try adjusting the filters or create a new casepaper from Home.</p>
    </div>

    <!-- Edit Modal -->
    <div class="modal fade" id="editCasepaperModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Casepaper
              <small v-if="editCasepaper.patient_name" class="text-muted fw-normal ms-2">— {{ editCasepaper.patient_name }}</small>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form @submit.prevent="submitCasepaperEdit">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Symptoms</label>
                <input v-model="editCasepaper.symptoms" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Diagnosis</label>
                <input v-model="editCasepaper.diagnosis" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Prescription</label>
                <textarea v-model="editCasepaper.prescription" class="form-control" rows="3"></textarea>
              </div>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Charges (&#8377;)</label>
                  <input v-model.number="editCasepaper.charges" type="number" class="form-control" min="0" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Visit Type</label>
                  <select v-model="editCasepaper.visit_type" class="form-select">
                    <option value="consultation">Consultation</option>
                    <option value="follow_up">Follow-Up</option>
                    <option value="procedure">Procedure</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Payment Status</label>
                  <select v-model="editCasepaper.payment_status" class="form-select">
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">
                {{ saving ? 'Saving...' : 'Update' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div class="modal fade" id="deleteCasepaperModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h6 class="modal-title text-danger fw-bold">Delete Casepaper?</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <p class="text-muted mb-0">This action cannot be undone.</p>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-danger btn-sm" @click="deleteCasepaper">Yes, Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      token:               localStorage.getItem("auth-token"),
      casepapers:          [],
      loading:             true,
      saving:              false,
      currentPage:         1,
      perPage:             20,
      editCasepaper:       { id: null, patient_name: "", symptoms: "", diagnosis: "", prescription: "", charges: 150, visit_type: "consultation", payment_status: "paid" },
      casepaperToDeleteId: null,
      filters:             { query: "", date: "", month: "", year: "" }
    };
  },

  computed: {
    filteredCasepapers() {
      const q = this.filters.query.trim().toLowerCase();
      return this.casepapers.filter(c => {
        const created      = new Date(c.created_at);
        const matchQuery   = !q || [c.full_name, c.symptoms, c.diagnosis, c.prescription]
          .some(f => f?.toLowerCase().includes(q));
        const matchDate    = !this.filters.date  || c.created_at?.startsWith(this.filters.date);
        const matchMonth   = !this.filters.month || (created.getMonth() + 1) === parseInt(this.filters.month);
        const matchYear    = !this.filters.year  || created.getFullYear() === parseInt(this.filters.year);
        return matchQuery && matchDate && matchMonth && matchYear;
      });
    },
    paginatedCasepapers() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredCasepapers.slice(start, start + this.perPage);
    }
  },

  methods: {
    async fetchCasepapers() {
      this.loading = true;
      try {
        const res  = await fetch("/api/casepapers", {
          headers: { "Authentication-Token": this.token }
        });
        const data = await res.json();
        this.casepapers = res.ok && Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Error fetching casepapers:", err);
      } finally {
        this.loading = false;
      }
    },

    openEditModal(c) {
      this.editCasepaper = {
        id:             c.casepaper_id,
        patient_name:   c.full_name      || "",
        symptoms:       c.symptoms       || "",
        diagnosis:      c.diagnosis      || "",
        prescription:   c.prescription   || "",
        charges:        c.charges        ?? 150,
        visit_type:     c.visit_type     || "consultation",
        payment_status: c.payment_status || "paid"
      };
      bootstrap.Modal.getOrCreateInstance(
        document.getElementById("editCasepaperModal")
      ).show();
    },

    async submitCasepaperEdit() {
      this.saving = true;
      try {
        const res = await fetch(`/api/casepaper/${this.editCasepaper.id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
          body:    JSON.stringify(this.editCasepaper)
        });
        if (res.ok) {
          bootstrap.Modal.getOrCreateInstance(
            document.getElementById("editCasepaperModal")
          ).hide();
          this.$toast("Casepaper updated successfully!");
          setTimeout(() => this.fetchCasepapers(), 300);
        } else {
          this.$toast("Failed to update casepaper.", "danger");
        }
      } catch (err) {
        console.error("Edit error:", err);
        this.$toast("Network error. Please try again.", "danger");
      } finally {
        this.saving = false;
      }
    },

    openDeleteModal(id) {
      this.casepaperToDeleteId = id;
      bootstrap.Modal.getOrCreateInstance(
        document.getElementById("deleteCasepaperModal")
      ).show();
    },

    async deleteCasepaper() {
      try {
        const res = await fetch(`/delete/casepaper/${this.casepaperToDeleteId}`, {
          method:  "DELETE",
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) {
          bootstrap.Modal.getOrCreateInstance(
            document.getElementById("deleteCasepaperModal")
          ).hide();
          this.$toast("Casepaper deleted.", "info");
          setTimeout(() => this.fetchCasepapers(), 300);
        } else {
          this.$toast("Failed to delete casepaper.", "danger");
        }
      } catch (err) {
        console.error("Delete error:", err);
        this.$toast("Network error. Please try again.", "danger");
      }
    },

    clearFilters() {
      this.filters = { query: "", date: "", month: "", year: "" };
      this.currentPage = 1;
    },

    monthName(m) {
      return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1];
    },

    formatDate(dt) {
      if (!dt) return "N/A";
      return new Date(dt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      });
    }
  },

  async mounted() {
    await this.fetchCasepapers();
  }
};
