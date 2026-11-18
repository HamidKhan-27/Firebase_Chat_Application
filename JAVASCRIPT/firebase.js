// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js"; // import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtaiqBS3R2GcHaIMCfnANRwGy9XaOiEdY",
  authDomain: "fir-chat-application-28304.firebaseapp.com",
  projectId: "fir-chat-application-28304",
  storageBucket: "fir-chat-application-28304.firebasestorage.app",
  messagingSenderId: "200163602466",
  appId: "1:200163602466:web:ca396fa58cbd83e3209a7b",
  measurementId: "G-49GG4W1DK7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
console.log("firebase initialized Successgully!");
