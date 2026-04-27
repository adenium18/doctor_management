export default {
  name: "Sidebar",
  props: ["collapsed"],
  emits: ["toggle"],

  template: `
  <div class="sidebar" :class="{ collapsed: collapsed }">

    <!-- Brand -->
    <div class="sidebar-brand">
      <span class="brand-icon">🏥</span>
      <span class="brand-text" v-if="!collapsed">Dr. A-to-Z</span>
    </div>

    <hr class="sidebar-divider">

    <!-- Doctor Nav -->
    <nav v-if="role === 'doctor'" class="sidebar-nav">
      <router-link to="/" class="sidebar-link" title="Home">
        <span class="nav-icon">🏠</span>
        <span class="nav-label" v-if="!collapsed">Home</span>
      </router-link>
      <router-link to="/dashboard" class="sidebar-link" title="Dashboard">
        <span class="nav-icon">📈</span>
        <span class="nav-label" v-if="!collapsed">Dashboard</span>
      </router-link>
      <router-link to="/patients" class="sidebar-link" title="Patients">
        <span class="nav-icon">👥</span>
        <span class="nav-label" v-if="!collapsed">Patients</span>
      </router-link>
      <router-link to="/casepapers" class="sidebar-link" title="Casepapers">
        <span class="nav-icon">📋</span>
        <span class="nav-label" v-if="!collapsed">Casepapers</span>
      </router-link>
      <router-link to="/billing" class="sidebar-link" title="Billing">
        <span class="nav-icon">💰</span>
        <span class="nav-label" v-if="!collapsed">Billing</span>
      </router-link>
      <router-link to="/expenses" class="sidebar-link" title="Expenses">
        <span class="nav-icon">🧾</span>
        <span class="nav-label" v-if="!collapsed">Expenses</span>
      </router-link>
      <router-link to="/reports" class="sidebar-link" title="Reports">
        <span class="nav-icon">📊</span>
        <span class="nav-label" v-if="!collapsed">Reports</span>
      </router-link>
      <router-link to="/doctor-profile" class="sidebar-link" title="My Profile">
        <span class="nav-icon">&#128100;</span>
        <span class="nav-label" v-if="!collapsed">My Profile</span>
      </router-link>
      <router-link to="/finance" class="sidebar-link" title="Finance Dashboard">
        <span class="nav-icon">📈</span>
        <span class="nav-label" v-if="!collapsed">Finance</span>
      </router-link>
      <router-link to="/profit-loss" class="sidebar-link" title="P&amp;L Statement">
        <span class="nav-icon">🏦</span>
        <span class="nav-label" v-if="!collapsed">P&amp;L</span>
      </router-link>
    </nav>

    <!-- Admin Nav -->
    <nav v-if="role === 'admin'" class="sidebar-nav">
      <router-link to="/admin" class="sidebar-link" title="Dashboard">
        <span class="nav-icon">🖥️</span>
        <span class="nav-label" v-if="!collapsed">Dashboard</span>
      </router-link>
      <router-link to="/doctor-signup" class="sidebar-link" title="Add Doctor">
        <span class="nav-icon">➕</span>
        <span class="nav-label" v-if="!collapsed">Add Doctor</span>
      </router-link>
      <router-link to="/all_complaints" class="sidebar-link" title="All Casepapers">
        <span class="nav-icon">📋</span>
        <span class="nav-label" v-if="!collapsed">All Casepapers</span>
      </router-link>
    </nav>

    <!-- Spacer -->
    <div class="sidebar-spacer"></div>

    <!-- Logout -->
    <div class="sidebar-footer">
      <button class="sidebar-logout" @click="logout" :title="collapsed ? 'Logout' : ''">
        <span class="nav-icon">🚪</span>
        <span class="nav-label" v-if="!collapsed">Logout</span>
      </button>
    </div>
  </div>
  `,

  computed: {
    role() {
      return this.$store.state.role || localStorage.getItem("role");
    }
  },

  methods: {
    logout() {
      this.$store.commit("logout");
      this.$router.push("/user-login");
    }
  }
};