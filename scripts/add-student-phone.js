require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function main() {
    try {
        console.log("Adding student_phone column to students table...");
        await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS student_phone VARCHAR(50);`;
        console.log("Success! student_phone column added.");
    } catch(err) {
        console.error("Error migrating DB:", err);
    }
    process.exit(0);
}

main();
