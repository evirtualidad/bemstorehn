
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
            throw new Error("Las credenciales de la cuenta de servicio en serviceAccountKey.ts no están completas. Por favor, rellena el archivo con las credenciales de tu proyecto de Firebase.");
        }
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });

        console.log("Firebase Admin SDK initialized successfully via service account file.");
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
