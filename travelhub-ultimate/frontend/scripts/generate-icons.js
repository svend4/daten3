/**
 * Generate PWA icons from SVG
 * This script creates PNG icons of various sizes from the base SVG icon
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const iconsDir = join(publicDir, 'icons');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Simple PNG generator using data URIs
// This creates a basic solid color icon as placeholder
function generatePlaceholderIcon(size) {
  // Create a simple canvas-based PNG using HTML canvas in Node
  // Since we don't have canvas library, we'll create an SVG that works as PNG fallback

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#3b82f6"/>
  <g transform="translate(${size/2}, ${size/2})">
    <circle cx="0" cy="0" r="${size * 0.27}" fill="none" stroke="#ffffff" stroke-width="${size * 0.016}"/>
    <circle cx="0" cy="0" r="${size * 0.21}" fill="none" stroke="#ffffff" stroke-width="${size * 0.008}" opacity="0.5"/>
    <ellipse cx="0" cy="0" rx="${size * 0.27}" ry="${size * 0.12}" fill="none" stroke="#ffffff" stroke-width="${size * 0.008}" opacity="0.6"/>
    <ellipse cx="0" cy="0" rx="${size * 0.12}" ry="${size * 0.27}" fill="none" stroke="#ffffff" stroke-width="${size * 0.008}" opacity="0.6"/>
    <g transform="translate(${size * 0.16}, ${-size * 0.16}) rotate(45)">
      <rect x="${-size * 0.016}" y="${-size * 0.078}" width="${size * 0.031}" height="${size * 0.156}" rx="${size * 0.016}" fill="#ffffff"/>
      <rect x="${-size * 0.117}" y="${-size * 0.02}" width="${size * 0.234}" height="${size * 0.039}" rx="${size * 0.02}" fill="#ffffff"/>
      <rect x="${-size * 0.049}" y="${size * 0.059}" width="${size * 0.098}" height="${size * 0.023}" rx="${size * 0.012}" fill="#ffffff"/>
    </g>
    <text x="${-size * 0.059}" y="${size * 0.029}" font-family="Arial, sans-serif" font-size="${size * 0.156}" font-weight="bold" fill="#ffffff">T</text>
  </g>
</svg>`;

  return svg;
}

console.log('📱 Generating PWA icons...');

// Ensure icons directory exists
try {
  mkdirSync(iconsDir, { recursive: true });
} catch (e) {
  // Directory already exists
}

// Generate each size
sizes.forEach(size => {
  const svg = generatePlaceholderIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = join(iconsDir, filename);

  writeFileSync(filepath, svg);
  console.log(`✓ Generated ${filename}`);
});

// Also create the shortcut icons
const shortcutIcons = [
  { name: 'hotel-icon.svg', emoji: '🏨', color: '#3b82f6' },
  { name: 'flight-icon.svg', emoji: '✈️', color: '#3b82f6' }
];

shortcutIcons.forEach(({ name, emoji, color }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" rx="14" fill="${color}"/>
  <text x="48" y="68" text-anchor="middle" font-size="56">${emoji}</text>
</svg>`;

  writeFileSync(join(iconsDir, name), svg);
  console.log(`✓ Generated ${name}`);
});

console.log('✅ All icons generated successfully!');
