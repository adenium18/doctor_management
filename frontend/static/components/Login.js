export default {
    template: `
    <div class="login-wrapper">
        <div class="login-card">
            <div class="login-logo">🏥</div>
            <h2 class="text-center">Dr. A-to-Z</h2>
            <p class="text-center text-muted mb-4" style="font-size:13px">
                Clinic Management System
            </p>

            <div class="alert alert-danger py-2 mb-3" v-if="error">{{ error }}</div>

            <form @submit.prevent="login">
                <div class="mb-3">
                    <label class="form-label fw-semibold">Email</label>
                    <input
                        type="email"
                        class="form-control"
                        v-model="cred.email"
                        placeholder="doctor@clinic.com"
                        required
                        autofocus
                    >
                </div>
                <div class="mb-4">
                    <label class="form-label fw-semibold">Password</label>
                    <input
                        type="password"
                        class="form-control"
                        v-model="cred.password"
                        placeholder="••••••••"
                        required
                    >
                </div>
                <button
                    class="btn btn-primary w-100"
                    type="submit"
                    :disabled="loading"
                    style="padding: 10px; font-size: 15px"
                >
                    {{ loading ? 'Signing in...' : 'Sign In' }}
                </button>
            </form>

            <p class="text-center text-muted mt-4 mb-0" style="font-size:12px">
                Contact your admin if you need access.
            </p>
        </div>
    </div>
    `,

    data() {
        return {
            cred:    { email: "", password: "" },
            error:   null,
            loading: false
        };
    },

    methods: {
        async login() {
            this.error   = null;
            this.loading = true;
            try {
                const res  = await fetch("/user-login", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(this.cred)
                });
                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem("auth-token",  data.token);
                    localStorage.setItem("role",        data.role);
                    localStorage.setItem("full_name",   data.full_name);
                    localStorage.setItem("user_id",     data.user_id);
                    localStorage.setItem("doctor_id",   data.doctor_id);
                    localStorage.setItem("user", JSON.stringify({
                        token:     data.token,
                        role:      data.role,
                        user_id:   data.user_id,
                        doctor_id: data.doctor_id,
                        full_name: data.full_name
                    }));
                    this.$store.commit("setUser");
                    this.$router.push("/");
                } else {
                    this.error = data.message || "Invalid credentials";
                }
            } catch {
                this.error = "Server error. Please try again.";
            } finally {
                this.loading = false;
            }
        }
    }
};