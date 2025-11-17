const loginForm = document.getElementById("loginForm");
const signupRedirectBtn = document.getElementById("signupRedirectBtn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn"); // move this here

// Redirect to signup page
signupRedirectBtn.addEventListener("click", () => {
    window.location.href = "signup.html";
});

// Redirect to forgot password page
forgotPasswordBtn.addEventListener("click", () => {
    window.location.href = "forgot-password.html";
});

// Handle login form submission
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            sessionStorage.setItem("username", data.username);
            sessionStorage.setItem("userId", data.userId);
            window.location.href = "front.html";
        }
    } catch (err) {
        console.error(err);
        alert("Login failed. Check server.");
    }
});
