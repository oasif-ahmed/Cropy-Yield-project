import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, '../../db');
const schema = fs.readFileSync(path.join(dbDir, 'schema.sql'), 'utf8');
const seed = fs.readFileSync(path.join(dbDir, 'seed.sql'), 'utf8');

const forceSeed = process.argv.includes('--force');

async function main() {
  console.log('Running schema...');
  await pool.query(schema);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users');
  if (rows[0].n === 0 || forceSeed) {
    if (rows[0].n > 0 && forceSeed) {
      console.log('Force seeding on non-empty DB — truncating all tables...');
      await pool.query(`
        TRUNCATE disease_training_data, yield_training_data,
                 ai_predictions, crop_recommendations, disease_images,
                 notifications, crop_production, market_prices, disease_logs,
                 weather_records, soil_tests, crops, lands, farmers, users
        RESTART IDENTITY CASCADE
      `);
    }
    console.log('Running seed...');
    await pool.query(seed);
    console.log('Seed complete. Default accounts:');
    console.log('  admin@cropyield.com / admin123');
    console.log('  officer@cropyield.com / officer123');
    console.log('  farmer@cropyield.com / farmer123');
  } else {
    console.log('Database already has data — skipping seed (use --force to reseed).');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
