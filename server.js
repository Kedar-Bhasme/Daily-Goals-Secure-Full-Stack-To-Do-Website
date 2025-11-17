const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve ALL frontend files from the project root (NO NEED for /public folder)
app.use(express.static(__dirname));

// -------------------- MONGO CONNECTION --------------------
mongoose.connect("mongodb://127.0.0.1:27017/dailygoals")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// -------------------- USER MODEL --------------------
const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model("User", userSchema);

// -------------------- RESET TOKEN MODEL --------------------
const passwordResetTokenSchema = new mongoose.Schema({
    userId: String,
    token: String,
    expires: Date
});
const PasswordResetToken = mongoose.model("PasswordResetToken", passwordResetTokenSchema);

// -------------------- SERVE HTML PAGES --------------------
app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/signup.html", (req, res) => {
    res.sendFile(path.join(__dirname, "signup.html"));
});

app.get("/forgot-password.html", (req, res) => {
    res.sendFile(path.join(__dirname, "forgot-password.html"));
});

app.get("/reset-password.html", (req, res) => {
    res.sendFile(path.join(__dirname, "reset-password.html"));
});

// -------------------- FORGOT PASSWORD --------------------
app.post("/forgot-password", async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Email not found" });

    const token = crypto.randomBytes(20).toString("hex");

    await PasswordResetToken.create({
        userId: user._id.toString(),
        token,
        expires: Date.now() + 3600000
    });

    console.log("✔ TOKEN STORED IN DB:", token);
    res.json({ message: "Email verified! Enter new password below.", token });
});

// -------------------- RESET PASSWORD --------------------
app.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    const tokenDoc = await PasswordResetToken.findOne({ token });

    if (!tokenDoc)
        return res.status(400).json({ message: "Invalid or expired token" });

    if (tokenDoc.expires < Date.now()) {
        await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
        return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    await PasswordResetToken.deleteOne({ _id: tokenDoc._id });

    res.json({ message: "Password reset successful!" });
});

// -------------------- SIGNUP --------------------
app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "Email already registered" });

        const hashed = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashed
        });

        res.json({ message: "Signup successful!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// -------------------- LOGIN --------------------
app.post("/login", async (req, res) => {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    res.json({
        message: "Login successful!",
        username: user.username,
        userId: user._id
    });
});

// -------------------- TASK MODEL --------------------
const taskSchema = new mongoose.Schema({
    userId: String,
    text: String,
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
});
const Task = mongoose.model("Task", taskSchema);

// -------------------- TASK ROUTES --------------------
app.post("/tasks", async (req, res) => {
    try {
        const { userId, text } = req.body;
        const task = new Task({ userId, text });
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

app.put("/tasks/:id", async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : null;
        await task.save();

        res.json(task);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

app.get("/history/:userId", async (req, res) => {
    try {
        const tasks = await Task.find({
            userId: req.params.userId,
            completed: true
        }).sort({ completedAt: -1 }).limit(10);

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

app.delete("/tasks/:id", async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// -------------------- START SERVER --------------------
app.listen(3000, () => console.log("Server running on port 3000"));
