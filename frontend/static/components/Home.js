import Patients from "./Patients.js";

export default {
  template: `
  <div class="container-fluid">
    <h1 class="text-center fw-bold">Welcome {{user.full_name}} to Dr. A-to-Z 🏥</h1>
    <hr class="custom-hr">
    <h3 class="text-center text-success fw-bold">Manage Patient Casepapers with Ease</h3>

    <div class="container my-4">
      <div class="card mb-4">
        <div class="card-body">
          <h4 class="card-title">New Casepaper Entry</h4>
          <form @submit.prevent="handleSubmit">
            <div class="row mb-3">
              <div class="col-md-4">
                <label for="patientName" class="form-label">Patient Name</label>
                <div class="input-group">
                  <input type="text" id="patientName" class="form-control" v-model="form.full_name" placeholder="Enter patient name">
                  <button class="btn btn-outline-primary" @click.prevent="searchPatient">Search</button>
                </div>
              </div>
              <div class="col-md-4">
                <label for="age" class="form-label">Age</label>
                <input type="number" id="age" class="form-control" v-model="form.age" placeholder="Age">
              </div>
              <div class="col-md-4">
                <label for="gender" class="form-label">Gender</label>
                <select id="gender" class="form-select" v-model="form.sex">
                  <option selected disabled>Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label for="symptoms" class="form-label">Symptoms</label>
              <textarea id="symptoms" class="form-control" rows="2" v-model="form.symptoms" placeholder="Describe symptoms"></textarea>
            </div>

            <div class="mb-3">
              <label for="diagnosis" class="form-label">Diagnosis</label>
              <textarea id="diagnosis" class="form-control" rows="2" v-model="form.diagnosis" placeholder="Enter diagnosis details"></textarea>
            </div>

            <div class="mb-3">
              <label for="prescription" class="form-label">Prescription</label>
              <textarea id="prescription" class="form-control" rows="2" v-model="form.prescription" placeholder="Enter prescribed medication"></textarea>
            </div>

            <button type="submit" class="btn btn-primary">Save Casepaper</button>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <h4 class="card-title">Patient Records</h4>
          <p class="text-muted">Recent entries will be listed here.</p>
          <ul class="list-group">
            <li class="list-group-item">
              <strong>John Doe</strong> — Fever & Cough — <em>Paracetamol 500mg</em>
            </li>
            <li class="list-group-item">
              <strong>Priya Sharma</strong> — Headache — <em>Ibuprofen 400mg</em>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card text-center mt-4">
      <div class="card-title">
        <h2>Contact Support</h2>
      </div>
      <div class="card-text">
        <p>If you have any issues or need assistance, contact us at <a href="mailto:medsupport@atozapp.com">medsupport@atozapp.com</a>.</p>
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
      form: {
        full_name: '',
        age: '',
        sex: '',
        symptoms: '',
        diagnosis: '',
        prescription: ''
      }
    };
  },
  components: {
    Patients,
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
        if (res.ok) {
          this.patients = data;
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    },

    async searchPatient() {
      try {
        const res = await fetch(`/api/patient/search?query=${this.form.full_name}`, {
          headers: { "Authentication-Token": this.token }
        });
        const data = await res.json();

        if (data && data.id) {
          if (confirm(`Patient '${data.full_name}' already exists. Do you want to add casepaper to this profile?`)) {
            this.foundPatient = data;
            this.form.age = data.age;
            this.form.sex = data.sex;
          } else {
            this.foundPatient = null;
          }
        } else {
          alert("No matching patient found. A new one will be created upon saving.");
          this.foundPatient = null;
        }
      } catch (error) {
        console.error("Search error:", error);
      }
    },

    async handleSubmit() {
      try {
        let patientId;

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
              age: this.form.age,
              sex: this.form.sex
            })
          });
          const newPatient = await res.json();
          patientId = newPatient.id;
        }

        await fetch("/api/casepaper", {
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

        alert("Casepaper saved successfully!");
        this.form = { full_name: '', age: '', sex: '', symptoms: '', diagnosis: '', prescription: '' };
        this.foundPatient = null;
        await this.fetchpatients();
      } catch (error) {
        console.error("Error saving casepaper:", error);
        alert("An error occurred. Please try again.");
      }
    }
  }
}
