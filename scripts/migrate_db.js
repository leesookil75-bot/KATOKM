const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    try {
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS dream_energy NUMERIC(5, 1) DEFAULT 36.5`;
        console.log("Migration successful: Added dream_energy");
    } catch (e) {
        console.error("Migration failed", e);
    }
}

migrate();
