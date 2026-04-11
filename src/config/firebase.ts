import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyASs6rkZ50mfQAoGEIHpSh_G7_Ae1rZyoA",
  authDomain: "nosso-gov.firebaseapp.com",
  projectId: "nosso-gov",
  storageBucket: "nosso-gov.firebasestorage.app",
  messagingSenderId: "410358387557",
  appId: "1:410358387557:web:d06f88b16383aebec4478c"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const APP_ID = 'rpg-politico-app';
