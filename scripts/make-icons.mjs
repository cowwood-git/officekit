#!/usr/bin/env node
/** public/favicon.svg → PWA 아이콘들 */
import sharp from 'sharp';

const source = 'public/favicon.svg';

await sharp(source).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(source).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(source).resize(180, 180).png().toFile('public/apple-touch-icon.png');

const maskable = await sharp(source).resize(360, 360).png().toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 11, g: 107, b: 91, alpha: 1 },
  },
})
  .composite([{ input: maskable, top: 76, left: 76 }])
  .png()
  .toFile('public/icon-maskable-512.png');

console.log('PWA 아이콘 생성 완료');
