export default {
    template: `
    <div class="login-wrapper">
        <div class="login-card" style="width:460px">
            <div class="login-logo">🏥</div>
            <h2 class="text-center">Dr. A-to-Z</h2>
            <p class="text-center text-muted mb-4" style="font-size:13px">Set a new password</p>

            <div class="alert alert-danger py-2 mb-3"  v-if="error">{{ error }}</div>
            <div class="alert alert-success py-2 mb-3" v-if="success">
                {{ success }}
                <br><a href="#" class="fw-semibold" @click.prevent="$router.push('/user-login')">Click here to sign in &rarr;</a>
            </div>

            <div v-if="invalidToken" class="text-center">
                <p class="text-danger fw-semibold">This reset link is invalid or has expired.</p>
                <a href="#" class="btn btn-outline-primary btn-sm"
                    @click.prevent="$router.push('/user-login')">Back to Sign In</a>
            </div>

            <form @submit.prevent="submit" v-if="!success && !invalidToken">
                <div class="mb-3">
                    <label class="form-label fw-semibold">New Password</label>
                    <div class="input-group">
                        <input :type="showPw ? 'text' : 'password'"
                            class="form-control"
                            v-model="password"
                            placeholder="Min. 4 characters"
                            required minlength="4" />
                        <button type="button" class="btn btn-outline-secondary"
                            @click="showPw = !showPw" tabindex="-1">
                            {{ showPw ? '🙈' : '👁️' }}
                        </button>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="form-label fw-semibold">Confirm Password</label>
                    <input type="password" class="form-control"
                        v-model="confirm"
                        placeholder="Re-enter password"
                        required />
                    <div class="text-danger small mt-1"
                        v-if="confirm && password !== confirm">
                        Passwords do not match.
                    </div>
                </div>
                <button class="btn btn-primary w-100" type="submit"
                    :disabled="loading || (confirm && password !== confirm)"
                    style="padding:10px; font-size:15px">
                    {{ loading ? 'Resetting...' : 'Reset Password' }}
                </button>
            </form>

            <p class="text-center text-muted mt-4 mb-0" style="font-size:12px" v-if="!success">
                <a href="#" class="text-primary text-decoration-none fw-semibold"
                    @click.prevent="$router.push('/user-login')">&larr; Back to Sign In</a>
            </p>
        </div>
    </div>
    `,

    data() {
        return {
            password:     "",
            confirm:      "",
            showPw:       false,
            loading:      false,
            error:        null,
            success:      null,
            invalidToken: false
        };
    },

    methods: {
        async submit() {
            if (this.password !== this.confirm) return;
            this.error   = null;
            this.loading = true;
            const token  = this.$route.params.token;
            try {
                const res  = await fetch(`/api/auth/reset-password/${token}`, {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({ password: this.password })
                });
                const data = await res.json();
                if (res.ok) {
                    this.success = data.message;
                } else if (res.status === 400) {
                    this.invalidToken = true;
                } else {
                    this.error = data.error || "Something went wrong.";
                }
            } catch {
                this.error = "Server error. Please try again.";
            } finally {
                this.loading = false;
            }
        }
    }
};
