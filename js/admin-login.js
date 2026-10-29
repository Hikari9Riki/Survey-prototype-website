/* Admin login: email/password against dummy users, plus a simulated
   Google sign-in flow. On success, sets the admin session and redirects
   to the dashboard. */

(function () {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("login-email");
  const passInput = document.getElementById("login-password");
  const errorEl = document.getElementById("login-error");
  const googleBtn = document.getElementById("google-login");
  const googleModal = document.getElementById("google-modal");
  const googleClose = document.getElementById("google-close");

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden", "alert-info");
    errorEl.classList.add("alert");
    errorEl.style.background = "#fee2e2";
    errorEl.style.color = "#991b1b";
    errorEl.style.border = "1px solid #fecaca";
  }

  function resetError() {
    errorEl.classList.add("hidden");
  }

  function loginSuccess(user) {
    setAdminLoggedIn(user);
    window.location.href = "admin-dashboard.html";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    resetError();
    const email = emailInput.value.trim().toLowerCase();
    const pass = passInput.value;

    const user = ADMIN_USERS.find(u => u.email.toLowerCase() === email && u.password === pass);
    if (user) {
      loginSuccess({ name: user.name, email: user.email, provider: "email" });
    } else {
      showError("Invalid email or password. Try admin@demo.com / admin123.");
    }
  });

  // Google sign-in simulation.
  googleBtn.addEventListener("click", function () {
    googleModal.classList.add("open");
  });

  googleClose.addEventListener("click", function () {
    googleModal.classList.remove("open");
  });

  googleModal.addEventListener("click", function (e) {
    if (e.target === googleModal) googleModal.classList.remove("open");
  });

  document.querySelectorAll("[data-google-user]").forEach(btn => {
    btn.addEventListener("click", function () {
      const name = btn.getAttribute("data-google-user");
      const email = btn.getAttribute("data-google-email");
      googleModal.classList.remove("open");
      loginSuccess({ name, email, provider: "google" });
    });
  });
})();
