import * as admin from 'firebase-admin';

export function getAdminAuth() {
    if (!admin.apps.length) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
            privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
        }

        if (process.env.FIREBASE_PROJECT_ID) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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
