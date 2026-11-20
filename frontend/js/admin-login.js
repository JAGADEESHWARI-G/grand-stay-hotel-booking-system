const API_URL = "http://localhost:5000/api";

const loginForm = document.getElementById("adminLoginForm");
const loginAlert = document.getElementById("loginAlert");
const loginButton = document.getElementById("loginButton");

// Show message
function showLoginMessage(message, type = "danger") {
    loginAlert.textContent = message;
    loginAlert.className = `alert alert-${type} mt-3`;
}

// Hide message
function hideLoginMessage() {
    loginAlert.className = "alert d-none mt-3";
}

// Show / Hide Password
document.getElementById("togglePassword").addEventListener("click", () => {

    const passwordInput = document.getElementById("password");
    const icon = document.querySelector("#togglePassword i");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.className = "bi bi-eye-slash";
    } else {
        passwordInput.type = "password";
        icon.className = "bi bi-eye";
    }
});

// LOGIN
loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();
    hideLoginMessage();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginButton.disabled = true;

    loginButton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Logging in...
    `;

    try {

        const response = await fetch(`${API_URL}/admin/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Invalid email or password.");
        }

        // Store login only temporarily
        sessionStorage.setItem("adminToken", data.token);
        sessionStorage.setItem("adminData", JSON.stringify(data.admin));

        showLoginMessage("Login successful!", "success");

        setTimeout(() => {
            window.location.replace("admin.html");
        }, 500);

    } catch (error) {

        showLoginMessage(error.message);

    } finally {

        loginButton.disabled = false;

        loginButton.innerHTML = `
            <i class="bi bi-box-arrow-in-right me-2"></i>
            Login
        `;
    }
});

// Always show login page freshly
sessionStorage.removeItem("adminToken");
sessionStorage.removeItem("adminData");