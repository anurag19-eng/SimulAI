document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const passwordToggle = document.getElementById("password-toggle");
    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");

    const welcomeTitle = document.getElementById("welcome-title");
    const usernameError = document.getElementById("username-error");
    const passwordError = document.getElementById("password-error");
    const formMessage = document.getElementById("form-message");

    const eyeOpen = document.getElementById("eye-open");
    const eyeClosed = document.getElementById("eye-closed");

    // ------------------------------------------------------------
    // Dynamic welcome message
    // ------------------------------------------------------------
    function updateWelcomeMessage() {
        const username = usernameInput.value.trim();

        welcomeTitle.classList.add("updating");

        window.requestAnimationFrame(() => {
            welcomeTitle.textContent = username
                ? `Welcome, ${username}`
                : "Welcome";

            window.setTimeout(() => {
                welcomeTitle.classList.remove("updating");
            }, 80);
        });
    }

    usernameInput.addEventListener("input", updateWelcomeMessage);

    // ------------------------------------------------------------
    // Password visibility
    // ------------------------------------------------------------
    passwordToggle.addEventListener("click", () => {
        const showingPassword = passwordInput.type === "text";

        passwordInput.type = showingPassword ? "password" : "text";

        eyeOpen.classList.toggle("hidden", !showingPassword);
        eyeClosed.classList.toggle("hidden", showingPassword);

        passwordToggle.setAttribute(
            "aria-label",
            showingPassword ? "Show password" : "Hide password"
        );

        passwordToggle.setAttribute(
            "title",
            showingPassword ? "Show password" : "Hide password"
        );

        passwordInput.focus();
    });

    // ------------------------------------------------------------
    // Validation helpers
    // ------------------------------------------------------------
    function clearErrors() {
        usernameError.textContent = "";
        passwordError.textContent = "";

        document.querySelectorAll(".input-wrap").forEach((wrap) => {
            wrap.classList.remove("has-error");
        });

        formMessage.textContent = "";
        formMessage.className = "form-message";
    }

    function showFieldError(input, errorElement, message) {
        input.closest(".input-wrap").classList.add("has-error");
        errorElement.textContent = message;
    }

    function validateForm() {
        clearErrors();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        let valid = true;

        if (!username) {
            showFieldError(
                usernameInput,
                usernameError,
                "Please enter your username."
            );
            valid = false;
        }

        if (!password) {
            showFieldError(
                passwordInput,
                passwordError,
                "Please enter your password."
            );
            valid = false;
        }

        if (!valid) {
            formMessage.textContent = "Please fill in the required fields.";
            formMessage.classList.add("error");
        }

        return valid;
    }

    usernameInput.addEventListener("input", () => {
        if (usernameInput.value.trim()) {
            usernameInput.closest(".input-wrap").classList.remove("has-error");
            usernameError.textContent = "";
        }
    });

    passwordInput.addEventListener("input", () => {
        if (passwordInput.value) {
            passwordInput.closest(".input-wrap").classList.remove("has-error");
            passwordError.textContent = "";
        }
    });

    // ------------------------------------------------------------
    // Login
    //
    // Flask/backend remains responsible for authentication.
    // This form simply submits username + password to /login.
    // ------------------------------------------------------------
    loginForm.addEventListener("submit", (event) => {
        if (!validateForm()) {
        event.preventDefault();
        return;
        }

        loginButton.classList.add("loading");

    // Allow the submit event to capture the button's value before disabling
        setTimeout(() => {
            loginButton.disabled = true;
            registerButton.disabled = true;
        }, 0);
    });
    // ------------------------------------------------------------
    // Register
    //
    // Change /register here if your Flask route uses another name.
    // ------------------------------------------------------------
    

    // ------------------------------------------------------------
    // Optional Flask feedback support
    //
    // If Flask later injects:
    // <div id="server-message" data-message="..."></div>
    // this code can display it without changing the UI.
    // ------------------------------------------------------------
    const serverMessage = document.getElementById("server-message");

    if (serverMessage) {
        const message = serverMessage.dataset.message;
        const type = serverMessage.dataset.type || "error";

        if (message) {
            formMessage.textContent = message;
            formMessage.classList.add(type);
        }
    }

    // Set the initial state.
    updateWelcomeMessage();
});
