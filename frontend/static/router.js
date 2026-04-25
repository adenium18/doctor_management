import Home                from "./components/Home.js";
import Login               from "./components/Login.js";
import appinfo             from "./components/appinfo.js";
import AdminHome           from "./components/AdminHome.js";
import AllComplaints       from "./components/AllComplaints.js";
import SearchDoctorResults from "./components/SearchDoctorResults.js";
import PatientHistory      from "./components/PatientHistory.js";
import DoctorSignup        from "./components/DoctorSignup.js";
import Patients            from "./components/Patients.js";
import Casepaper           from "./components/Casepaper.js";
import Dashboard           from "./components/Dashboard.js";
import Billing             from "./components/Billing.js";
import ExpenseTracker      from "./components/ExpenseTracker.js";
import Reports             from "./components/Reports.js";

const routes = [
    // Public
    { path: "/app_info",   component: appinfo },
    {
        path: "/user-login",
        component: Login,
        meta: { guestOnly: true }  // ✅ logged-in users should not see login page
    },

    // Doctor routes
    { path: "/",                   component: Home,                meta: { requiresAuth: true, doctorOnly: true } },
    { path: "/dashboard",          component: Dashboard,           meta: { requiresAuth: true, doctorOnly: true } },
    { path: "/patients",           component: Patients,            meta: { requiresAuth: true, doctorOnly: true } },
    { path: "/casepapers",         component: Casepaper,           meta: { requiresAuth: true, doctorOnly: true } },
    { path: "/billing",            component: Billing,             meta: { requiresAuth: true, doctorOnly: true } },
    { path: "/expenses",           component: ExpenseTracker,      meta: { requiresAuth: true, doctorOnly: true } },
    { path: "/reports",            component: Reports,             meta: { requiresAuth: true, doctorOnly: true } },
    { path: "/patient_history",    component: PatientHistory,      meta: { requiresAuth: true, doctorOnly: true } },
    { path: "/search-for-doctor",  component: SearchDoctorResults, meta: { requiresAuth: true, doctorOnly: true } },

    // Admin routes
    { path: "/admin",          component: AdminHome,    meta: { requiresAuth: true, adminOnly: true } },
    { path: "/doctor-signup",  component: DoctorSignup, meta: { requiresAuth: true, adminOnly: true } },
    { path: "/all_complaints", component: AllComplaints,meta: { requiresAuth: true } },
];

const router = new VueRouter({ mode: "history", routes });

router.beforeEach((to, from, next) => {
    const role            = localStorage.getItem("role");
    const isAuthenticated = !!localStorage.getItem("auth-token");

    // ✅ If already logged in and trying to visit login/guest page — redirect home
    if (to.meta.guestOnly && isAuthenticated) {
        next("/");
        return;
    }

    // Not logged in trying to access protected route
    if (to.meta.requiresAuth && !isAuthenticated) {
        next("/user-login");   // ✅ send to login not app_info
        return;
    }

    // Wrong role guards
    if (to.meta.adminOnly && role !== "admin") {
        next("/");
        return;
    }

    if (to.meta.doctorOnly && role !== "doctor") {
        next("/");
        return;
    }

    next();
});

export default router;