
// IMPORTANT: This file should be added to .gitignore in a real production environment.
// For this context, we will use it to ensure server-side Firebase Admin SDK initializes correctly.

// Instructions:
// 1. Get your Firebase service account key JSON file from the Firebase console.
//    (Project Settings -> Service accounts -> Generate new private key)
// 2. Copy the contents of that file and paste them here, replacing the placeholder values.

export const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID || "", // e.g., "your-project-id"
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID || "", // e.g., "your-private-key-id"
  "private_key": (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'), // Your private key
  "client_email": process.env.FIREBASE_CLIENT_EMAIL || "", // e.g., "firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com"
  "client_id": process.env.FIREBASE_CLIENT_ID || "", // e.g., "your-client-id"
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL || ""}`.replace(/%40/g, "@")
};
