import router        from "./router.js";
import store         from "./store.js";
import App           from "./App.js";
import ToastContainer from "./components/Toast.js";

// Mount a singleton toast container outside the main Vue app so it
// survives route transitions and is always on top.
const ToastCtor = Vue.extend(ToastContainer);
const toastVM   = new ToastCtor().$mount(document.createElement("div"));
document.body.appendChild(toastVM.$el);

// Global helper: this.$toast("message")  /  this.$toast("msg", "danger")
Vue.prototype.$toast = (message, type = "success", duration = 3500) => {
  toastVM.add(message, type, duration);
};

// Slide-up animation for toasts
const style = document.createElement("style");
style.textContent = `
  .toast-slide-enter-active { transition: all .25s ease; }
  .toast-slide-leave-active { transition: all .2s ease; }
  .toast-slide-enter        { opacity:0; transform:translateY(16px); }
  .toast-slide-leave-to     { opacity:0; transform:translateX(40px); }
`;
document.head.appendChild(style);

new Vue({
  el:     "#app",
  router,
  store,
  render: h => h(App)
});
