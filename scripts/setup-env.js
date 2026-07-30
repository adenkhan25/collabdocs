const fs = require('fs');
const path = require('path');

const targets = [
  { example: path.join(__dirname, '..', 'backend', '.env.example'), out: path.join(__dirname, '..', 'backend', '.env') },
  { example: path.join(__dirname, '..', 'frontend', '.env.example'), out: path.join(__dirname, '..', 'frontend', '.env') },
];

for (const { example, out } of targets) {
  try {
    if (fs.existsSync(example) && !fs.existsSync(out)) {
      fs.copyFileSync(example, out);
      console.log(`Created ${path.relative(process.cwd(), out)} from .env.example`);
    }
  } catch (err) {
    console.warn(`Could not create env file at ${out}:`, err.message);
  }
}
