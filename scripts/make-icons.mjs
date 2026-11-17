#!/usr/bin/env node
/** public/favicon.svg → PWA 아이콘들 + 32px ICO */
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const source = 'public/favicon.svg';
const MASKABLE_SIZE = 410;
const MASKABLE_OFFSET = (512 - MASKABLE_SIZE) / 2;

await sharp(source).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(source).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(source).resize(180, 180).png().toFile('public/apple-touch-icon.png');

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

// ICO 컨테이너에 32×32 PNG를 한 장 담는다. 브라우저는 PNG 압축 ICO를 그대로 읽는다.
const faviconPng = await sharp(source).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count
const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0); // width
entry.writeUInt8(32, 1); // height
entry.writeUInt8(0, 2); // palette colors
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(faviconPng.length, 8);
entry.writeUInt32LE(header.length + entry.length, 12);
writeFileSync('public/favicon.ico', Buffer.concat([header, entry, faviconPng]));

console.log('PWA 아이콘·favicon.ico 생성 완료');
