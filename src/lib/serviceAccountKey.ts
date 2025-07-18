
// IMPORTANT: This file should be added to .gitignore in a real production environment.
// For this context, we will use it to ensure server-side Firebase Admin SDK initializes correctly.

// Instructions:
// 1. Go to your Firebase project settings.
// 2. Navigate to the "Service accounts" tab.
// 3. Click "Generate new private key" to download your service account JSON file.
// 4. Copy the values from that file into the corresponding fields below.

export const serviceAccount = {
  type: "service_account",
  project_id: "", // <-- PASTE your project_id HERE (e.g., "your-project-id")
  private_key_id: "", // <-- PASTE your private_key_id HERE
  private_key: "", // <-- PASTE your private_key HERE (it will be very long and start with "-----BEGIN PRIVATE KEY-----")
  client_email: "", // <-- PASTE your client_email HERE (e.g., "firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com")
  client_id: "", // <-- PASTE your client_id HERE
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "" // <-- PASTE your client_x509_cert_url HERE
};
