import { auth, database } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {
  ref,
  onValue,
  set,
  get,
  push,
  onChildAdded,
  off,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

let currentUser = null;
let selectedUser = null;
let currentChatId = null;
let messageListenerRef = null;

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

          userCard.addEventListener("click", () => {
            selectUser(user, userCard);
          });

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

async function selectUser(user, selectedCard) {
  // selected user ko save karna
  selectedUser = user;

  // dono users ki ids ko sort karky unique id banana
  const userIds = [currentUser.uid, user.uid].sort();
  currentChatId = userIds.join("_");

  // conversation ky participents
  const participants = {
    [currentUser.uid]: true,
    [user.uid]: true,
  };

  console.log("Current User UID:", currentUser.uid);
  console.log("Selected User UID:", user.uid);
  console.log("Generated Chat ID:", currentChatId);
  console.log("Participants:", participants);

  // firebase main conversation create karna

  try {
    const conversationRef = ref(database, "conversations/" + currentChatId);

    const snapshot = await get(conversationRef);

    if (snapshot.exists()) {
      console.log("Conversation already exists:", currentChatId);
    } else {
      await set(conversationRef, {
        participants: participants,
        createdAt: Date.now(),
      });

      console.log("New conversation created:", currentChatId);
    }
  } catch (error) {
    console.error("Conversation error:", error);
  }

  // selected user ko highlight karna
  const allUserCards = document.querySelectorAll(".user-card");

  allUserCards.forEach((card) => {
    card.classList.remove("active");
  });

  // clicked card ko active karna
  selectedCard.classList.add("active");

  const chatHeader = document.getElementById("selectedUserHeader");

  chatHeader.querySelector("h3").textContent = user.name || "Unknown User";
  chatHeader.querySelector("p").textContent = user.email || "";

  // welcome screen ko hide karna
  const welcomScreen = document.getElementById("welcomeScreen");

  if (welcomScreen) {
    welcomScreen.classList.add("hidden");
  }

  // show message form
  const messageForm = document.getElementById("messageForm");
  messageForm.classList.remove("hidden");

  // enable input & send btn
  document.getElementById("messageInput").disabled = false;
  document.getElementById("sendBtn").disabled = false;

  loadMessages(currentChatId);

  console.log("Selected User:", selectedUser);
}

function displayMessage(message, messageId) {
  const messageContainer = document.getElementById("messageContainer");

  // messages ka main container
  const messageDiv = document.createElement("div");

  // check karein message current user ka hai ya doosry user ka
  if (message.senderId === currentUser.uid) {
    messageDiv.classList.add("message", "sent");
  } else {
    messageDiv.classList.add("message", "received");
  }

  // message text
  const messageText = document.createElement("p");
  messageText.classList.add("message-text");
  messageText.textContent = message.text;

  // message time
  const messageTime = document.createElement("span");
  messageTime.classList.add("message-time");

  const date = new Date(message.timestamp);

  messageTime.textContent = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // elements ko combine karna
  messageDiv.appendChild(messageText);
  messageDiv.appendChild(messageTime);

  // chat screen par message show karna
  messageContainer.appendChild(messageDiv);

  // latest message tak scroll karna
  messageContainer.scrollTop = messageContainer.scrollHeight;

  console.log("message displayed:", messageId);
}

function loadMessages(chatId) {
  // agr purana listener active hai ti usy band karein
  if (messageListenerRef) {
    off(messageListenerRef);
  }

  // messages container clear karein
  const messageContainer = document.getElementById("messageContainer");
  messageContainer.innerHTML = "";

  // selected conversation ke messages ka refference
  messageListenerRef = ref(database, "messages/" + chatId);

  // firebase ke existing aur naye messages listen karna
  onChildAdded(
    messageListenerRef,
    (snapshot) => {
      const message = snapshot.val();
      const messageId = snapshot.key;

      displayMessage(message, messageId);
    },
    (error) => {
      console.log("<essage Loading Error:", error);
    },
  );
  console.log("Listining to Message:", chatId);
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

const messageForm = document.getElementById("messageForm");

messageForm.addEventListener("submit", async (event) => {
  // form ko page reload karny sy rokna
  event.preventDefault();

  // input sy message lena
  const messageInput = document.getElementById("messageInput");
  const messageText = messageInput.value.trim();

  // check karna ky user aur conversation selected hain
  if (!currentUser || !selectedUser || !currentChatId) {
    console.log("Please select a user first.");
    return;
  }

  // empty message send na karna
  if (messageText === "") {
    return;
  }

  try {
    // firebase main message ka refference
    const messageRef = ref(database, "messages/" + currentChatId);

    // har message ki uniqe id generate karna
    const newMessageRef = push(messageRef);

    await set(newMessageRef, {
      senderId: currentUser.uid,
      text: messageText,
      timestamp: Date.now(),
    });

    console.log("Message sent successfully!");

    // input clear karna
    messageInput.value = "";
  } catch (error) {
    console.log("Message sending Error:", error);
  }
});
