export default {
  template: `
  <div style="max-width:640px">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">My Profile</h4>
        <p class="text-muted small mb-0">Update your doctor profile and password</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else>
      <!-- Profile Card -->
      <div class="card mb-4">
        <div class="card-body">
          <h6 class="fw-semibold mb-3">Profile Information</h6>
          <div v-if="profileMsg" class="alert" :class="profileError ? 'alert-danger' : 'alert-success'">
            {{ profileMsg }}
          </div>
          <form @submit.prevent="saveProfile">
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input :value="profile.email" class="form-control" readonly disabled />
            </div>
            <div class="mb-3">
              <label class="form-label">Full Name <span class="text-danger">*</span></label>
              <input v-model="profile.full_name" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Degree</label>
              <input v-model="profile.degree" class="form-control" placeholder="MBBS, MD..." />
            </div>
            <div class="mb-4">
              <label class="form-label">Clinic Address</label>
              <input v-model="profile.address" class="form-control" />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="savingProfile">
              {{ savingProfile ? 'Saving...' : 'Save Profile' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Change Password Card -->
      <div class="card">
        <div class="card-body">
          <h6 class="fw-semibold mb-3">Change Password</h6>
          <div v-if="pwMsg" class="alert" :class="pwError ? 'alert-danger' : 'alert-success'">
            {{ pwMsg }}
          </div>
          <form @submit.prevent="changePassword">
            <div class="mb-3">
              <label class="form-label">Current Password <span class="text-danger">*</span></label>
              <input v-model="pw.current" type="password" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">New Password <span class="text-danger">*</span></label>
              <input v-model="pw.newPw" type="password" class="form-control" required minlength="4" />
            </div>
            <div class="mb-4">
              <label class="form-label">Confirm New Password <span class="text-danger">*</span></label>
              <input v-model="pw.confirm" type="password" class="form-control" required />
              <div v-if="pw.confirm && pw.newPw !== pw.confirm" class="text-danger small mt-1">
                Passwords do not match.
              </div>
            </div>
            <button type="submit" class="btn btn-warning"
              :disabled="savingPw || (pw.confirm && pw.newPw !== pw.confirm)">
              {{ savingPw ? 'Changing...' : 'Change Password' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      token:        localStorage.getItem("auth-token"),
      loading:      true,
      profile:      { full_name: "", degree: "", address: "", email: "" },
      savingProfile:false,
      profileMsg:   null,
      profileError: false,
      pw:           { current: "", newPw: "", confirm: "" },
      savingPw:     false,
      pwMsg:        null,
      pwError:      false
    };
  },

  methods: {
    async loadProfile() {
      try {
        const res = await fetch("/api/doctor/profile", {
          headers: { "Authentication-Token": this.token }
        });
        if (res.ok) this.profile = await res.json();
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        this.loading = false;
      }
    },

    async saveProfile() {
      this.profileMsg   = null;
      this.profileError = false;
      this.savingProfile = true;
      try {
        const res  = await fetch("/api/doctor/profile", {
          method:  "PUT",
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
          body:    JSON.stringify(this.profile)
        });
        const data = await res.json();
        if (res.ok) {
          this.profileMsg = "Profile updated successfully!";
          localStorage.setItem("full_name", this.profile.full_name);
        } else {
          this.profileError = true;
          this.profileMsg   = data.error || "Failed to update profile.";
        }
      } catch (err) {
        this.profileError = true;
        this.profileMsg   = "Network error. Please try again.";
      } finally {
        this.savingProfile = false;
      }
    },

    async changePassword() {
      if (this.pw.newPw !== this.pw.confirm) return;
      this.pwMsg   = null;
      this.pwError = false;
      this.savingPw = true;
      try {
        const res  = await fetch("/api/auth/change-password", {
          method:  "POST",
          headers: { "Content-Type": "application/json", "Authentication-Token": this.token },
          body:    JSON.stringify({ current_password: this.pw.current, new_password: this.pw.newPw })
        });
        const data = await res.json();
        if (res.ok) {
          this.pwMsg = "Password changed! Please log in again.";
          this.pw    = { current: "", newPw: "", confirm: "" };
          setTimeout(() => {
            this.$store.commit("logout");
            this.$router.push("/user-login");
          }, 2000);
        } else {
          this.pwError = true;
          this.pwMsg   = data.error || "Failed to change password.";
        }
      } catch (err) {
        this.pwError = true;
        this.pwMsg   = "Network error. Please try again.";
      } finally {
        this.savingPw = false;
      }
    }
  },

  mounted() { this.loadProfile(); }
};
