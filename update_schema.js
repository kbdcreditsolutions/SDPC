const fs = require('fs');
const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('attachments   Json?')) {
  schema = schema.replace(
    'note          String\n  date          DateTime     @default(now())\n  deletedAt     DateTime?',
    'note          String\n  attachments   Json?\n  date          DateTime     @default(now())\n  deletedAt     DateTime?'
  );
  fs.writeFileSync(schemaPath, schema);
  console.log('Schema updated.');
} else {
  console.log('Schema already has attachments.');
}
