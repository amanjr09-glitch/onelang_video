
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { collection, getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTIdHwgRxLgG2iJf2JIqWpF1vUe8_X8V4",
  authDomain: "zoom-clone-951a3.firebaseapp.com",
  projectId: "zoom-clone-951a3",
  storageBucket: "zoom-clone-951a3.appspot.com",
  messagingSenderId: "897082785829",
  appId: "1:897082785829:web:ace71b55423a78b4267fcc",
  measurementId: "G-NY8M54MTE7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firebaseDB = getFirestore(app);
export const firebaseAuth = getAuth(app);

export const usersRef = collection(firebaseDB, "users");
export const meetingsRef = collection(firebaseDB, "meetings");
