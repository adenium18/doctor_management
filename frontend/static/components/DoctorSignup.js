import Patients from "./Patients.js";

export default {
  template: `
  <div class="container-fluid">
    <h1 class="text-center fw-bold">Welcome {{ user.full_name }} to Dr. A-to-Z 🏥</h1>
    <hr class="custom-hr">

    <!-- Info Block -->
    <div class="alert alert-info text-center">
      <h5>👨‍⚕️ Doctor's Dashboard</h5>
      <p>Search for an existing patient or create a new one—now with support for name duplicates.</p>
    </div>

    <!-- Search -->
    <div class="container mb-4">
      <div class="input-group mb-3">
        <input v-model="form.full_name" type="text" class="form-control" placeholder="Enter patient name">
        <button class="btn btn-outline-primary" @click="searchPatient">Search</button>
      </div>

      <div v-if="foundPatient" class="alert alert-success">
        Patient <strong>{{ foundPatient.full_name }}</strong> selected.
        <br>
        <strong>DOB:</strong> {{ foundPatient.dob }} | <strong>Gender:</strong> {{ foundPatient.sex }}
        <br>
        <button class="btn btn-sm btn-success mt-2" @click="showForm = true">Add Casepaper</button>
      </div>

      <div v-if="patientNotFound" class="alert alert-warning">
        No matching patient found. You can create a new one.
        <button class="btn btn-sm btn-outline-primary mt-2" @click="showForm = true; forceCreateNew = true">Create New Patient & Casepaper</button>
      </div>
    </div>

    <!-- ✅ Match Modal — shown for ALL search results (1 or more) -->
    <div class="modal fade" id="matchingPatientsModal" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Patient Found</h5>
            <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
          </div>
          <div class="modal-body">

            <p>
              <span v-if="matchingPatients.length === 1">Patient found matching <strong>{{ form.full_name }}</strong>:</span>
              <span v-else>Multiple patients found matching <strong>{{ form.full_name }}</strong>:</span>
            </p>

            <!-- List all matched patients, each with Add Casepaper button -->
            <ul class="list-group mb-3">
              <li class="list-group-item d-flex justify-content-between align-items-center" v-for="p in matchingPatients" :key="p.id">
                <div>
                  <strong>{{ p.full_name }}</strong><br>
                  <small>DOB: {{ p.dob || 'N/A' }} | Phone: {{ p.phone || 'N/A' }} | Last Visit: {{ p.last_visit ? p.last_visit.slice(0,10) : 'Never' }}</small>
                </div>
                <!-- ✅ Every patient gets an "Add Casepaper" button -->
                <button class="btn btn-sm btn-success ms-2" @click="selectPatient(p)">
                  Add Casepaper
                </button>
              </li>
            </ul>

            <hr>

            <!-- ✅ Always show option to create new patient with same name -->
            <button class="btn btn-outline-secondary w-100 mt-2" @click="createNewPatientWithSameName">
              ➕ Create New Patient with This Name
            </button>

          </div>
        </div>
      </div>
    </div>

    <!-- Casepaper Form -->
    <div v-if="showForm" class="container mb-5">
      <div class="card"><div class="card-body">
        <h4 class="card-title">
          Casepaper Entry
          <span v-if="foundPatient" class="badge bg-success ms-2">Existing: {{ foundPatient.full_name }}</span>
          <span v-else class="badge bg-warning ms-2">New Patient</span>
        </h4>
        <form @submit.prevent="handleSubmit">
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Patient Name</label>
              <input type="text" class="form-control" v-model="form.full_name" :readonly="!!foundPatient">
            </div>
            <div class="col-md-4">
              <label class="form-label">DOB</label>
              <input type="date" class="form-control" v-model="form.dob" :max="today" min="1900-01-01" :readonly="!!foundPatient">
            </div>
            <div class="col-md-4">
              <label class="form-label">Age</label>
              <input type="number" class="form-control" :value="calculatedAge" readonly>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Gender</label>
              <select class="form-select" v-model="form.sex" :disabled="!!foundPatient">
                <option disabled value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Weight (kg)</label>
              <input type="number" class="form-control" v-model="form.weight">
            </div>
            <div class="col-md-4">
              <label class="form-label">Phone</label>
              <input type="text" class="form-control" v-model="form.phone" :class="{ 'is-invalid': phoneError }" :readonly="!!foundPatient">
              <div v-if="phoneError" class="invalid-feedback">Phone number already exists.</div>
            </div>
          </div>

          <div class="mb-3"><label>Address</label><input class="form-control" v-model="form.address" :readonly="!!foundPatient" /></div>
          <div class="mb-3"><label>Pincode</label><input class="form-control" v-model="form.pincode" :readonly="!!foundPatient" /></div>

          <hr>
          <h6 class="text-muted">Clinical Notes</h6>
          <div class="mb-3"><label>Symptoms</label><textarea class="form-control" v-model="form.symptoms" required></textarea></div>
          <div class="mb-3"><label>Diagnosis</label><textarea class="form-control" v-model="form.diagnosis" required></textarea></div>
          <div class="mb-3"><label>Prescription</label><textarea class="form-control" v-model="form.prescription" required></textarea></div>

          <button class="btn btn-primary">Save Casepaper</button>
          <button type="button" class="btn btn-secondary ms-2" @click="resetForm">Cancel</button>
        </form>
      </div></div>
    </div>

    <div class="card text-center mt-4"><div class="card-body">
      <h2>Contact Support</h2>
      <p>Email: <a href="mailto:medsupport@atozapp.com">medsupport@atozapp.com</a></p>
    </div></div>
  </div>
  `,

  data() {
    return {
      user: {},
      token: localStorage.getItem("auth-token"),
      role: localStorage.getItem("role"),
      today: new Date().toISOString().split("T")[0],

      matchingPatients: [],
      foundPatient: null,
      patientNotFound: false,
      showForm: false,
      forceCreateNew: false,
      phoneError: false,

      form: {
        full_name: '',
        dob: '',
        age: '',
        weight: '',
        sex: '',
        phone: '',
        address: '',
        pincode: '',
        symptoms: '',
        diagnosis: '',
        prescription: ''
      }
    };
  },

  computed: {
    calculatedAge() {
      if (!this.form.dob) return '';
      const td = new Date();
      const bd = new Date(this.form.dob);
      let age = td.getFullYear() - bd.getFullYear();
      if (
        td.getMonth() < bd.getMonth() ||
        (td.getMonth() === bd.getMonth() && td.getDate() < bd.getDate())
      ) {
        age--;
      }
      this.form.age = age;
      return age;
    }
  },

  async mounted() {
    try {
      const res = await fetch("/user-details", {
        headers: { "Authentication-Token": this.token }
      });
      this.user = await res.json();
    } catch (err) {
      console.error("Failed to load user details:", err);
    }
  },

  methods: {
    async searchPatient() {
      this.matchingPatients = [];
      this.foundPatient = null;
      this.patientNotFound = false;
      this.showForm = false;
      this.forceCreateNew = false;

      if (!this.form.full_name.trim()) {
        alert("Please enter a patient name to search.");
        return;
      }

      try {
        const res = await fetch(`/api/patient/search?query=${encodeURIComponent(this.form.full_name.trim())}`, {
          headers: { "Authentication-Token": this.token }
        });
        const data = await res.json();

        if (Array.isArray(data) && data.length >= 1) {
          // ✅ 1 or many results — always show modal so doctor can choose
          this.matchingPatients = data;
          $("#matchingPatientsModal").modal("show");
        } else {
          // No results — prompt to create new
          this.patientNotFound = true;
        }
      } catch (err) {
        console.error("Search error:", err);
        alert("Search failed. Please try again.");
      }
    },

    // ✅ Doctor picked an existing patient — prefill form, lock patient fields
    selectPatient(p) {
      this.foundPatient = p;
      this.forceCreateNew = false;
      this.prefillForm(p);
      this.showForm = true;
      $("#matchingPatientsModal").modal("hide");
    },

    // ✅ Doctor wants a brand new patient with the same name
    createNewPatientWithSameName() {
      this.foundPatient = null;
      this.forceCreateNew = true;
      this.showForm = true;
      // form.full_name is kept so name stays pre-filled
      $("#matchingPatientsModal").modal("hide");
    },

    prefillForm(data) {
      this.form = {
        ...this.form,
        full_name: data.full_name || '',
        dob: data.dob || '',
        sex: data.sex || '',
        phone: data.phone || '',
        weight: data.weight || '',
        address: data.address || '',
        pincode: data.pincode || ''
      };
    },

    async handleSubmit() {
      this.phoneError = false;

      try {
        let patientId;

        if (!this.forceCreateNew && this.foundPatient) {
          // Existing patient — use their ID directly, skip creation
          patientId = this.foundPatient.id;
        } else {
          // New patient — create first
          const res = await fetch("/api/patients", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": this.token
            },
            body: JSON.stringify({
              full_name: this.form.full_name.trim(),
              dob: this.form.dob,
              age: this.form.age,
              weight: this.form.weight,
              sex: this.form.sex,
              phone: this.form.phone,
              address: this.form.address,
              pincode: this.form.pincode
            })
          });

          const result = await res.json();

          if (!res.ok) {
            if (result.error && result.error.toLowerCase().includes("phone")) {
              this.phoneError = true;
              return;
            }
            alert(result.error || "Failed to create patient.");
            return;
          }

          patientId = result.id || result.patient_id;
          if (!patientId) throw new Error("No patient ID returned from server.");
        }

        // Save casepaper linked to the patient
        const caseRes = await fetch("/api/casepaper", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": this.token
          },
          body: JSON.stringify({
            patient_id: patientId,
            doctor_id: parseInt(localStorage.getItem("user_id")),
            symptoms: this.form.symptoms,
            diagnosis: this.form.diagnosis,
            prescription: this.form.prescription
          })
        });

        const caseData = await caseRes.json();
        if (!caseRes.ok) throw new Error(caseData.error || "Failed to save casepaper.");

        alert("Casepaper saved successfully!");
        this.resetForm();

      } catch (err) {
        console.error("Submit error:", err);
        alert(`Error: ${err.message}`);
      }
    },

    resetForm() {
      this.form = {
        full_name: '', dob: '', age: '', weight: '',
        sex: '', phone: '', address: '', pincode: '',
        symptoms: '', diagnosis: '', prescription: ''
      };
      this.foundPatient = null;
      this.patientNotFound = false;
      this.showForm = false;
      this.phoneError = false;
      this.forceCreateNew = false;
      this.matchingPatients = [];
    }
  }
};