import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 192;

  // Background
  ctx.fillStyle = '#1c1b18';
  ctx.fillRect(0, 0, size, size);

  // Accent rectangle
  ctx.fillStyle = '#ff2d8a';
  ctx.fillRect(size * 0.15, size * 0.35, size * 0.7, size * 0.3);

  // ▶ play triangle
  ctx.fillStyle = '#ece2c9';
  ctx.beginPath();
  ctx.moveTo(size * 0.38, size * 0.4);
  ctx.lineTo(size * 0.38, size * 0.6);
  ctx.lineTo(size * 0.62, size * 0.5);
  ctx.closePath();
  ctx.fill();

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', drawIcon(192));
writeFileSync('public/icons/icon-512.png', drawIcon(512));
console.log('Icons generated!');
