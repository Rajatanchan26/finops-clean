// firebase.js - Initialize Firebase
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
    apiKey: "AIzaSyCQ7k7tR-O4Uaqw4BklUczOK3gp1XMnaEM",
    authDomain: "finops-fa1a9.firebaseapp.com",
    projectId: "finops-fa1a9",
    storageBucket: "finops-fa1a9.appspot.com",
    messagingSenderId: "214918623811",
    appId: "1:214918623811:web:400e2f11b3b2df15c19af6",
    measurementId: "G-F18KSVTEGG"
  };

const app = initializeApp(firebaseConfig);
export default app; 