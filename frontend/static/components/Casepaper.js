export default {
  template: `
    <div class="p-3">
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
          <button @click="applyFilters" class="btn btn-info">Apply Filters</button>
          <button @click="clearFilters" class="btn btn-secondary ms-2">Reset</button>
        </div>
      </div>

      <div v-if="filteredCasepapers.length > 0">
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
            <tr v-for="casepaper in filteredCasepapers" :key="casepaper.id">
              <td v-html="highlightMatch(casepaper.patient_name)"></td>
              <td>{{ casepaper.age }} Yrs</td>
              <td>{{ casepaper.address }}</td>
              <td>{{ casepaper.sex }}</td>
              <td>{{ casepaper.weight }}</td>
              <td>{{ casepaper.phone }}</td>
              <td>{{ casepaper.created_at }}</td>
              <td v-html="highlightMatch(casepaper.symptoms)"></td>
              <td v-html="highlightMatch(casepaper.diagnosis)"></td>
              <td v-html="highlightMatch(casepaper.prescription)"></td>
              <td>
                <button class="btn btn-sm btn-secondary" @click="openEditModal(casepaper)">Edit</button>
                <button class="btn btn-sm btn-danger" @click="openDeleteModal(casepaper.id)">Delete</button>
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
      <div class="modal fade" id="deleteCasepaperModal" tabindex="-1">
        <div class="modal-dialog modal-sm">
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
      editCasepaper: { id: null, symptoms: '', diagnosis: '', prescription: '' },
      casepaperToDeleteId: null,
      filters: {
        query: '',
        date: '',
        month: '',
        year: ''
      }
    };
  },
  computed: {
    filteredCasepapers() {
      const q = this.filters.query.trim().toLowerCase();
      return this.casepapers.filter(c => {
        const created = new Date(c.created_at);
        const matchesQuery =
          !q || [c.patient_name, c.symptoms, c.diagnosis, c.prescription].some(f => f?.toLowerCase().includes(q));
        const matchesDate = !this.filters.date || c.created_at.startsWith(this.filters.date);
        const matchesMonth = !this.filters.month || created.getMonth() + 1 === parseInt(this.filters.month);
        const matchesYear = !this.filters.year || created.getFullYear() === parseInt(this.filters.year);
        return matchesQuery && matchesDate && matchesMonth && matchesYear;
      });
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
    },
    applyFilters() {
      // Trigger computed filter update
    },
    clearFilters() {
      this.filters = { query: '', date: '', month: '', year: '' };
    },
    highlightMatch(text) {
      const q = this.filters.query?.trim();
      if (!q) return text;
      const regex = new RegExp(`(${q})`, 'gi');
      return text?.replace(regex, '<mark>$1</mark>') || '';
    }
  },
  async mounted() {
    await this.fetchcasepapers();
  }
};
