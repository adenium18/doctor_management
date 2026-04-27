import router from "./router.js";
import store  from "./store.js";
import App    from "./App.js";

new Vue({
    el:     '#app',
    router,
    store,
    render: h => h(App)
});