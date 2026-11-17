#!/usr/bin/env node
/** public/favicon.svg → PWA 아이콘들 + 다중 크기 ICO */
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const source = 'public/favicon.svg';
const MASKABLE_SIZE = 410;
const MASKABLE_OFFSET = (512 - MASKABLE_SIZE) / 2;

await sharp(source).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(source).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(source).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(source).resize(48, 48).png().toFile('public/favicon-48.png');
await sharp(source).resize(96, 96).png().toFile('public/favicon-96.png');

const maskable = await sharp(source).resize(MASKABLE_SIZE, MASKABLE_SIZE).png().toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 11, g: 107, b: 91, alpha: 1 },
  },
})
  .composite([{ input: maskable, top: MASKABLE_OFFSET, left: MASKABLE_OFFSET }])
  .png()
  .toFile('public/icon-maskable-512.png');

// ICO 컨테이너에 16·32·48·96px PNG를 담는다. 구글 검색 파비콘은 48px 이상을 요구한다.
const icoSizes = [16, 32, 48, 96];
const faviconPngs = await Promise.all(
  icoSizes.map((size) => sharp(source).resize(size, size).png().toBuffer()),
);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(icoSizes.length, 4); // image count
const entries = [];
let offset = header.length + icoSizes.length * 16;
for (const [index, size] of icoSizes.entries()) {
  const png = faviconPngs[index];
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0); // width
  entry.writeUInt8(size, 1); // height
  entry.writeUInt8(0, 2); // palette colors
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  entries.push(entry);
  offset += png.length;
}
writeFileSync('public/favicon.ico', Buffer.concat([header, ...entries, ...faviconPngs]));

console.log('PWA 아이콘·favicon.ico 생성 완료');
