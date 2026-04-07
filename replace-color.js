const Jimp = require('jimp');
const sharp = require('sharp');
const fs = require('fs');

async function main() {
    const inputPath = 'C:/Users/mubin/.gemini/antigravity/brain/0d84c4e4-4875-4d73-9c05-d729e21bf910/media__1775568771563.jpg';
    
    // Katalk yellow is #FEE500 -> R:254, G:229, B:0
    const yellow = { r: 254, g: 229, b: 0, a: 255 };

    console.log('Loading image...');
    const image = await Jimp.read(inputPath);
    
    console.log('Scanning pixels...');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const a = this.bitmap.data[idx + 3];
        
        // Define "white-ish" or "light grey-ish (the grid background)"
        if (r > 210 && g > 210 && b > 210) {
            this.bitmap.data[idx + 0] = yellow.r;
            this.bitmap.data[idx + 1] = yellow.g;
            this.bitmap.data[idx + 2] = yellow.b;
            this.bitmap.data[idx + 3] = 255;
        }
    });

    const tempPath = 'temp_yellow.jpg';
    console.log('Writing temp image...');
    await image.writeAsync(tempPath);
    
    console.log('Processing icon for Next.js PWA...');
    await sharp(tempPath)
        .resize(512, 512, { fit: 'contain', background: { r: 254, g: 229, b: 0, alpha: 1 } })
        .png()
        .toFile('public/icon.png');
        
    console.log('Generating Capacitor icon...');
    await sharp(tempPath)
        .resize(1024, 1024, { fit: 'contain', background: { r: 254, g: 229, b: 0, alpha: 1 } })
        .png()
        .toFile('assets/icon.png');
        
    console.log('Generating Capacitor splash...');
    await sharp(tempPath)
        .resize(2732, 2732, { fit: 'contain', background: { r: 254, g: 229, b: 0, alpha: 1 } })
        .png()
        .toFile('assets/splash.png');
        
    console.log('Images generated successfully.');
}

main().catch(console.error);
