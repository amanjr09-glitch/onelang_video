
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";
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
  measurementId: "G-NY8M54MTE7",
  databaseURL: "https://zoom-clone-951a3-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firebaseDB = getFirestore(app);
export const firebaseRTDB = getDatabase(app);
export const firebaseAuth = getAuth(app);

// To find whether the meetId exists or not
// const meedId = new URLSearchParams(window.location.search).get("meetId")

export const usersRef = collection(firebaseDB, "users");
export const meetingsRef = collection(firebaseDB, "meetings");
export const connectedRef = ref(firebaseRTDB, "meetings/info/connnected")
