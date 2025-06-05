export default {
    template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <a class="navbar-brand text-primary" href="/">Household Services AtoZ</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <!-- Admin Navigation -->
                    <li class="nav-item" v-if="role === 'admin'">
                        <router-link class="nav-link" to="/users">Manage Users</router-link>
                    </li>
                    
                    <li class="nav-item" v-if="role === 'admin'">
                        <router-link class="nav-link" to="/manage-services">Manage Services</router-link>
                    </li>

                    <li class="nav-item" v-if="role === 'admin'">
                        <router-link class="nav-link" to="/all-service-request">Service Requests</router-link>
                    </li>

                    <!-- New Service Summary Link -->
                    <li class="nav-item" v-if="role === 'admin'">
                        <router-link class="nav-link" to="/service-summary">Service Summary</router-link>
                    </li>

                    <!-- Search Form -->
                    <li class="nav-item" v-if="role === 'admin'">
                        <form @submit.prevent="onSearch" class="d-flex align-items-center">
                            <input type="text" class="form-control me-2" v-model="searchQuery" placeholder="Search..." aria-label="Search">
                                <select class="form-select me-2" v-model="searchType" required>
                                    <option value="professionals">Professionals</option>
                                    <option value="customers">Customers</option>
                                    <option value="services">Services</option>
                                    <option value="service_requests">Service Requests</option>
                                </select>
                            <button type="submit" class="btn btn-info">Search</button>
                        </form>
                    </li>


                    <!-- Customer Navigation -->
                    
                    <li class="nav-item" v-if="role === 'customer'">
                        <router-link class="nav-link" to="/service-history">Service History</router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'customer'">
                    <form @submit.prevent="onSearchforcustomer" class="d-flex align-items-center">
                        <input type="text"  class="form-control me-2" v-model="searchQuery" placeholder="Search Professionals" />
                        <select class="form-select me-2" v-model="searchType" required>
                            <option value="professionals">Professionals</option>
                            <option value="professionals_pincode">Availability by Pincode</option>
                            <option value="services">Services</option>
                            <option value="service_prof">Professionals Available by Services</option>
                        </select>
                        <button type="submit" class="btn btn-info">Search</button>
                    </form>
                    </li>
                
                    <!-- Professional Navigation -->
                    
                    <li class="nav-item" v-if="role === 'professional'">
                        <router-link class="nav-link" to="/professional-home">Dashboard</router-link>
                    </li>

                    
                    <!-- Search Form for Professionals -->
                    <li class="nav-item" v-if="role === 'professional'">
                        <form @submit.prevent="onSearchforprof" class="d-flex align-items-center">
                            <input type="text"  class="form-control me-2" v-model="searchQuery" placeholder="Search service requests" />
                            <select class="form-select me-2" v-model="searchType" required>
                                <option value="services">Services</option>
                                <option value="service_requests">Service Requests</option>
                                <option value="service_status">Search by Service Status</option>
                            </select>
                            <button type="submit" class="btn btn-info">Search</button>
                        </form>
                    </li>
                </ul>

                <!-- Authentication Controls -->
                <ul class="navbar-nav ml-auto">
                    <li class="nav-item" v-if="!isAuthenticated">
                        <router-link class="nav-link" to="/user-login">Login</router-link>
                    </li>
                    <li class="nav-item" v-if="!isAuthenticated">
                        <router-link class="nav-link" to="/customer-signup">New customer?</router-link>
                    </li>
                    <li class="nav-item" v-if="!isAuthenticated">
                        <router-link class="nav-link" to="/service-professional-signup">New Professional?</router-link>
                    </li>


                    <li class="nav-item" v-if="role === 'professional'">
                        <router-link class="nav-link" to="/professional-profile">
                            <img src="/static/components/images/user.png" width="30" height="30">
                        </router-link>
                    </li>

                    <li class="nav-item" v-if="role === 'customer'">
                        <router-link class="nav-link" to="/customer-profile" >
                            <img src="/static/components/images/user.png" width="30" height="30">
                        </router-link>
                    </li>

                    <li class="nav-item" v-if="isAuthenticated">
                        <button class="btn btn-outline-danger" @click="logout">Logout</button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `,

    data() {
        return {
            role: localStorage.getItem("role"),
            isAuthenticated: localStorage.getItem("auth-token") !== null,
            isActive: localStorage.getItem("active") === "true",
            searchQuery: '',
            searchType: 'professionals'
        };
    },

    methods: {
        logout() {
            localStorage.clear();
            this.$router.push("/user-login");
        },
        
        onSearch() {
            if (!this.searchQuery || !this.searchType) {
                alert("Please enter a search query and select a search type.");
                return;
            }
            
            this.$router.push({
                path: '/search',
                query: {
                    type: this.searchType,
                    query: this.searchQuery
                }
            });
        },

        onSearchforcustomer() {
            if (!this.searchQuery || !this.searchType) {
                alert("Please enter a search query.");
                return;
            }
            
            this.$router.push({
                path: '/search-for-customer',
                query: {
                    type: this.searchType,
                    query: this.searchQuery
                }
            });
        },

        onSearchforprof() {
            if (!this.searchQuery || !this.searchType) {
                alert("Please enter a search query.");
                return;
            }
            
            this.$router.push({
                path: '/search-for-prof',
                query: {
                    type: this.searchType,
                    query: this.searchQuery
                }
            });
        }
    }
};