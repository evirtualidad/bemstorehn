import * as admin from 'firebase-admin';
import { serviceAccount } from './serviceAccountKey';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
        console.error('Firebase Admin SDK: Service account key is missing or incomplete. Please check src/lib/serviceAccountKey.ts');
    } else {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin SDK initialized successfully.");
        } catch (error: any) {
            console.error("Error initializing Firebase Admin SDK:", error.message);
        }
    }
}

export { admin };
