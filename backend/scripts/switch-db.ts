import fs from 'fs';
import path from 'path';

const target = process.argv[2]; // 'postgres' | 'sqlite'
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const postgresSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');
const sqliteSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');

if (target === 'postgres') {
  if (fs.existsSync(postgresSchemaPath)) {
    const postgresContent = fs.readFileSync(postgresSchemaPath, 'utf8');
    fs.writeFileSync(schemaPath, postgresContent, 'utf8');
    console.log('✅ Switched prisma/schema.prisma to PostgreSQL (Supabase/Render mode).');
  } else {
    console.error('❌ PostgreSQL schema template not found at:', postgresSchemaPath);
    process.exit(1);
  }
} else if (target === 'sqlite') {
  if (fs.existsSync(sqliteSchemaPath)) {
    const sqliteContent = fs.readFileSync(sqliteSchemaPath, 'utf8');
    fs.writeFileSync(schemaPath, sqliteContent, 'utf8');
    console.log('✅ Switched prisma/schema.prisma to SQLite (Local dev mode).');
  } else {
    console.error('❌ SQLite schema template not found at:', sqliteSchemaPath);
    process.exit(1);
  }
} else {
  console.log('Usage: npx tsx scripts/switch-db.ts <postgres|sqlite>');
}
