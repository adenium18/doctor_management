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
        <button class="btn btn-sm btn-outline-primary mt-2" @click="showForm = true">Create New Patient & Casepaper</button>
      </div>
    </div>

    <!-- Match Modal -->
    <div class="modal fade" id="matchingPatientsModal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Select a Patient</h5>
            <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
          </div>
          <div class="modal-body">
            <p>Multiple patients found with name <strong>{{ form.full_name }}</strong>:</p>
            <ul class="list-group">
              <li class="list-group-item" v-for="p in matchingPatients" :key="p.id">
                {{ p.full_name }} | DOB: {{ p.dob }} | Phone: {{ p.phone }}
                <button class="btn btn-sm btn-primary float-end" @click="selectPatient(p)">Select</button>
              </li>
            </ul>
            <hr>
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
        <h4 class="card-title">Casepaper Entry</h4>
        <form @submit.prevent="handleSubmit">
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Patient Name</label>
              <input type="text" class="form-control" v-model="form.full_name">
            </div>
            <div class="col-md-4">
              <label class="form-label">DOB</label>
              <input type="date" class="form-control" v-model="form.dob" :max="today" min="1900-01-01">
            </div>
            <div class="col-md-4">
              <label class="form-label">Age</label>
              <input type="number" class="form-control" :value="calculatedAge" readonly>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label">Gender</label>
              <select class="form-select" v-model="form.sex">
                <option disabled selected>Select</option>
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
              <input type="text" class="form-control" v-model="form.phone" :class="{ 'is-invalid': phoneError }">
              <div v-if="phoneError" class="invalid-feedback">Phone number already exists.</div>
            </div>
          </div>

          <div class="mb-3"><label>Address</label><input class="form-control" v-model="form.address" /></div>
          <div class="mb-3"><label>Pincode</label><input class="form-control" v-model="form.pincode" /></div>

          <div class="mb-3"><label>Symptoms</label><textarea class="form-control" v-model="form.symptoms"></textarea></div>
          <div class="mb-3"><label>Diagnosis</label><textarea class="form-control" v-model="form.diagnosis"></textarea></div>
          <div class="mb-3"><label>Prescription</label><textarea class="form-control" v-model="form.prescription"></textarea></div>

          <button class="btn btn-primary">Save Casepaper</button>
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
      if (td.getMonth() < bd.getMonth() || (td.getMonth() === bd.getMonth() && td.getDate() < bd.getDate())) {
        age--;
      }
      this.form.age = age;
      return age;
    }
  },

  methods: {
    async searchPatient() {
      this.matchingPatients = [];
      this.foundPatient = null;
      this.patientNotFound = false;
      this.showForm = false;
      this.forceCreateNew = false;

      try {
        const res = await fetch(`/api/patient/search?query=${encodeURIComponent(this.form.full_name)}`, {
          headers: { "Authentication-Token": this.token }
        });
        const data = await res.json();

        if (Array.isArray(data) && data.length > 1) {
          this.matchingPatients = data;
          $("#matchingPatientsModal").modal("show");
        } else if (data && data.id) {
          this.foundPatient = data;
          this.prefillForm(data);
        } else {
          this.patientNotFound = true;
        }
      } catch (err) {
        console.error("Search error:", err);
      }
    },

    selectPatient(p) {
      this.foundPatient = p;
      this.prefillForm(p);
      this.showForm = true;
      this.forceCreateNew = false;
      $("#matchingPatientsModal").modal("hide");
    },

    createNewPatientWithSameName() {
      this.foundPatient = null;
      this.forceCreateNew = true;
      this.showForm = true;
      $("#matchingPatientsModal").modal("hide");
    },

    prefillForm(data) {
      this.form = {
        ...this.form,
        full_name: data.full_name,
        dob: data.dob,
        sex: data.sex,
        phone: data.phone || '',
        weight: data.weight || '',
        address: data.address || '',
        pincode: data.pincode || ''
      };
      this.calculatedAge;
    },

    async handleSubmit() {
      try {
        if (!this.forceCreateNew && this.foundPatient) {
          var patientId = this.foundPatient.id;
        } else {
          const res = await fetch("/api/patients", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authentication-Token": this.token
            },
            body: JSON.stringify({
              full_name: this.form.full_name,
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
            } else {
              alert(result.error || "Failed creating patient");
              return;
            }
          }

          patientId = result.patient_id || result.id;
          if (!patientId) throw new Error("No patient ID returned.");
        }

        const caseRes = await fetch("/api/casepaper", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": this.token
          },
          body: JSON.stringify({
            patient_id: patientId,
            doctor_id: localStorage.getItem("user_id"),
            symptoms: this.form.symptoms,
            diagnosis: this.form.diagnosis,
            prescription: this.form.prescription
          })
        });

        const caseData = await caseRes.json();
        if (!caseRes.ok) throw new Error(caseData.error || "Failed saving casepaper");

        alert("Casepaper saved!");
        this.resetForm();
      } catch (err) {
        console.error(err);
        alert(`Oops: ${err.message}`);
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
    }
  }
};
