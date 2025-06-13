import Patients from "./Patients.js";

export default {
  template: `
  <div class="container-fluid">
    <h1 class="text-center fw-bold">Welcome {{ user.full_name }} to Dr. A-to-Z 🏥</h1>
    <hr class="custom-hr">

    <div class="alert alert-info text-center">
      <h5>👨‍⚕️ Doctor's Dashboard</h5>
      <p>Search for an existing patient to view or add a new casepaper. If no match is found, you can create a new patient record and attach the casepaper.</p>
    </div>

    <div class="container mb-4">
      <div class="input-group mb-3">
        <input v-model="form.full_name" type="text" class="form-control" placeholder="Enter patient name">
        <button class="btn btn-outline-primary" @click="searchPatient">Search</button>
      </div>

      <div v-if="foundPatient" class="alert alert-success">
        Patient <strong>{{ foundPatient.full_name }}</strong> found.
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

    <div v-if="showForm" class="container mb-5">
      <div class="card">
        <div class="card-body">
          <h4 class="card-title">Casepaper Entry</h4>
          <form @submit.prevent="handleSubmit">
            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Patient Name</label>
                <input type="text" class="form-control" v-model="form.full_name" :readonly="!!foundPatient">
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
                <div v-if="phoneError" class="invalid-feedback">
                  Phone number already exists. Please use a different number.
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Address</label>
              <input type="text" class="form-control" v-model="form.address">
            </div>

            <div class="mb-3">
              <label class="form-label">Pincode</label>
              <input type="text" class="form-control" v-model="form.pincode">
            </div>

            <div class="mb-3">
              <label class="form-label">Symptoms</label>
              <textarea class="form-control" rows="2" v-model="form.symptoms" placeholder="Describe symptoms"></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label">Diagnosis</label>
              <textarea class="form-control" rows="2" v-model="form.diagnosis" placeholder="Enter diagnosis"></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label">Prescription</label>
              <textarea class="form-control" rows="2" v-model="form.prescription" placeholder="Enter prescription"></textarea>
            </div>

            <button type="submit" class="btn btn-primary">Save Casepaper</button>
          </form>
        </div>
      </div>
    </div>

    <div class="card text-center mt-4">
      <div class="card-title"><h2>Contact Support</h2></div>
      <div class="card-text">
        <p>If you need assistance, email us at <a href="mailto:medsupport@atozapp.com">medsupport@atozapp.com</a>.</p>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      user: {},
      patients: [],
      token: localStorage.getItem("auth-token"),
      role: localStorage.getItem("role"),
      foundPatient: null,
      patientNotFound: false,
      showForm: false,
      phoneError: false,
      today: new Date().toISOString().split("T")[0],
      form: {
        full_name: '', dob: '', age: '', weight: '', sex: '',
        phone: '', address: '', pincode: '',
        symptoms: '', diagnosis: '', prescription: ''
      }
    };
  },

  components: { Patients },

  computed: {
    calculatedAge() {
      if (!this.form.dob) return '';
      const today = new Date();
      const birthDate = new Date(this.form.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      this.form.age = age;
      return age;
    }
  },

  async mounted() {
    await this.fetchpatients();
  },

  methods: {
    async fetchpatients() {
      try {
        const res = await fetch("/api/patients", {
          headers: { "Authentication-Token": this.token }
        });
        const data = await res.json();
        if (res.ok) this.patients = data;
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    },

    async searchPatient() {
      this.foundPatient = null;
      this.patientNotFound = false;
      this.showForm = false;

      try {
        const res = await fetch(`/api/patient/search?query=${this.form.full_name}`, {
          headers: { "Authentication-Token": this.token }
        });
        const data = await res.json();

        if (data && data.id) {
          this.foundPatient = data;
          this.form.dob = data.dob;
          this.form.sex = data.sex;
          this.form.phone = data.phone;
          this.form.weight = data.weight;
          this.form.address = data.address;
          this.form.pincode = data.pincode;
        } else {
          this.patientNotFound = true;
        }
      } catch (error) {
        console.error("Search error:", error);
      }
    },

    async handleSubmit() {
      try {
        let patientId;
        this.phoneError = false;

        if (this.foundPatient) {
          patientId = this.foundPatient.id;
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

          const newPatient = await res.json();

          if (!res.ok) {
            if (newPatient.error && newPatient.error.toLowerCase().includes("phone")) {
              this.phoneError = true;
            } else {
              alert("Error creating patient: " + (newPatient.error || "Unknown error"));
            }
            return;
          }

          patientId = newPatient.id;
        }

        const response = await fetch("/api/casepaper", {
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

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save casepaper");
        }

        alert("Casepaper saved successfully!");
        this.form = {
          full_name: '', dob: '', age: '', weight: '', sex: '',
          phone: '', address: '', pincode: '',
          symptoms: '', diagnosis: '', prescription: ''
        };
        this.foundPatient = null;
        this.patientNotFound = false;
        this.showForm = false;
        this.phoneError = false;
        await this.fetchpatients();

      } catch (error) {
        console.error("Error saving casepaper:", error);
        alert(`An error occurred: ${error.message}`);
      }
    }
  }
};
