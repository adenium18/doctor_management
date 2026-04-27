export default {
  template: `
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">Register New Doctor</h4>
        <p class="text-muted small mb-0">Create a doctor account and profile</p>
      </div>
      <router-link to="/admin" class="btn btn-outline-secondary btn-sm">&larr; Back</router-link>
    </div>

    <div class="card" style="max-width:560px">
      <div class="card-body">
        <div v-if="success" class="alert alert-success">
          Doctor <strong>{{ success }}</strong> registered successfully!
        </div>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>

        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label">Full Name <span class="text-danger">*</span></label>
            <input v-model="form.full_name" class="form-control" required placeholder="Dr. John Doe" />
          </div>
          <div class="mb-3">
            <label class="form-label">Email <span class="text-danger">*</span></label>
            <input v-model="form.email" type="email" class="form-control" required placeholder="doctor@clinic.com" />
          </div>
          <div class="mb-3">
            <label class="form-label">Password <span class="text-danger">*</span></label>
            <input v-model="form.password" type="password" class="form-control" required
              placeholder="Min 4 characters" minlength="4" />
          </div>
          <div class="mb-3">
            <label class="form-label">Degree <span class="text-danger">*</span></label>
            <input v-model="form.degree" class="form-control" required placeholder="MBBS, MD, BDS..." />
          </div>
          <div class="mb-4">
            <label class="form-label">Clinic Address</label>
            <input v-model="form.address" class="form-control" placeholder="Optional" />
          </div>
          <button type="submit" class="btn btn-primary w-100" :disabled="saving">
            {{ saving ? 'Registering...' : 'Register Doctor' }}
          </button>
        </form>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      token:  localStorage.getItem("auth-token"),
      saving: false,
      error:  null,
      success:null,
      form: { full_name: "", email: "", password: "", degree: "", address: "" }
    };
  },

  methods: {
    async submit() {
      this.error   = null;
      this.success = null;
      this.saving  = true;
      try {
        const res  = await fetch("/api/doctors", {
          method:  "POST",
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
          body:    JSON.stringify(this.form)
        });
        const data = await res.json();
        if (res.ok) {
          this.success = this.form.full_name;
          this.form    = { full_name: "", email: "", password: "", degree: "", address: "" };
        } else {
          this.error = data.message || data.error || "Registration failed.";
        }
      } catch (err) {
        this.error = "Network error. Please try again.";
      } finally {
        this.saving = false;
      }
    }
  }
};
