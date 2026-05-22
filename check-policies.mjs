import fs from 'fs';

const content = fs.readFileSync('esquema_completo.sql', 'utf-8');
const lines = content.split('\n');

console.log("Searching for checkins policies in esquema_completo.sql...");
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('policy') && line.toLowerCase().includes('checkins')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
