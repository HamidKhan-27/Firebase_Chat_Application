import { auth, database } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("User is Logged In:", user);
    loadUsers();
  } else {
    currentUser = null;
    window.location.replace("./index.html");
  }
});

function loadUsers() {
  const usersList = document.getElementById("usersList");
  const usersCount = document.getElementById("usersCount");

  // database main users nodes ka refference
  const usersRef = ref(database, "users");

  // Real-time database listner
  onValue(
    usersRef,
    (snapshot) => {
      // preveous list clear karna
      usersList.innerHTML = "";

      let totalUsers = 0;
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const user = childSnapshot.val();

          // show current users in list
          if (user.uid === currentUser.uid) {
            return;
          }
          totalUsers++;

          // User card create karna
          const userCard = document.createElement("div");
          userCard.classList.add("user-card");

          const userName = document.createElement("h4");
          userName.textContent = user.name || "Unkcown User";

          const userEmail = document.createElement("p");
          userEmail.textContent = user.email || "";

          userCard.appendChild(userName);
          userCard.appendChild(userEmail);

          usersList.appendChild(userCard);
        });
      }

      // total user update
      usersCount.textContent = `(${totalUsers})`;

      // if no user is availible
      if (totalUsers === 0) {
        usersList.innerHTML =
          '<p class="loading-text">No other users found.</p>';
      }
      console.log("Users Loades:", totalUsers);
    },
    (error) => {
      console.error("Users Fetch Error:", error);
      usersList.textContent = "Unable to load users.";
    },
  );
}

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("User Logged Out successfully!");
    window.location.replace("./index.html");
  } catch (error) {
    console.error("Logout Error:", error);
  }
});
