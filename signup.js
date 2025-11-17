const signupForm = document.getElementById("signupForm");
const loginRedirectBtn = document.getElementById("loginRedirectBtn");

loginRedirectBtn.addEventListener("click", () => {
    window.location.href = "login.html";
});

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value.trim().toLowerCase(); // FIX
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("http://localhost:3000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) window.location.href = "login.html";
    } catch (err) {
        console.error(err);
        alert("Unable to signup. Check your server.");
    }
});
