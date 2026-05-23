import sharp from 'sharp';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'frontend', 'public', 'icon-512.png');
const res = join(__dirname, 'app', 'src', 'main', 'res');
const resourcesDir = join(root, 'resources');

mkdirSync(resourcesDir, { recursive: true });
copyFileSync(src, join(resourcesDir, 'app-icon-source.png'));

const sizes = [
  [48, 'mipmap-mdpi'],
  [72, 'mipmap-hdpi'],
  [96, 'mipmap-xhdpi'],
  [144, 'mipmap-xxhdpi'],
  [192, 'mipmap-xxxhdpi'],
];

const fgSizes = [
  [108, 'mipmap-mdpi'],
  [162, 'mipmap-hdpi'],
  [216, 'mipmap-xhdpi'],
  [324, 'mipmap-xxhdpi'],
  [432, 'mipmap-xxxhdpi'],
];

for (const [size, folder] of sizes) {
  const dir = join(res, folder);
  mkdirSync(dir, { recursive: true });
  const out = join(dir, 'ic_launcher.png');
  await sharp(src).resize(size, size).png().toFile(out);
  await sharp(src).resize(size, size).png().toFile(join(dir, 'ic_launcher_round.png'));
  console.log(`  ${out}`);
}

for (const [size, folder] of fgSizes) {
  const out = join(res, folder, 'ic_launcher_foreground.png');
  await sharp(src).resize(size, size).png().toFile(out);
  console.log(`  ${out}`);
}

await sharp(src).resize(512, 512).png().toFile(join(resourcesDir, 'play-store-icon-512.png'));
console.log(`  ${join(resourcesDir, 'play-store-icon-512.png')} (Play Console listing)`);
console.log('Done.');
