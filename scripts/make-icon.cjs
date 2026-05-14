// Генерирует build-resources/icon.png (1024×1024) из icon.svg.
// electron-builder сам соберёт icon.ico/icon.icns под нужные платформы.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const root = path.join(__dirname, '..', 'build-resources');
  const svgPath = path.join(root, 'icon.svg');
  const pngPath = path.join(root, 'icon.png');

  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg not found at', svgPath);
    process.exit(1);
  }

  const svg = fs.readFileSync(svgPath);
  await sharp(svg, { density: 384 })
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toFile(pngPath);

  const stat = fs.statSync(pngPath);
  console.log(`✓ ${pngPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
