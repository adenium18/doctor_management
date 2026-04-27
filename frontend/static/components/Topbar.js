export default {
  name: "Topbar",
  props: ["collapsed"],

  template: `
  <div class="topbar">
    <button class="topbar-toggle" @click="$emit('toggle')" title="Toggle Sidebar">
      &#9776;
    </button>

    <div class="topbar-title">{{ pageTitle }}</div>

    <div class="ms-auto d-flex align-items-center gap-3">
      <span class="topbar-date d-none d-md-inline">{{ today }}</span>
      <div class="topbar-user">
        <div class="topbar-avatar">{{ initials }}</div>
        <span class="topbar-name d-none d-lg-inline">{{ fullName }}</span>
      </div>
    </div>
  </div>
  `,

  computed: {
    fullName() {
      return localStorage.getItem("full_name") || "Doctor";
    },
    initials() {
      return this.fullName
        .split(" ")
        .map(w => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    },
    pageTitle() {
      const titles = {
        "/":                  "New Casepaper",
        "/dashboard":         "Dashboard",
        "/patients":          "Patients",
        "/casepapers":        "Casepapers",
        "/billing":           "Billing",
        "/expenses":          "Expense Tracker",
        "/reports":           "Reports",
        "/finance":           "Finance Dashboard",
        "/profit-loss":       "Profit & Loss",
        "/admin":             "Admin Panel",
        "/doctor-signup":     "Register Doctor",
        "/all_complaints":    "All Casepapers",
        "/patient_history":   "Patient History",
        "/search-for-doctor": "Search",
      };
      return titles[this.$route?.path] || "Dr. A-to-Z";
    },
    today() {
      return new Date().toLocaleDateString("en-IN", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric"
      });
    }
  }
};
