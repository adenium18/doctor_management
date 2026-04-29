import Pagination from "./Pagination.js";
import Skeleton   from "./Skeleton.js";

export default {
  components: { Pagination, Skeleton },

  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Patients</h4>
        <p class="text-muted small mb-0">Your registered patients</p>
      </div>
      <input
        v-model="searchQuery"
        class="form-control form-control-sm"
        placeholder="Filter by name..."
        style="width:200px"
        @input="currentPage = 1"
      />
    </div>

    <!-- Skeleton -->
    <Skeleton v-if="loading" type="table" :rows="8" />

    <!-- Table -->
    <div v-else-if="paginatedPatients.length" class="card">
      <div class="table-responsive">
        <table class="table mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th @click="sort('full_name')" style="cursor:pointer">Name {{ sortIcon('full_name') }}</th>
              <th>Age</th>
              <th>Sex</th>
              <th>Phone</th>
              <th>Pincode</th>
              <th>DOB</th>
              <th>Weight</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in paginatedPatients" :key="p.id">
              <td class="text-muted">{{ (currentPage-1)*perPage + i + 1 }}</td>
              <td>
                <a href="#" class="fw-semibold text-primary text-decoration-none"
                   @click.prevent="viewHistory(p.id)">{{ p.full_name }}</a>
              </td>
              <td>{{ p.age ? p.age + ' yrs' : '—' }}</td>
              <td>{{ p.sex || '—' }}</td>
              <td>{{ p.phone || '—' }}</td>
              <td>{{ p.pincode || '—' }}</td>
              <td>{{ p.dob || '—' }}</td>
              <td>{{ p.weight ? p.weight + ' kg' : '—' }}</td>
              <td>
                <button class="btn btn-sm btn-outline-secondary" @click="openEdit(p.id)">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-3 pb-3">
        <Pagination
          :total="filteredPatients.length"
          :perPage="perPage"
          :currentPage="currentPage"
          @page-change="currentPage = $event"
        />
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="card p-5 text-center">
      <div style="font-size:48px">&#128101;</div>
      <h5 class="mt-3 text-muted">No patients yet</h5>
      <p class="text-muted small">Patients appear here after you create their first casepaper.</p>
    </div>

    <!-- Edit Modal -->
    <div class="modal fade" id="editPatientModal" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Patient</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form @submit.prevent="submitEdit">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input v-model="editForm.full_name" class="form-control" required />
              </div>
              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label">DOB</label>
                  <input v-model="editForm.dob" type="date" class="form-control" @change="calcAge" />
                </div>
                <div class="col">
                  <label class="form-label">Age</label>
                  <input :value="editForm.age" type="number" class="form-control" readonly />
                </div>
              </div>
              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label">Sex</label>
                  <select v-model="editForm.sex" class="form-select">
                    <option disabled value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div class="col">
                  <label class="form-label">Weight (kg)</label>
                  <input v-model="editForm.weight" type="number" class="form-control" />
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Phone</label>
                <input v-model="editForm.phone" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">Address</label>
                <input v-model="editForm.address" class="form-control" />
              </div>
              <div class="mb-2">
                <label class="form-label">Pincode</label>
                <input v-model="editForm.pincode" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      token:       localStorage.getItem("auth-token"),
      patients:    [],
      loading:     true,
      saving:      false,
      searchQuery: "",
      sortKey:     "full_name",
      sortDir:     1,
      currentPage: 1,
      perPage:     15,
      editForm:    {}
    };
  },

  computed: {
    filteredPatients() {
      const q = this.searchQuery.trim().toLowerCase();
      let list = q
        ? this.patients.filter(p => p.full_name.toLowerCase().includes(q))
        : [...this.patients];
      list.sort((a, b) => {
        const av = (a[this.sortKey] || "").toString().toLowerCase();
        const bv = (b[this.sortKey] || "").toString().toLowerCase();
        return av < bv ? -this.sortDir : av > bv ? this.sortDir : 0;
      });
      return list;
    },
    paginatedPatients() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredPatients.slice(start, start + this.perPage);
    }
  },

  methods: {
    async fetchPatients() {
      this.loading = true;
      try {
        const res  = await fetch("/api/patients", {
          headers: { "Authentication-Token": this.token }
        });
        const data = await res.json();
        this.patients = (res.ok && Array.isArray(data)) ? data : [];
      } catch (err) {
        console.error("Failed to load patients:", err);
      } finally {
        this.loading = false;
      }
    },

    async openEdit(id) {
      try {
        const res  = await fetch(`/api/update-patient/${id}`, {
          headers: { "Authentication-Token": this.token }
        });
        const data = await res.json();
        if (res.ok) {
          this.editForm = { ...data };
          this.calcAge();
          bootstrap.Modal.getOrCreateInstance(
            document.getElementById("editPatientModal")
          ).show();
        } else {
          this.$toast(data.error || "Failed to load patient.", "danger");
        }
      } catch (err) {
        console.error("Network error:", err);
        this.$toast("Network error. Please try again.", "danger");
      }
    },

    async submitEdit() {
      this.saving = true;
      try {
        const res  = await fetch(`/api/update-patient/${this.editForm.id}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
          body:    JSON.stringify(this.editForm)
        });
        const data = await res.json();
        if (res.ok) {
          bootstrap.Modal.getOrCreateInstance(
            document.getElementById("editPatientModal")
          ).hide();
          this.$toast("Patient updated successfully!");
          setTimeout(() => this.fetchPatients(), 350);
        } else {
          this.$toast(data.error || "Update failed.", "danger");
        }
      } catch (err) {
        console.error("Network error:", err);
        this.$toast("Network error. Please try again.", "danger");
      } finally {
        this.saving = false;
      }
    },

    viewHistory(id) {
      localStorage.setItem("selected_patient_id", id);
      this.$router.push("/patient_history");
    },

    calcAge() {
      if (!this.editForm.dob) return;
      const dob   = new Date(this.editForm.dob);
      const today = new Date();
      let   age   = today.getFullYear() - dob.getFullYear();
      if (today.getMonth() < dob.getMonth() ||
         (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
      this.editForm.age = age;
    },

    sort(key) {
      if (this.sortKey === key) this.sortDir *= -1;
      else { this.sortKey = key; this.sortDir = 1; }
      this.currentPage = 1;
    },

    sortIcon(key) {
      if (this.sortKey !== key) return "&#8597;";
      return this.sortDir === 1 ? "&#8593;" : "&#8595;";
    }
  },

  async mounted() {
    await this.fetchPatients();
  }
};
