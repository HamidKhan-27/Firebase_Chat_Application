import { auth, database } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

// dom elements
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

const authMessage = document.getElementById("authMessage");

// show Success / Error Message
function showMessage(message, type = "success") {
  authMessage.textContent = message;
  authMessage.style.display = "block";

  if (type === "success") {
    authMessage.style.color = "#087a43";
    authMessage.style.background = "#e6fff1";
  } else {
    authMessage.style.color = "#d93025";
    authMessage.style.background = "#fff0ef";
  }
}

// Switch to login & signup
function switchForm(formType) {
  authMessage.textContent = "";
  authMessage.style.display = "none";

  if (formType === "login") {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

    loginTab.classList.add("active");
    signupTab.classList.remove("active");
  } else if (formType === "signup") {
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    signupTab.classList.add("active");
    loginTab.classList.remove("active");
  }
}

// Tab and buttons eventLitners
loginTab.addEventListener("click", () => {
  switchForm("login");
});

signupTab.addEventListener("click", () => {
  switchForm("signup");
});

showSignup.addEventListener("click", () => {
  switchForm("signup");
});

showLogin.addEventListener("click", () => {
  switchForm("login");
});

// user registration
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    showMessage("password do not match!", "error");
    return;
  }

  try {
    // create firebase account
    const userCrdential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCrdential.user;
    // update user profile
    await updateProfile(user, {
      displayName: name,
    });

    // save user information in Database
    try {
      await set(ref(database, "users/" + user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        createdAt: Date.now(),
      });
      showMessage("Account created successfully!");
    } catch (dbError) {
      console.error("Database Error:", dbError);

      showMessage(
        "Account created, but profile could not be saved. Database rules need configuration.",
        "error",
      );
    }

    window.location.replace("../HTML/chat.html");
  } catch (error) {
    console.error("Signup Error:", error);

    if (error.code === "auth/email-already-in-use") {
      showMessage("This email is already regitered!", "error");
    } else if (error.code === "auth/weak-password") {
      showMessage("Password is too weak!", "error");
    } else if (error.code === "auth/invalid-email") {
      showMessage("Please enter a valid email!", "error");
    } else {
      showMessage(error.message, "error");
    }
  }
});

// user login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    // Firebase Login
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    showMessage("Login successful! Welcome back.");
    console.log("Logged In User:", userCredential.user);

    window.location.replace("../HTML/chat.html");
  } catch (error) {
    console.error("Login Error:", error);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      showMessage("Invalid email or password!", "error");
    } else if (error.code === "auth/invalid-email") {
      showMessage("Please enter a valid email!", "error");
    } else {
      showMessage(error.message, "error");
    }
  }
});
