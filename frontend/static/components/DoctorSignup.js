export default {
	template: `
	<div class="d-flex justify-content-center align-items-center vh-100" style="margin-top: 25vh">
		<div class="card shadow-lg p-3 mb-5 bg-white rounded" style="width: 40rem;">    
			<h2 class="card-title text-center">NEW DOCTOR ?</h2>
			<div class="text-danger text-center">{{ error }}</div>
			<form @submit.prevent="register">
				<div class="mb-3">
					<label for="user-email" class="form-label">Email:</label>
					<input type="email" class="form-control" id="user-email" v-model="cred.email" required>
				</div>
				<div class="mb-3">
					<label for="user-password" class="form-label">Password:</label>
					<input type="password" class="form-control" id="user-password" v-model="cred.password" required>
				</div>
				<div class="mb-3">
					<label for="user-confirm-password" class="form-label">Confirm Password:</label>
					<input type="password" class="form-control" id="user-confirm-password" v-model="cred.confirm_password" required>
				</div>
				<div class="mb-3">
					<label for="user-fullname" class="form-label">Full Name:</label>
					<input type="text" class="form-control" id="user-fullname" v-model="cred.full_name" required>
				</div>
				<div class="mb-3">
					<label for="user-address" class="form-label">Address:</label>
					<input type="text" class="form-control" id="user-address" v-model="cred.address" required>
				</div>
				<div class="mb-3">
					<label for="user-degree" class="form-label">Degree:</label>
					<input type="text" class="form-control" id="user-degree" v-model="cred.degree" required>
				</div>
				<div class="text-center">
					<button type="submit" class="btn btn-outline-primary mt-2">Register</button>
				</div>
			</form>
			<div class="mt-3 text-center">
				<router-link class="nav-link" to="/user-login">Already have an account? Login</router-link>
			</div>
		</div>
	</div>
	`,
	data() {
		return {
			cred: {
				email: "",
				password: "",
				confirm_password: "",
				full_name: "",
				address: "",
				degree: "",
			},
			error: null,
		};
	},
	methods: {
		async register() {
			if (this.cred.password !== this.cred.confirm_password) {
				this.error = "Passwords do not match";
				return;
			}
			try {
				const res = await fetch("/api/doctors", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(this.cred),
				});
				const data = await res.json();
				if (res.ok) {
					alert("Registration successful! Please login.");
					this.$router.push("/user-login");
				} else {
					this.error = data.message;
				}
			} catch (error) {
				this.error = "Server error. Please try again later.";
			}
		},
	},
};