const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const userLogo = document.getElementById("userLogo");
const usernameDisplay = document.getElementById("usernameDisplay");

const userId = sessionStorage.getItem("userId");
const username = sessionStorage.getItem("username");

if (!userId) {
    alert("Please login first!");
    window.location.href = "login.html";
}

// Show username
usernameDisplay.textContent = username;

// Load history initially
let historyCache = [];
async function loadHistory() {
    const res = await fetch(`http://localhost:3000/history/${userId}`);
    historyCache = await res.json();
    renderHistory();
}

// Render history list
function renderHistory() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";
    historyCache.forEach(h => {
        const li = document.createElement("li");
        li.textContent = h.text;
        li.style.marginBottom = "5px";
        historyList.appendChild(li);
    });
}

// Toggle history and username display
userLogo.addEventListener("click", () => {
    const historyBox = document.getElementById("historyBox");
    const isHidden = historyBox.style.display === "none";

    // Toggle both history box and username
    historyBox.style.display = isHidden ? "block" : "none";
    usernameDisplay.style.display = isHidden ? "inline-block" : "none";
});

// Fetch tasks
async function loadTasks() {
    const res = await fetch(`http://localhost:3000/tasks/${userId}`);
    const tasks = await res.json();
    tasks.forEach(task => renderTask(task));
}

loadTasks();
loadHistory();

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
});

async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const res = await fetch("http://localhost:3000/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text })
    });

    const task = await res.json();
    renderTask(task);
    taskInput.value = "";
}

function renderTask(taskObj) {
    const li = document.createElement("li");
    li.className = "task-item";
    if (taskObj.completed) li.classList.add("completed");
    li.dataset.id = taskObj._id;

    li.innerHTML = `
        <span class="task-text">${taskObj.text}</span>
        <div class="task-actions">
            <button class="btn complete-btn">Done</button>
            <button class="btn delete-btn">Delete</button>
        </div>
    `;

    // Complete
    li.querySelector(".complete-btn").addEventListener("click", async () => {
        const res = await fetch(`http://localhost:3000/tasks/${taskObj._id}`, { method: "PUT" });
        const updatedTask = await res.json();
        li.classList.toggle("completed");

        // Refresh history after marking completed
        await loadHistory();
    });

    // Delete
    li.querySelector(".delete-btn").addEventListener("click", async () => {
        await fetch(`http://localhost:3000/tasks/${taskObj._id}`, { method: "DELETE" });
        li.remove();

        // Refresh history in case deleted task was completed
        await loadHistory();
    });

    taskList.prepend(li);
}
