import Sidebar from "./components/Sidebar.js";
import Topbar  from "./components/Topbar.js";

export default {
  template: `
  <div id="app-shell" :class="{ 'sidebar-collapsed': collapsed }">

    <!-- Sidebar — only show when logged in -->
    <Sidebar
      v-if="isAuthenticated"
      :collapsed="collapsed"
      @toggle="collapsed = !collapsed"
    />

    <!-- Main content area -->
    <div class="main-content" :class="isAuthenticated ? 'with-sidebar' : ''">

      <!-- Top bar — only when logged in -->
      <Topbar
        v-if="isAuthenticated"
        :collapsed="collapsed"
        @toggle="collapsed = !collapsed"
      />

      <!-- Page content -->
      <div class="page-content" :class="isAuthenticated ? 'pt-topbar' : ''">
        <router-view />
      </div>
    </div>
  </div>
  `,

  components: { Sidebar, Topbar },

  data() {
    return { collapsed: false };
  },

  computed: {
    isAuthenticated() {
      return this.$store.state.loggedIn || !!localStorage.getItem("auth-token");
    }
  }
};