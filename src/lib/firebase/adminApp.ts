import * as admin from 'firebase-admin';

export function getAdminAuth() {
    if (!admin.apps.length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
            privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
        }

        if (privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: "aipass-auth",
                    clientEmail: "firebase-adminsdk-fbsvc@aipass-auth.iam.gserviceaccount.com",
                    privateKey: privateKey,
                }),
            });
        } else {
             // Fallback for Vercel build time if env vars are missing
             admin.initializeApp();
        }
    }
    return admin.auth();
}
