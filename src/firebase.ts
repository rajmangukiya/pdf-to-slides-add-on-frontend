import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyDACTDjW6Hx-Du-syXPRC5ekojILiRIBKg",
    authDomain: "pdf-to-slides-converter-23aa1.firebaseapp.com",
    projectId: "pdf-to-slides-converter-23aa1",
    storageBucket: "pdf-to-slides-converter-23aa1.firebasestorage.app",
    messagingSenderId: "287977559122",
    appId: "1:287977559122:web:e449ebf6a69b9cc3b73b8b",
    measurementId: "G-89F85SRHLF"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Connect to emulator in development
if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Connected to Functions Emulator');
}

export { functions };
export const convertPdfToSlides = httpsCallable(functions, 'convertPdfToSlides');