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
                <div class="mt-3 text-center">
                    <router-link to="/doctor-signup" class="btn btn-link">sign up for New Account</router-link>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            cred: {
                email: "",
                password: ""
            },
            error: null
        };
    },
    methods: {
        async login() {
            try {
                const res = await fetch("/user-login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(this.cred)
                });
                const data = await res.json();
                this.$store.commit('setUser');
                if (res.ok) {
                    localStorage.setItem("auth-token", data.token);
                    localStorage.setItem("role", data.role);
                    localStorage.setItem("full_name", data.full_name);
                    localStorage.setItem("user_id", data.user_id);
                    console.log("Login successful, User ID:", data.user_id);  // ✅ Debugging log

                    // Redirect based on role
                    if (data.role === "admin") {
                        this.$router.push("/");  
                        
                    }
                    else if (data.role === "doctor") {
                        this.$router.push("/");  
                        
                    }

                    
                    
                } else {
                    this.error = data.message || "Invalid credentials";
                }
            } catch (err) {
                this.error = "Server error. Please try again later.";
            }
        },
    }
};