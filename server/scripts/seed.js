require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../db');

const members = [
  { name: 'Connor Brodbeck', email: 'connor@alphasigma.com' },
  { name: 'Nick Verzello', email: 'nick@alphasigma.com' },
  { name: 'Josh Miller', email: 'josh@alphasigma.com' },
  { name: 'Luke Kovensky', email: 'luke@alphasigma.com' },
  { name: 'Cristian Devincenzo', email: 'cristian@alphasigma.com' },
  { name: 'Peter Severino', email: 'peter@alphasigma.com' },
];

const TEMP_PASSWORD = 'TempPass123!';

async function seed() {
  console.log('Seeding users...');

  try {
    const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 12);
    console.log(`Hashed password for all users (bcrypt rounds=12)`);

    for (const member of members) {
      try {
        await pool.query(
          'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash',
          [member.name, member.email, passwordHash]
        );
        console.log(`  ✓ ${member.name} (${member.email})`);
      } catch (err) {
        console.error(`  ✗ Failed to insert ${member.name}:`, err.message);
      }
    }

    const { rows } = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    console.log('\nUsers in database:');
    rows.forEach((r) => console.log(`  [${r.id}] ${r.name} — ${r.email}`));

    console.log(`\nAll users seeded with password: ${TEMP_PASSWORD}`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await pool.end();
  }
}

seed();
