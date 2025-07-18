
import 'dotenv/config';
import * as admin from 'firebase-admin';

let adminInstance: typeof admin | null = null;
let initializationError: string | null = null;

function initializeAdmin() {
    if (admin.apps.length > 0) {
        adminInstance = admin;
        return;
    }

    try {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
            throw new Error("Firebase Admin SDK environment variables are not fully set.");
        }

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

// Call initialization right away
initializeAdmin();

export function getAdmin() {
    if (!adminInstance) {
        // This might re-attempt initialization if the first one failed,
        // or just return the existing error.
        initializeAdmin();
    }
    return { admin: adminInstance, error: initializationError };
}
