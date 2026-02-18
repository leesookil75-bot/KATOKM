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
    console.log(`[Push] Sending to student: ${studentId}`, payload);
    let dbSaved = false;
    let pushResults: any[] = [];

    try {
        // Fetch subscriptions and academy name (using LEFT JOIN to be robust)
        const { rows: studentData } = await sql`
            SELECT ps.subscription, a.academy_name
            FROM students s
            LEFT JOIN admins a ON s.academy_id = a.id
            LEFT JOIN push_subscriptions ps ON s.id = ps.student_id
            WHERE s.id = ${studentId}
        `;

        if (studentData.length === 0) {
            console.error(`[Push] Student not found in DB: ${studentId}`);
            return { success: false, error: 'Student not found' };
        }

        const academyName = studentData[0].academy_name || '우리 학원';
        const subscriptions = studentData.filter(r => r.subscription).map(r => r.subscription);

        // Append academy name to the body if possible, default to empty string if body missing
        const originalBody = payload.body || '';
        const finalBody = originalBody ? `${originalBody}\n\n[${academyName}]` : `[${academyName}]`;

        const notificationPayload = JSON.stringify({
            title: payload.title || '알림',
            body: finalBody,
            vibrate: [100, 50, 100],
            data: { dateOfArrival: Date.now(), primaryKey: 1 },
        });

        if (subscriptions.length > 0) {
            const results = await Promise.allSettled(
                subscriptions.map(s => webpush.sendNotification(s.subscription, notificationPayload))
            );
            pushResults = results;

            // Cleanup failed subscriptions
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const sub = subscriptions[index].subscription;
                    if (result.reason.statusCode === 404 || result.reason.statusCode === 410) {
                        sql`DELETE FROM push_subscriptions WHERE subscription = ${JSON.stringify(sub)}`.catch(e => console.error('[Push-Cleanup-Error]', e));
                    }
                }
            });
        }

        // Save to notifications table for history
        try {
            await sql`
                INSERT INTO notifications (student_id, title, body)
                VALUES (${studentId}, ${payload.title || '알림'}, ${finalBody})
            `;
            dbSaved = true;
            await cleanOldNotifications();
        } catch (dbErr: any) {
            console.error('[Push-DB-Save-Error]', dbErr.message || dbErr);
        }

        return { success: true, dbSaved, subCount: subscriptions.length, pushResults };
    } catch (error) {
        console.error('[Push-Fatal-Error]', error);
        return { success: false, error: String(error) };
    }
}

export async function broadcastPushNotification(studentIds: string[], payload: { title: string, body: string }) {
    console.log(`[Push] Broadcasting to ${studentIds.length} students`);
    try {
        const results = await Promise.all(
            studentIds.map(id => sendPushNotification(id, payload))
        );
        return results;
    } catch (error) {
        console.error('[Push-Broadcast-Fatal-Error]', error);
        throw error;
    }
}

async function cleanOldNotifications() {
    try {
        await sql`
            DELETE FROM notifications 
            WHERE created_at < NOW() - INTERVAL '30 days'
        `;
    } catch (e) {
        console.error('[Push-Cleanup] Error:', e);
    }
}

export { PUBLIC_KEY };
