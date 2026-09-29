const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('frontend');
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('<Divider')) {
    if (!content.includes('Divider') || !content.match(/import.*Divider.*@mui\/material/s)) {
      console.log('Missing import in:', f);
    }
  }
});
