
export default {
    template: `
    <div class="text-center">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col">
                    <h2 class="text-center">Service Requests</h2>
                </div>
            </div>
            <div class="row justify-content-end">
                <div class="col text-end">
                    <button class="btn btn-light" @click='download_csv'>Export as CSV</button>
                    <button class="btn btn-dark" @click="create_csv">get All-Service-Requests data </button>
                    <span v-if='isWaiting'> Exporting... </span>
                </div>
            </div>
        </div>
        <br>
        <div class="card text-center mx-auto" style="width: 77rem;">
            <div class="card-header">
                <div class="container text-center">
                    <div class="row row-cols-1 row-cols-sm-2 row-cols-md-4">
                        <div class="col">ID</div>
                        <div class="col">Customer Name</div>
                        <div class="col">Service Name</div>
                        <div class="col">User specific Requirements</div>
                        <div class="col">Professional Name</div>
                        <div class="col">Date & Time of Request</div>
                        <div class="col">Status</div>
                        <div class="col">Date of Completion</div>
                        <div class="col">Rating</div>
                        <div class="col">Remarks</div>

                    </div>
                </div>
            </div>
        </div>
        <div class="card text-center mx-auto" style="width: 77rem;">
            <ul class="list-group list-group-flush">
                <li class="list-group-item" v-for="(service_request, index) in allServiceRequests" :key="index">
                    <div class="container text-center">
                        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-4">
                            <div class="col">{{ index+1}}</div>
                            <div class="col">{{ service_request.customer_name }}</div>
                            <div class="col">{{ getServiceName(service_request.service_id) }}</div>
                            <div class="col">{{ service_request.user_req}}</div>
                            <div class="col">{{ service_request.professional_name}}</div>

                            <div class="col">{{ formatDateTime(service_request.date_of_request) }}</div>
                            <div class="col" :class="getStatusClass(service_request.service_status)">{{ service_request.service_status }}</div>
                            <div class="col">{{formatDateTime(service_request.date_of_completion)}}</div>
                            <div class="col">{{service_request.rating}}</div>
                            <div class="col">{{service_request.remarks}}</div>
                        
                            </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
    `,
    data() {
        return {
            token: localStorage.getItem('auth-token'),
            allServiceRequests: [],
            allServices: [],
            error: null,
            user: {},
            services: [],
            isWaiting: false
        };
    },
    methods: {
        async fetchUser() {
            try {
                const res = await fetch("/user-details", {
                    headers: { "Authentication-Token": this.token }
                });
                const data = await res.json();
                if (res.ok) this.user = data;
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        },
        
        async fetchServices() {
            try {
                const res = await fetch("/api/services", {
                    headers: { "Authentication-Token": this.token }
                });
                const data = await res.json();
                if (res.ok) {
                    this.allServices = data;
                } else {
                    console.error("Failed to fetch services:", data.message);
                }
            } catch (error) {
                console.error("Error fetching services:", error);
            }
        },
        
        async fetchServiceRequests() {
            try {
                const res = await fetch('/api/request/services', 
                    {method: "GET",
                    headers: {
                        
                        "Content-Type": "application/json",
                        'Authentication-Token': this.token
                    }
                });
        
                const data = await res.json();
                console.log("Fetched Service Requests:", data);


                if (res.ok) {
                    this.allServiceRequests = data.service_requests;
                    this.allServices = data.services;
                } else {
                    console.error("Failed to fetch service requests:", data.message);
                }
            } catch (error) {
                console.error("Error fetching service requests:", error);
            }
        },
        
    
        async download_csv() {
            this.isWaiting = true;
            try {
                const res = await fetch("/download-csv", {
                    headers: { "Authentication-Token": this.token }
                });
        
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || "Failed to export CSV");
                }
        
                //  Convert response to a downloadable file
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "service_requests.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (error) {
                console.error("🔥 CSV export error:", error);
                alert("Failed to export CSV: " + error.message);
            } finally {
                this.isWaiting = false;
            }
        },
        
        async create_csv(){
            const res = await fetch('http://127.0.0.1:5000'+ '/create_csv', {
                headers : {
                    'Authentication-Token' : this.$store.state.auth_token
                }
            })
            const task_id = (await res.json()).task_id

            const interval = setInterval(async() => {
                const res = await fetch(`${'http://127.0.0.1:5000'}/get_csv/${task_id}` )
                if (res.ok){
                    console.log('data is ready')
                    window.open(`${location.origin}/get_csv/${task_id}`)
                    clearInterval(interval)
                }

            }, 100)
            
        },
    
        getServiceName(serviceId) {
            const service = this.allServices.find(svc => svc.id === serviceId);
            return service ? service.name : "Unknown";
        },
    
        getStatusClass(status) {
            switch (status) {
                case 'rejected': return 'text-danger'; 
                case 'closed': return 'text-success'; 
                case 'completed': return 'text-primary';
                case 'requested': return 'text-secondary'; 
                default: return 'text-secondary';
            }
        },

        formatDateTime(dateTime) {
            if (!dateTime) return "N/A";
            const date = new Date(dateTime);
            return date.toLocaleString();
        },
        
        
    },
    async mounted() {
            await this.fetchUser();
            await this.fetchServices();
            await this.fetchServiceRequests();
        }
    }
        