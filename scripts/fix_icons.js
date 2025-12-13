const fs = require('fs');
const path = require('path');

const sourcePath = '/Users/vincenzogagliano/.gemini/antigravity/brain/d2b4f6e7-42fc-4ff0-a6d2-bf8a5c3f8cd2/icon_padded_1765643067154.png';
const destDir = '/Users/vincenzogagliano/Desktop/AgendaVE/assets/images';
const targets = ['icon-final.png', 'adaptive-icon-final.png'];

console.log('Starting icon recovery...');

if (!fs.existsSync(sourcePath)) {
    console.error('ERROR: Source file not found:', sourcePath);
    process.exit(1);
}

targets.forEach(target => {
    const destPath = path.join(destDir, target);
    try {
        if (fs.existsSync(destPath)) {
            fs.unlinkSync(destPath);
            console.log(`Deleted existing ${target}`);
        }
        fs.copyFileSync(sourcePath, destPath);
        console.log(`SUCCESS: Copied to ${destPath}`);
        // Verify size
        const stats = fs.statSync(destPath);
        console.log(`Verified size: ${stats.size} bytes`);
    } catch (err) {
        console.error(`ERROR copying to ${target}:`, err);
    }
});
console.log('Done.');
```
