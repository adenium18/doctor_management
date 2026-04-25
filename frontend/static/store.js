const store = new Vuex.Store({
    state: {
        auth_token: null,
        role:       null,
        loggedIn:   false,
        user_id:    null,
        doctor_id:  null,   // ✅ track doctor_id separately from user_id
    },

    getters: {
        isLoggedIn: (state) => state.loggedIn,
        role:       (state) => state.role,
        auth_token: (state) => state.auth_token,
        user_id:    (state) => state.user_id,
        doctor_id:  (state) => state.doctor_id,   // ✅ getter for doctor_id
        isAdmin:    (state) => state.role === "admin",
        isDoctor:   (state) => state.role === "doctor",
    },

    mutations: {
        setUser(state) {
            try {
                const raw = localStorage.getItem('user');
                if (!raw) return;

                const user = JSON.parse(raw);

                if (!user.token || !user.role) {
                    console.warn('Incomplete session — clearing');
                    localStorage.clear();
                    return;
                }

                state.auth_token = user.token;
                state.role       = user.role;
                state.loggedIn   = true;
                state.user_id    = user.user_id;
                state.doctor_id  = user.doctor_id || null;  // ✅ restore doctor_id

            } catch (e) {
                console.warn('Corrupt session — clearing');
                localStorage.clear();
            }
        },

        logout(state) {
            state.auth_token = null;
            state.role       = null;
            state.loggedIn   = false;
            state.user_id    = null;
            state.doctor_id  = null;   // ✅ clear doctor_id on logout

            localStorage.removeItem('user');
            localStorage.removeItem('auth-token');
            localStorage.removeItem('role');
            localStorage.removeItem('user_id');
            localStorage.removeItem('doctor_id');   // ✅ remove from localStorage too
            localStorage.removeItem('full_name');
            localStorage.removeItem('selected_patient_id');
        }
    },

    actions: {}
});

if (localStorage.getItem('auth-token')) {
    store.commit('setUser');
}

export default store;