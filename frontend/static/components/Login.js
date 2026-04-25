export default {
    template: `
    <div class="d-flex justify-content-center align-items-center vh-100" style="margin-top: 25vh">
        <div class="card shadow-lg p-3 bg-white rounded" style="width: 28rem;">
            <div class="card-body">
                <h2 class="text-center mb-4">Login</h2>
                <div class="text-danger text-center" v-if="error">{{ error }}</div>
                <form @submit.prevent="login">
                    <div class="mb-3">
                        <label for="user-email" class="form-label">Email:</label>
                        <input type="email" class="form-control" id="user-email" v-model="cred.email" required>
                    </div>
                    <div class="mb-3">
                        <label for="user-password" class="form-label">Password:</label>
                        <input type="password" class="form-control" id="user-password" v-model="cred.password" required>
                    </div>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" type="submit">Login</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            cred:  { email: "", password: "" },
            error: null
        };
    },

    methods: {
        async login() {
            this.error = null;
            try {
                const res  = await fetch("/user-login", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(this.cred)
                });
                const data = await res.json();

                if (res.ok) {
                    // ✅ Store all keys including doctor_id before committing to store
                    localStorage.setItem("auth-token",  data.token);
                    localStorage.setItem("role",        data.role);
                    localStorage.setItem("full_name",   data.full_name);
                    localStorage.setItem("user_id",     data.user_id);
                    localStorage.setItem("doctor_id",   data.doctor_id);  // ✅ store doctor_id separately

                    // Store full user object for store.js setUser()
                    localStorage.setItem("user", JSON.stringify({
                        token:     data.token,
                        role:      data.role,
                        user_id:   data.user_id,
                        doctor_id: data.doctor_id,                        // ✅ include in user object too
                        full_name: data.full_name
                    }));

                    this.$store.commit('setUser');
                    this.$router.push("/");

                } else {
                    this.error = data.message || "Invalid credentials";
                }
            } catch (err) {
                this.error = "Server error. Please try again later.";
            }
        }
    }
};