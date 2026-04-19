import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCzmncL_F-eILjEFYLl4ZU2CutDZ6lY6EU",
    authDomain: "smartfoodapp-b1431.firebaseapp.com",
    projectId: "smartfoodapp-b1431",
    storageBucket: "smartfoodapp-b1431.firebasestorage.app",
    messagingSenderId: "1087000328168",
    appId: "1:1087000328168:web:7601a9f969fde44d3b165d",
    measurementId: "G-EZ4HMHD97C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
