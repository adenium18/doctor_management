export default {
    template: `
    <div>
        <h2 class="text-center">Available Services</h2>

        <!--Add Service Button -->
        <div class="text-center mb-3">
            <button class="btn btn-outline-success" @click="goToCreateService">+ Add New Service</button>
        </div>

        <!--services List -->
        <div class="table-responsive" v-if="services.length">
            <table class="table table-striped table-hover text-center">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Price (₹)</th>
                        <th>Time Required</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="service in services" :key="service.id">
                        <td>{{ service.id }}</td>
                        <td>{{ service.name }}</td>
                        <td>{{ service.price }}</td>
                        <td>{{ service.time_required }}</td>
                        <td>{{ service.description }}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm" @click="updateService(service.id)"> Edit</button>
                            <button class="btn btn-danger btn-sm" @click="deleteService(service.id)"> Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="text-center text-danger">
            No services available.
        </div>

    

    </div>
    `,
    data() {
        return {
            services: [],
            searchQuery: '',
            searchType: 'professionals',
            searchResults: [],
            token: localStorage.getItem("auth-token")
        };
    },
    methods: {
        async fetchServices() {
            try {
                const res = await fetch("/api/services", {
                    headers: { "Authentication-Token": this.token }
                });
                if (res.ok) {
                    this.services = await res.json();
                } else {
                    console.error("Failed to fetch services");
                }
            } catch (error) {
                console.error("Error fetching services:", error);
            }
        },

        // ✅ Navigate to the "Create Service" Page
        goToCreateService() {
            this.$router.push("/create-service");
        },

        // ✅ Navigate to the "Update Service" Page
        updateService(serviceId) {
            localStorage.setItem("update_service_id", serviceId);
            this.$router.push("/update-service");
        },

        // ✅ Delete a Service
        async deleteService(serviceId) {
            if (!confirm("Are you sure you want to delete this service?")) return;

            try {
                const res = await fetch(`/delete/service/${serviceId}`, {
                    method: "DELETE",
                    headers: { "Authentication-Token": this.token }
                });

                if (res.ok) {
                    alert("Service deleted successfully!");
                    this.fetchServices(); // Refresh list
                } else {
                    console.error("Service Request exists! Failed to delete service");
                    alert("Sorry! this service is requested by customer");
                }
            } catch (error) {
                console.error("Error deleting service:", error);
            }
        },

        
        

       
    },
    async mounted() {
        this.fetchServices();
    }
};