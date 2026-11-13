#!/usr/bin/env node
/** public/og.svg → public/og-default.png (1200×630) */
import sharp from 'sharp';

await sharp('public/og.svg', { density: 144 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile('public/og-default.png');

console.log('public/og-default.png 생성 완료 (1200×630)');
