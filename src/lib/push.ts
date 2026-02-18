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
        // 1. Fetch Student & Academy Info (Essential - use cast for robustness)
        const { rows: studentInfo } = await sql`
            SELECT s.id, s.name, a.academy_name
            FROM students s
            LEFT JOIN admins a ON s.academy_id = a.id
            WHERE s.id = ${studentId}::uuid
        `;

        if (studentInfo.length === 0) {
            console.error(`[Push] Student not found: ${studentId}`);
            return { success: false, error: `학생 정보를 찾을 수 없음 (ID: ${studentId})`, dbSaved: false };
        }

        const academyName = studentInfo[0].academy_name || '우리 학원';
        const studentName = studentInfo[0].name;

        // 2. Fetch Subscriptions (Explicitly cast studentId to text)
        const { rows: subs } = await sql`
            SELECT subscription FROM push_subscriptions 
            WHERE student_id = ${studentId}::text
        `;
        const subscriptions = subs.filter(r => r.subscription).map(r => r.subscription);

        // 3. Prepare Payload
        const originalBody = payload.body || '';
        const finalBody = originalBody ? `${originalBody}\n\n[${academyName}]` : `[${academyName}]`;

        const notificationPayload = JSON.stringify({
            title: payload.title || '알림',
            body: finalBody,
            vibrate: [100, 50, 100],
            data: { dateOfArrival: Date.now(), primaryKey: 1 },
        });

        // 4. Send Push
        if (subscriptions.length > 0) {
            const results = await Promise.allSettled(
                subscriptions.map(s => webpush.sendNotification(s, notificationPayload))
            );
            pushResults = results;

            // Cleanup failed subscriptions
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const sub = subscriptions[index]; // subscriptions already contains the subscription object
                    if (result.reason.statusCode === 404 || result.reason.statusCode === 410) {
                        sql`DELETE FROM push_subscriptions WHERE subscription = ${JSON.stringify(sub)}`.catch(e => console.error('[Push-Cleanup-Error]', e));
                    }
                }
            });
        }

        // 5. Save to notifications table for history
        let dbError = null;
        try {
            await sql`
                INSERT INTO notifications (student_id, title, body)
                VALUES (${studentId}, ${payload.title || '알림'}, ${finalBody})
            `;
            dbSaved = true;
            await cleanOldNotifications();
        } catch (dbErr: any) {
            dbError = dbErr.message || String(dbErr);
            console.error('[Push-DB-Save-Error]', dbError);
        }

        return {
            success: true,
            studentName,
            dbSaved,
            dbError,
            subCount: subscriptions.length,
            pushResults
        };
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
