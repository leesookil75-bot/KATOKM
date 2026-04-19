require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');

async function run() {
    try {
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS dream_tier INTEGER DEFAULT 0`;
        console.log('Migration Complete: added dream_tier');
    } catch (e) {
        console.error(e);
    }
}
run();
