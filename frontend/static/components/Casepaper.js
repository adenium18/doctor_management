export default {
  template: `
    <div class="container p-3">
      <h2 class="text-center fw-bold mb-4">Casepapers</h2>
      <hr class="custom-hr">

      <!-- Filters -->
      <div class="mb-3 row">
        <div class="col-md-3">
          <input v-model="filters.query" class="form-control" placeholder="Search name, medicine, disease" />
        </div>
        <div class="col-md-2">
          <input v-model="filters.date" type="date" class="form-control" />
        </div>
        <div class="col-md-2">
          <select v-model="filters.month" class="form-select">
            <option value="">Month</option>
            <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <input v-model="filters.year" type="number" class="form-control" placeholder="Year" />
        </div>
        <div class="col-md-3">
          <button @click="clearFilters" class="btn btn-secondary">Reset</button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-responsive" v-if="filteredCasepapers.length > 0">
        <table class="table table-bordered table-striped">
          <thead class="table-dark">
            <tr>
              <th>Patient Name</th>
              <th>Age</th>
              <th>Sex</th>
              <th>Address</th>
              <th>Pincode</th>
              <th>Weight (kg)</th>
              <th>Phone</th>
              <th>Date</th>
              <th>Symptoms</th>
              <th>Diagnosis</th>
              <th>Prescription</th>
              <th>Charges (₹)</th>  <!-- ✅ Bug 2 fix — charges column added -->
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="casepaper in filteredCasepapers" :key="casepaper.casepaper_id">
              <td>{{ casepaper.full_name }}</td>
              <td>{{ casepaper.age || 'N/A' }}</td>
              <td>{{ casepaper.sex || 'N/A' }}</td>
              <td>{{ casepaper.address || 'N/A' }}</td>
              <td>{{ casepaper.pincode || 'N/A' }}</td>
              <td>{{ casepaper.weight || 'N/A' }}</td>
              <td>{{ casepaper.phone || 'N/A' }}</td>
              <td>{{ formatDate(casepaper.created_at) }}</td>
              <td>{{ casepaper.symptoms }}</td>
              <td>{{ casepaper.diagnosis }}</td>
              <td>{{ casepaper.prescription }}</td>
              <td>
                <span class="badge bg-success fs-6">₹ {{ casepaper.charges ?? 150 }}</span>
              </td>
              <td>
                <button class="btn btn-sm btn-secondary" @click="openEditModal(casepaper)">Edit</button>
                <button class="btn btn-sm btn-danger"    @click="openDeleteModal(casepaper.casepaper_id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center text-muted mt-3">
        No casepaper information matches the filters.
      </div>

      <!-- Edit Modal -->
      <div class="modal fade" id="editCasepaperModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Casepaper</h5>
              <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="submitCasepaperEdit">
                <div class="form-group mb-2">
                  <label>Symptoms</label>
                  <input v-model="editCasepaper.symptoms" class="form-control" required />
                </div>
                <div class="form-group mb-2">
                  <label>Diagnosis</label>
                  <input v-model="editCasepaper.diagnosis" class="form-control" required />
                </div>
                <div class="form-group mb-3">
                  <label>Prescription</label>
                  <textarea v-model="editCasepaper.prescription" class="form-control" rows="3"></textarea>
                </div>
                <!-- ✅ Bug 3 fix — charges editable in edit modal -->
                <div class="form-group mb-3">
                  <label>Charges (₹)</label>
                  <input
                    v-model.number="editCasepaper.charges"
                    type="number"
                    class="form-control"
                    min="0"
                    placeholder="e.g. 150"
                    required
                  />
                </div>
                <button type="submit" class="btn btn-primary">Update</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Modal -->
      <div class="modal fade" id="deleteCasepaperModal" tabindex="-1">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-body text-center">
              <p>Are you sure you want to delete this casepaper?</p>
              <button class="btn btn-danger"    @click="deleteCasepaper">Yes, Delete</button>
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
      casepapers: [],
      editCasepaper: {
        id: null, symptoms: '', diagnosis: '', prescription: '', charges: 150
      },
      casepaperToDeleteId: null,
      filters: { query: '', date: '', month: '', year: '' }
    };
  },

  computed: {
    filteredCasepapers() {
      const q = this.filters.query.trim().toLowerCase();
      return this.casepapers.filter(c => {
        const created      = new Date(c.created_at);
        const matchesQuery = !q || [c.full_name, c.symptoms, c.diagnosis, c.prescription]
          .some(f => f?.toLowerCase().includes(q));
        const matchesDate  = !this.filters.date  || c.created_at?.startsWith(this.filters.date);
        const matchesMonth = !this.filters.month || created.getMonth() + 1 === parseInt(this.filters.month);
        const matchesYear  = !this.filters.year  || created.getFullYear() === parseInt(this.filters.year);
        return matchesQuery && matchesDate && matchesMonth && matchesYear;
      });
    }
  },

  methods: {
    async fetchcasepapers() {
      try {
        const res = await fetch('/api/casepapers', {
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token
          }
        });
        const data = await res.json();
        if (res.ok) {
          this.casepapers = Array.isArray(data) ? data : [];
        }
      } catch (err) {
        console.error("Error fetching casepapers:", err);
      }
    },

    openEditModal(casepaper) {
      this.editCasepaper = {
        id:           casepaper.casepaper_id,
        symptoms:     casepaper.symptoms,
        diagnosis:    casepaper.diagnosis,
        prescription: casepaper.prescription,
        charges:      casepaper.charges ?? 150   // ✅ prefill charges
      };
      $('#editCasepaperModal').modal('show');
    },

    async submitCasepaperEdit() {
      try {
        const res = await fetch(`/api/casepaper/${this.editCasepaper.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': this.token
          },
          body: JSON.stringify(this.editCasepaper)
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
          headers: { 'Authentication-Token': this.token }
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
    },

    clearFilters() {
      this.filters = { query: '', date: '', month: '', year: '' };
    },

    formatDate(dateTime) {
      if (!dateTime) return 'N/A';
      return new Date(dateTime).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    }
  },

  async mounted() {
    await this.fetchcasepapers();
  }
};