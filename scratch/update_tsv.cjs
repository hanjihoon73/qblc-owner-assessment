const fs = require('fs');
const content = fs.readFileSync('docs/questions_upload.tsv', 'utf-8');
const lines = content.split('\n');
const newLines = lines.map((line, i) => {
  if (!line.trim()) return line;
  const parts = line.split('\t');
  if (i === 0) {
    if (parts[1] !== 'set_id') {
      parts.splice(1, 0, 'set_id');
    }
  } else {
    // If it's already updated, parts length might be 12. 
    // Let's just safely check if we need to insert 'A'
    if (parts.length === 11) {
      parts.splice(1, 0, 'A'); // Set default set_id to 'A'
    }
  }
  return parts.join('\t');
});
fs.writeFileSync('docs/questions_upload.tsv', newLines.join('\n'), 'utf-8');
console.log('Successfully updated questions_upload.tsv');
