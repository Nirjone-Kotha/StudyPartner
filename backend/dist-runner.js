const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, 'dist', 'main.js'),
  path.join(__dirname, 'dist', 'src', 'main.js'),
  path.join(__dirname, 'dist', 'main'),
  path.join(__dirname, 'dist', 'src', 'main'),
];

const entry = candidates.find((c) => fs.existsSync(c));

if (!entry) {
  console.error('❌ Could not find main entry point in dist!');
  console.error('Checked candidates:', candidates);
  try {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      console.error('Contents of dist folder:', fs.readdirSync(distPath));
    } else {
      console.error('dist folder does not exist at:', distPath);
    }
  } catch (err) {
    console.error('Error listing dist:', err);
  }
  process.exit(1);
}

console.log('🚀 Starting backend entry from:', entry);
require(entry);

