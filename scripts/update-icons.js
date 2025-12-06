const fs = require('fs');
const path = require('path');

const sourcePath = 'C:/Users/USER/.gemini/antigravity/brain/5c86fb26-26c3-4ab0-8d35-678b2ade3dfa/billkhata_app_icon_1765025451889.png';
const publicDir = path.join(process.cwd(), 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

const filesToCreate = [
    'icon.png',
    'apple-icon.png',
    'logo.png', // Update the main logo too if referenced
    'icons/icon-72x72.png',
    'icons/icon-96x96.png',
    'icons/icon-128x128.png',
    'icons/icon-144x144.png',
    'icons/icon-152x152.png',
    'icons/icon-192x192.png',
    'icons/icon-384x384.png',
    'icons/icon-512x512.png'
];

try {
    const iconData = fs.readFileSync(sourcePath);
    console.log(`Read source icon from ${sourcePath}, size: ${iconData.length} bytes`);

    filesToCreate.forEach(file => {
        const destPath = path.join(publicDir, file);
        fs.writeFileSync(destPath, iconData);
        console.log(`Created ${file}`);
    });

    console.log('All icons updated successfully.');
} catch (error) {
    console.error('Error updating icons:', error);
    process.exit(1);
}
