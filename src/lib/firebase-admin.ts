
import * as admin from 'firebase-admin';
import { serviceAccount } from './serviceAccountKey';

let adminInstance: typeof admin | null = null;
let initializationError: string | null = null;

function initializeAdmin() {
    if (admin.apps.length > 0) {
        adminInstance = admin;
        return;
    }

    try {
        if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
            throw new Error("Las credenciales de la cuenta de servicio en serviceAccountKey.ts no están completas.");
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log("Firebase Admin SDK initialized successfully via serviceAccountKey.ts.");
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
    if (!adminInstance && !initializationError) {
        // This might re-attempt initialization if the first one failed,
        // or just return the existing error.
        initializeAdmin();
    }
    return { admin: adminInstance, error: initializationError };
}
