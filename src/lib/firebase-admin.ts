
import * as admin from 'firebase-admin';

let adminInstance: typeof admin | null = null;
let initializationError: string | null = null;

function initializeAdmin() {
    if (admin.apps.length > 0) {
        adminInstance = admin;
        return;
    }

    try {
        const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n');

        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
            throw new Error("Las variables de entorno de Firebase Admin SDK no están completas. Asegúrate de que FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, y FIREBASE_PRIVATE_KEY estén definidas.");
        }
        
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        };

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log("Firebase Admin SDK initialized successfully.");
        adminInstance = admin;

    } catch (error: any) {
        console.error('Error initializing Firebase Admin SDK:', error.message);
        initializationError = error.message;
        adminInstance = null;
    }
}

export function getAdmin() {
    if (!adminInstance && !initializationError) {
        initializeAdmin();
    }
    return { admin: adminInstance, error: initializationError };
}
