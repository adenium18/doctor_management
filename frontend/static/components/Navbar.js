export default {
    template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <a class="navbar-brand text-primary fw-bold" href="/">Dr. A-to-Z 🏥</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav"
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">

                    <!-- Admin Navigation -->
                    <li class="nav-item" v-if="role === 'admin'">
                        <router-link class="nav-link" to="/admin">Dashboard</router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'admin'">
                        <router-link class="nav-link" to="/doctor-signup">Add Doctor</router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'admin'">
                        <router-link class="nav-link" to="/all_complaints">All Casepapers</router-link>
                    </li>

                    <!-- Doctor Navigation -->
                    <li class="nav-item" v-if="role === 'doctor'">
                        <router-link class="nav-link" to="/">Home</router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'doctor'">
                        <router-link class="nav-link" to="/dashboard">📈 Dashboard</router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'doctor'">
                        <router-link class="nav-link" to="/patients">Patients</router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'doctor'">
                        <router-link class="nav-link" to="/casepapers">Casepapers</router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'doctor'">
                        <router-link class="nav-link" to="/billing">💰 Billing</router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'doctor'">
                        <router-link class="nav-link" to="/expenses">🧾 Expenses</router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'doctor'">
                        <router-link class="nav-link" to="/reports">📊 Reports</router-link>
                    </li>

                    <!-- Doctor Search -->
                    <li class="nav-item" v-if="role === 'doctor'">
                        <form @submit.prevent="handleDoctorSearch" class="d-flex align-items-center ms-2">
                            <input v-model="searchQuery" class="form-control me-2" placeholder="Search..." style="width:160px"/>
                            <select v-model="searchType" class="form-select me-2" style="width:130px">
                                <option value="name">Name</option>
                                <option value="pincode">Pincode</option>
                                <option value="symptoms">Symptoms</option>
                                <option value="diagnosis">Diagnosis</option>
                                <option value="prescription">Prescription</option>
                            </select>
                            <button type="submit" class="btn btn-info btn-sm">Go</button>
                        </form>
                    </li>
                </ul>

                <!-- Auth Controls -->
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item" v-if="!isAuthenticated">
                        <router-link class="nav-link" to="/user-login">Login</router-link>
                    </li>
                    <li class="nav-item" v-if="isAuthenticated">
                        <button class="btn btn-outline-danger btn-sm" @click="logout">Logout</button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `,

    data() {
        return {
            role:            localStorage.getItem("role"),
            isAuthenticated: !!localStorage.getItem("auth-token"),
            searchQuery:     '',
            searchType:      'name'
        };
    },

    methods: {
        logout() {
            this.$store.commit('logout');
            this.$router.push("/user-login");
        },

        handleDoctorSearch() {
            if (!this.searchQuery.trim()) {
                alert("Please enter a search query.");
                return;
            }
            this.$router.push({
                path: '/search-for-doctor',
                query: { type: this.searchType, query: this.searchQuery.trim() }
            });
        }
    }
};