import webpush from 'web-push';
import { sql } from '@vercel/postgres';

const PUBLIC_KEY = 'BH749OlOysQPYPpdxUa45W1XShrSsqreU6ohU3vhdvPNFyAL1Y_SGPj6vKv84VtII_Jl8R3Q5RxuvkR9Zywds2c';
const PRIVATE_KEY = '8AOmAo0LV8b309bmJA_3xQixmorgwKfyc92OQB6lJCE';

webpush.setVapidDetails(
    'mailto:mubin@example.com',
    PUBLIC_KEY,
    PRIVATE_KEY
);

export async function sendPushNotification(studentId: string, payload: { title: string, body: string }) {
    try {
        const { rows: subscriptions } = await sql`
            SELECT subscription FROM push_subscriptions WHERE student_id = ${studentId}
        `;

        const notificationPayload = JSON.stringify({
            ...payload,
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            },
            // Custom sound logic is handled in the service worker
        });

        const results = await Promise.allSettled(
            subscriptions.map(s =>
                webpush.sendNotification(s.subscription, notificationPayload)
            )
        );

        // Cleanup failed subscriptions
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const sub = subscriptions[index].subscription;
                // If 404 or 410, subscription is no longer valid
                if (result.reason.statusCode === 404 || result.reason.statusCode === 410) {
                    sql`DELETE FROM push_subscriptions WHERE subscription = ${JSON.stringify(sub)}`.catch(console.error);
                }
            }
        });

        return results;
    } catch (error) {
        console.error('[Push-Notification] Error sending:', error);
    }
}

export async function broadcastPushNotification(studentIds: string[], payload: { title: string, body: string }) {
    try {
        const results = await Promise.allSettled(
            studentIds.map(id => sendPushNotification(id, payload))
        );
        return results;
    } catch (error) {
        console.error('[Push-Broadcast] Error:', error);
    }
}

export { PUBLIC_KEY };
