export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">New Casepaper</h4>
        <p class="text-muted small mb-0">Search for an existing patient or create a new one</p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="input-group">
          <input
            v-model="form.full_name"
            type="text"
            class="form-control"
            placeholder="Enter patient name to search..."
            @keyup.enter="searchPatient"
          />
          <button class="btn btn-primary" @click="searchPatient" :disabled="searching">
            {{ searching ? 'Searching...' : 'Search' }}
          </button>
          <button class="btn btn-outline-secondary" @click="startNewPatient" title="New patient">
            + New Patient
          </button>
        </div>
      </div>
    </div>

    <!-- Status alerts -->
    <div v-if="foundPatient" class="alert alert-success d-flex justify-content-between align-items-center mb-4">
      <div>
        <strong>{{ foundPatient.full_name }}</strong> selected &mdash;
        DOB: {{ foundPatient.dob || 'N/A' }} &nbsp;|&nbsp;
        Gender: {{ foundPatient.sex || 'N/A' }}
      </div>
      <button class="btn btn-sm btn-success" @click="showForm = true" v-if="!showForm">
        Add Casepaper
      </button>
    </div>

    <div v-if="patientNotFound" class="alert alert-warning d-flex justify-content-between align-items-center mb-4">
      <span>No patient found for "<strong>{{ form.full_name }}</strong>"</span>
      <button class="btn btn-sm btn-outline-primary" @click="startNewPatient">
        Create New Patient
      </button>
    </div>

    <!-- Patient Selection Modal -->
    <div class="modal fade" id="matchingPatientsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Select Patient</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted small mb-3">
              {{ matchingPatients.length === 1 ? 'One patient found' : matchingPatients.length + ' patients found' }}
              matching <strong>{{ form.full_name }}</strong>:
            </p>
            <div class="list-group mb-3">
              <div
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                v-for="p in matchingPatients" :key="p.id"
              >
                <div>
                  <div class="fw-semibold">{{ p.full_name }}</div>
                  <small class="text-muted">
                    DOB: {{ p.dob || 'N/A' }} &nbsp;|&nbsp;
                    Phone: {{ p.phone || 'N/A' }} &nbsp;|&nbsp;
                    Last: {{ p.last_visit ? p.last_visit.slice(0,10) : 'Never' }}
                  </small>
                </div>
                <button class="btn btn-sm btn-success ms-2 flex-shrink-0" @click="selectPatient(p)">
                  Select
                </button>
              </div>
            </div>
            <hr>
            <button class="btn btn-outline-secondary w-100" @click="createNewPatientWithSameName">
              + Create New Patient with This Name
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Casepaper Form -->
    <div v-if="showForm" class="card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-bold mb-0">
            Casepaper Entry
            <span v-if="foundPatient" class="badge bg-success ms-2">Existing Patient</span>
            <span v-else class="badge bg-warning text-dark ms-2">New Patient</span>
          </h5>
          <button type="button" class="btn-close" @click="resetForm"></button>
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- Patient Details -->
          <h6 class="text-muted fw-semibold mb-3 text-uppercase" style="font-size:11px;letter-spacing:1px">Patient Information</h6>
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <label class="form-label">Patient Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" v-model="form.full_name" :readonly="!!foundPatient" required />
            </div>
            <div class="col-md-3">
              <label class="form-label">Date of Birth</label>
              <input type="date" class="form-control" v-model="form.dob" :max="today" min="1900-01-01" :readonly="!!foundPatient" @change="computeAge" />
            </div>
            <div class="col-md-2">
              <label class="form-label">Age</label>
              <input type="number" class="form-control" v-model="form.age" readonly />
            </div>
            <div class="col-md-3">
              <label class="form-label">Gender</label>
              <select class="form-select" v-model="form.sex" :disabled="!!foundPatient">
                <option disabled value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Phone</label>
              <input type="text" class="form-control" v-model="form.phone"
                :class="{ 'is-invalid': phoneError }" :readonly="!!foundPatient" />
              <div v-if="phoneError" class="invalid-feedback">Phone already registered.</div>
            </div>
            <div class="col-md-2">
              <label class="form-label">Weight (kg)</label>
              <input type="number" class="form-control" v-model="form.weight" :readonly="!!foundPatient" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Address</label>
              <input class="form-control" v-model="form.address" :readonly="!!foundPatient" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Pincode</label>
              <input class="form-control" v-model="form.pincode" :readonly="!!foundPatient" />
            </div>
          </div>

          <!-- Clinical Notes -->
          <h6 class="text-muted fw-semibold mb-3 text-uppercase" style="font-size:11px;letter-spacing:1px">Clinical Notes</h6>

          <div class="row g-3 mb-3">
            <div class="col-md-3">
              <label class="form-label">Consultation Fee (&#8377;) <span class="text-danger">*</span></label>
              <input type="number" class="form-control fw-bold" v-model.number="form.charges" min="0" required />
            </div>
            <div class="col-md-3">
              <label class="form-label">Visit Type</label>
              <select class="form-select" v-model="form.visit_type">
                <option value="consultation">Consultation</option>
                <option value="follow_up">Follow-Up</option>
                <option value="procedure">Procedure</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Payment Status</label>
              <select class="form-select" v-model="form.payment_status">
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Follow-Up Date</label>
              <input type="date" class="form-control" v-model="form.next_followup" :min="today" />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Symptoms <span class="text-danger">*</span></label>
            <textarea class="form-control" v-model="form.symptoms" rows="2" required></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Diagnosis <span class="text-danger">*</span></label>
            <textarea class="form-control" v-model="form.diagnosis" rows="2" required></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Prescription <span class="text-danger">*</span></label>
            <textarea class="form-control" v-model="form.prescription" rows="3" required></textarea>
          </div>
          <div class="mb-4">
            <label class="form-label">Additional Notes</label>
            <input class="form-control" v-model="form.notes" placeholder="Optional internal notes..." />
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-primary px-4" :disabled="submitting">
              {{ submitting ? 'Saving...' : 'Save Casepaper' }}
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="resetForm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      token:            localStorage.getItem("auth-token"),
      today:            new Date().toISOString().split("T")[0],
      matchingPatients: [],
      foundPatient:     null,
      patientNotFound:  false,
      showForm:         false,
      forceCreateNew:   false,
      phoneError:       false,
      searching:        false,
      submitting:       false,
      form: {
        full_name:      "",
        dob:            "",
        age:            "",
        weight:         "",
        sex:            "",
        phone:          "",
        address:        "",
        pincode:        "",
        symptoms:       "",
        diagnosis:      "",
        prescription:   "",
        notes:          "",
        charges:        150,
        visit_type:     "consultation",
        payment_status: "paid",
        next_followup:  ""
      }
    };
  },

  methods: {
    computeAge() {
      if (!this.form.dob) { this.form.age = ""; return; }
      const td  = new Date();
      const bd  = new Date(this.form.dob);
      let   age = td.getFullYear() - bd.getFullYear();
      if (td.getMonth() < bd.getMonth() ||
         (td.getMonth() === bd.getMonth() && td.getDate() < bd.getDate())) age--;
      this.form.age = age;
    },

    async searchPatient() {
      this.matchingPatients = [];
      this.foundPatient     = null;
      this.patientNotFound  = false;
      this.showForm         = false;
      this.forceCreateNew   = false;

      if (!this.form.full_name.trim()) {
        this.$toast("Please enter a patient name to search.", "warning");
        return;
      }
      this.searching = true;
      try {
        const res  = await fetch(
          `/api/patient/search?query=${encodeURIComponent(this.form.full_name.trim())}`,
          { headers: { "Authentication-Token": this.token } }
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length >= 1) {
          this.matchingPatients = data;
          bootstrap.Modal.getOrCreateInstance(
            document.getElementById("matchingPatientsModal")
          ).show();
        } else {
          this.patientNotFound = true;
        }
      } catch (err) {
        console.error("Search error:", err);
        this.$toast("Search failed. Please try again.", "danger");
      } finally {
        this.searching = false;
      }
    },

    selectPatient(p) {
      this.foundPatient   = p;
      this.forceCreateNew = false;
      this.form = {
        ...this.form,
        full_name: p.full_name || "",
        dob:       p.dob       || "",
        sex:       p.sex       || "",
        phone:     p.phone     || "",
        weight:    p.weight    || "",
        address:   p.address   || "",
        pincode:   p.pincode   || ""
      };
      this.computeAge();
      this.showForm = true;
      bootstrap.Modal.getOrCreateInstance(
        document.getElementById("matchingPatientsModal")
      ).hide();
    },

    createNewPatientWithSameName() {
      this.foundPatient   = null;
      this.forceCreateNew = true;
      this.showForm       = true;
      bootstrap.Modal.getOrCreateInstance(
        document.getElementById("matchingPatientsModal")
      ).hide();
    },

    startNewPatient() {
      this.foundPatient    = null;
      this.patientNotFound = false;
      this.forceCreateNew  = true;
      this.showForm        = true;
    },

    async handleSubmit() {
      this.phoneError = false;
      this.submitting = true;
      try {
        let patientId;

        if (!this.forceCreateNew && this.foundPatient) {
          patientId = this.foundPatient.id;
        } else {
          const res    = await fetch("/api/patients", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
            body:    JSON.stringify({
              full_name: this.form.full_name.trim(),
              dob:       this.form.dob,
              age:       this.form.age,
              weight:    this.form.weight,
              sex:       this.form.sex,
              phone:     this.form.phone,
              address:   this.form.address,
              pincode:   this.form.pincode
            })
          });
          const result = await res.json();
          if (!res.ok) {
            if (result.error?.toLowerCase().includes("phone")) {
              this.phoneError = true;
            } else {
              this.$toast(result.error || "Failed to create patient.", "danger");
            }
            return;
          }
          patientId = result.id;
          if (!patientId) throw new Error("No patient ID returned.");
        }

        const caseRes  = await fetch("/api/casepaper", {
          method:  "POST",
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
          body:    JSON.stringify({
            patient_id:     patientId,
            symptoms:       this.form.symptoms,
            diagnosis:      this.form.diagnosis,
            prescription:   this.form.prescription,
            charges:        this.form.charges,
            visit_type:     this.form.visit_type,
            payment_status: this.form.payment_status,
            notes:          this.form.notes,
            next_followup:  this.form.next_followup
          })
        });
        const caseData = await caseRes.json();
        if (!caseRes.ok) throw new Error(caseData.error || "Failed to save casepaper.");

        this.$toast("Casepaper saved successfully!");
        this.resetForm();
      } catch (err) {
        console.error("Submit error:", err);
        this.$toast(err.message || "An error occurred.", "danger");
      } finally {
        this.submitting = false;
      }
    },

    resetForm() {
      this.form = {
        full_name: "", dob: "", age: "", weight: "", sex: "",
        phone: "", address: "", pincode: "", symptoms: "",
        diagnosis: "", prescription: "", notes: "", charges: 150,
        visit_type: "consultation", payment_status: "paid", next_followup: ""
      };
      this.foundPatient    = null;
      this.patientNotFound = false;
      this.showForm        = false;
      this.phoneError      = false;
      this.forceCreateNew  = false;
      this.matchingPatients = [];
    }
  }
};
