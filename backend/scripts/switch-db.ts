import fs from 'fs';
import path from 'path';

const target = process.argv[2]; // 'postgres' | 'sqlite'
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const postgresSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');

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
  let content = fs.readFileSync(schemaPath, 'utf8');
  content = content.replace('provider = "postgresql"', 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, content, 'utf8');
  console.log('✅ Switched prisma/schema.prisma to SQLite (Local dev mode).');
} else {
  console.log('Usage: npx tsx scripts/switch-db.ts <postgres|sqlite>');
}
