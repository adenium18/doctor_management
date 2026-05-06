export default {
    template: `
    <div class="login-wrapper">
        <div class="login-card" style="width:460px">

            <!-- Logo & App Name -->
            <div class="login-logo">🏥</div>
            <h2 class="text-center">Dr. A-to-Z</h2>
            <p class="text-center text-muted mb-4" style="font-size:13px">
                Clinic Management System
            </p>

            <!-- Tab switcher -->
            <div class="d-flex mb-4" style="border-bottom:2px solid #e2e8f0">
                <button
                    class="flex-fill pb-2 border-0 bg-transparent fw-semibold"
                    :style="tab === 'login'
                        ? 'color:#2563eb; border-bottom:2px solid #2563eb; margin-bottom:-2px'
                        : 'color:#94a3b8'"
                    @click="switchTab('login')">
                    Sign In
                </button>
                <button
                    class="flex-fill pb-2 border-0 bg-transparent fw-semibold"
                    :style="tab === 'register'
                        ? 'color:#2563eb; border-bottom:2px solid #2563eb; margin-bottom:-2px'
                        : 'color:#94a3b8'"
                    @click="switchTab('register')">
                    Register as Doctor
                </button>
            </div>

            <!-- ───────── SIGN IN ───────── -->
            <div v-if="tab === 'login'">
                <div class="alert alert-danger py-2 mb-3" v-if="loginError">{{ loginError }}</div>

                <form @submit.prevent="login">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Email</label>
                        <input type="email" class="form-control"
                            v-model="cred.email"
                            placeholder="doctor@clinic.com"
                            required autofocus />
                    </div>
                    <div class="mb-4">
                        <label class="form-label fw-semibold">Password</label>
                        <div class="input-group">
                            <input :type="showLoginPw ? 'text' : 'password'"
                                class="form-control"
                                v-model="cred.password"
                                placeholder="••••••••"
                                required />
                            <button type="button" class="btn btn-outline-secondary"
                                @click="showLoginPw = !showLoginPw"
                                tabindex="-1">
                                {{ showLoginPw ? '🙈' : '👁️' }}
                            </button>
                        </div>
                    </div>
                    <button class="btn btn-primary w-100" type="submit"
                        :disabled="loginLoading"
                        style="padding:10px; font-size:15px">
                        {{ loginLoading ? 'Signing in...' : 'Sign In' }}
                    </button>
                </form>

                <div class="text-center mt-3">
                    <a href="#" class="text-muted text-decoration-none" style="font-size:13px"
                        @click.prevent="switchTab('forgot')">Forgot password?</a>
                </div>
                <p class="text-center text-muted mt-3 mb-0" style="font-size:12px">
                    New to Dr. A-to-Z?
                    <a href="#" class="text-primary text-decoration-none fw-semibold"
                        @click.prevent="switchTab('register')">Create an account</a>
                </p>
            </div>

            <!-- ───────── FORGOT PASSWORD ───────── -->
            <div v-if="tab === 'forgot'">
                <h5 class="fw-semibold mb-1">Reset Password</h5>
                <p class="text-muted mb-3" style="font-size:13px">Enter your email and we'll send a reset link.</p>

                <div class="alert alert-danger py-2 mb-3"   v-if="forgotError">{{ forgotError }}</div>
                <div class="alert alert-success py-2 mb-3"  v-if="forgotSuccess">{{ forgotSuccess }}</div>

                <form @submit.prevent="sendForgot" v-if="!forgotSuccess">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Email</label>
                        <input type="email" class="form-control"
                            v-model="forgotEmail"
                            placeholder="doctor@clinic.com"
                            required autofocus />
                    </div>
                    <button class="btn btn-primary w-100" type="submit"
                        :disabled="forgotLoading"
                        style="padding:10px; font-size:15px">
                        {{ forgotLoading ? 'Sending...' : 'Send Reset Link' }}
                    </button>
                </form>

                <p class="text-center text-muted mt-4 mb-0" style="font-size:12px">
                    <a href="#" class="text-primary text-decoration-none fw-semibold"
                        @click.prevent="switchTab('login')">&larr; Back to Sign In</a>
                </p>
            </div>

            <!-- ───────── SIGN UP ───────── -->
            <div v-if="tab === 'register'">
                <div class="alert alert-danger  py-2 mb-3" v-if="regError">{{ regError }}</div>
                <div class="alert alert-success py-2 mb-3" v-if="regSuccess">
                    {{ regSuccess }}
                    <br><a href="#" class="fw-semibold" @click.prevent="switchTab('login')">Click here to sign in &rarr;</a>
                </div>

                <form @submit.prevent="register" v-if="!regSuccess">
                    <div class="row g-3 mb-3">
                        <div class="col-12">
                            <label class="form-label fw-semibold">Full Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control"
                                v-model="reg.full_name"
                                placeholder="Dr. Priya Sharma"
                                required />
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Email <span class="text-danger">*</span></label>
                            <input type="email" class="form-control"
                                v-model="reg.email"
                                placeholder="priya@clinic.com"
                                required />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Degree</label>
                            <input type="text" class="form-control"
                                v-model="reg.degree"
                                placeholder="MBBS, MD..." />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Clinic Address</label>
                            <input type="text" class="form-control"
                                v-model="reg.address"
                                placeholder="City, State" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Password <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <input :type="showRegPw ? 'text' : 'password'"
                                    class="form-control"
                                    v-model="reg.password"
                                    placeholder="Min. 4 characters"
                                    required minlength="4" />
                                <button type="button" class="btn btn-outline-secondary"
                                    @click="showRegPw = !showRegPw"
                                    tabindex="-1">
                                    {{ showRegPw ? '🙈' : '👁️' }}
                                </button>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Confirm Password <span class="text-danger">*</span></label>
                            <input type="password" class="form-control"
                                v-model="reg.confirm"
                                placeholder="Re-enter password"
                                required />
                            <div class="text-danger small mt-1"
                                v-if="reg.confirm && reg.password !== reg.confirm">
                                Passwords do not match.
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-success w-100" type="submit"
                        :disabled="regLoading || (reg.confirm && reg.password !== reg.confirm)"
                        style="padding:10px; font-size:15px">
                        {{ regLoading ? 'Creating account...' : 'Create Account' }}
                    </button>
                </form>

                <p class="text-center text-muted mt-4 mb-0" style="font-size:12px">
                    Already have an account?
                    <a href="#" class="text-primary text-decoration-none fw-semibold"
                        @click.prevent="switchTab('login')">Sign in</a>
                </p>
            </div>

        </div>
    </div>
    `,

    data() {
        return {
            tab: "login",

            // sign in
            cred:        { email: "", password: "" },
            loginError:  null,
            loginLoading:false,
            showLoginPw: false,

            // sign up
            reg: { full_name: "", email: "", password: "", confirm: "", degree: "", address: "" },
            regError:   null,
            regSuccess: null,
            regLoading: false,
            showRegPw:  false,

            // forgot password
            forgotEmail:   "",
            forgotError:   null,
            forgotSuccess: null,
            forgotLoading: false
        };
    },

    methods: {
        switchTab(t) {
            this.tab          = t;
            this.loginError   = null;
            this.regError     = null;
            this.regSuccess   = null;
            this.forgotError  = null;
            this.forgotSuccess= null;
        },

        async login() {
            this.loginError   = null;
            this.loginLoading = true;
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
                    this.loginError = data.message || "Invalid credentials";
                }
            } catch {
                this.loginError = "Server error. Please try again.";
            } finally {
                this.loginLoading = false;
            }
        },

        async sendForgot() {
            this.forgotError   = null;
            this.forgotSuccess = null;
            this.forgotLoading = true;
            try {
                const res  = await fetch("/api/auth/forgot-password", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({ email: this.forgotEmail.trim().toLowerCase() })
                });
                const data = await res.json();
                if (res.ok) {
                    this.forgotSuccess = data.message;
                } else {
                    this.forgotError = data.error || "Something went wrong.";
                }
            } catch {
                this.forgotError = "Server error. Please try again.";
            } finally {
                this.forgotLoading = false;
            }
        },

        async register() {
            if (this.reg.password !== this.reg.confirm) return;
            this.regError   = null;
            this.regSuccess = null;
            this.regLoading = true;
            try {
                const res  = await fetch("/api/auth/doctor-register", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({
                        full_name: this.reg.full_name.trim(),
                        email:     this.reg.email.trim().toLowerCase(),
                        password:  this.reg.password,
                        degree:    this.reg.degree.trim(),
                        address:   this.reg.address.trim()
                    })
                });
                const data = await res.json();

                if (res.ok) {
                    this.regSuccess = data.message;
                    this.reg = { full_name:"", email:"", password:"", confirm:"", degree:"", address:"" };
                } else {
                    this.regError = data.error || "Registration failed. Please try again.";
                }
            } catch {
                this.regError = "Server error. Please try again.";
            } finally {
                this.regLoading = false;
            }
        }
    }
};
