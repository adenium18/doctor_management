import Home from "./components/Home.js";
import Login from "./components/Login.js";
import appinfo from "./components/appinfo.js"
import AdminHome from "./components/AdminHome.js";
import AllComplaints from "./components/AllComplaints.js";
import PatientProfile from "./components/PatientProfile.js";
import PatientHistory from "./components/PatientHistory.js";
//import CustomerSignup from "./components/CustomerSignup.js";
//import ServiceProfessionalSignup from "./components/ServiceProfessionalSignup.js";
//import Users from "./components/Users.js";
//import ServiceForm from "./components/ServiceForm.js";
//import UpdatePatinet from "./components/UpdateServiceForm.js";





const routes = [
    { path: "/", component: Home, meta: { requiresAuth: true } },
    { path: "/app_info", component:appinfo},
    { path: "/user-login", component: Login },
    { path: "/customer-signup", component: CustomerSignup },
    { path: '/create-service', component: ServiceForm },
    { path: '/service-remarks', component:ServiceRemarks},
    { path: "/customer-profile", component: CustomerProfile, meta: { requiresAuth: true, customerOnly: true } },
    { path: "/service-history", component: ServiceHistory, meta: { requiresAuth: true, customerOnly: true } },
    { path: '/search-for-customer', component : SearchResultsforCustomer},
    
    

    { path: "/professional-profile", component: ProfessionalProfile, meta: { requiresAuth: true, professionalOnly: true } },
    { path: "/professional-home", component: ProfessionalHome, meta: { requiresAuth: true, professionalOnly: true } },
    { path: '/search-for-prof', component : SearchResultsforProf},
    
    // ✅ Admin-only Service Management Routes
    { path: "/manage-services", component: AdminHome, meta: { requiresAuth: true, adminOnly: true } },
    { path: "/update-service", component: UpdateServiceForm, meta: { requiresAuth: true, adminOnly: true } },
    { path: "/all-service-request", component: AllServiceRequest, meta: { requiresAuth: true, adminOnly: true } },
    { path: "/users", component: Users, meta: { requiresAuth: true, adminOnly: true } },
    { path: '/search', component: SearchResults },
    { path: '/service-summary', component: Statistical_summary, props: true }

    
   
    
];

const router = new VueRouter({
    mode: "history",
    routes
});

// ✅ Protect routes based on authentication & roles
router.beforeEach((to, from, next) => {
    const role = localStorage.getItem("role");
    const isAuthenticated = localStorage.getItem("auth-token");

    if (to.meta.requiresAuth && !isAuthenticated) {
        next("/app_info");
    } else if (to.meta.adminOnly && role !== "admin") {
        next("/");
    } else if (to.meta.customerOnly && role !== "customer") {
        next("/");
    } else if (to.meta.professionalOnly && role !== "professional") {
        next("/");
    } else {
        next();
    }
});

export default router;