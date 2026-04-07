const Jimp = require('jimp');
const sharp = require('sharp');
const fs = require('fs');

async function main() {
    const inputPath = 'C:/Users/mubin/.gemini/antigravity/brain/0d84c4e4-4875-4d73-9c05-d729e21bf910/media__1775568771563.jpg';
    
    console.log('1. Removing background...');
    const image = await Jimp.read(inputPath);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        // Threshold for white background, make it transparent
        if (r > 180 && g > 180 && b > 180) {
            this.bitmap.data[idx + 3] = 0; // Transparent
        }
    });

    const tempTransPath = 'temp_transparent.png';
    await image.writeAsync(tempTransPath);
    
    console.log('2. Compositing final icons...');
    // Cream yellow: r: 255, g: 247, b: 230
    const creamYellow = { r: 255, g: 247, b: 230, alpha: 1 };
    const transparentBg = { r: 0, g: 0, b: 0, alpha: 0 };
    
    // create background
    await sharp({
        create: { width: 1024, height: 1024, channels: 4, background: creamYellow }
    }).png().toFile('assets/icon-background.png');
    
    // Trim logo, scale up significantly without black letterbox!
    const fgSize = 850; 
    const trimmedLogoBuffer = await sharp(tempTransPath)
        .trim({ threshold: 10, background: transparentBg })
        .resize({ width: fgSize, height: fgSize, fit: 'contain', background: transparentBg })
        .png()
        .toBuffer();
        
    await sharp({
        create: { width: 1024, height: 1024, channels: 4, background: transparentBg }
    })
    .composite([{ input: trimmedLogoBuffer, gravity: 'center' }])
    .png()
    .toFile('assets/icon-foreground.png');
    
    // Standard flat icon
    await sharp({
        create: { width: 1024, height: 1024, channels: 4, background: creamYellow }
    })
    .composite([{ input: trimmedLogoBuffer, gravity: 'center' }])
    .png()
    .toFile('assets/icon.png');
    
    // Update public icon for PWA
    const pwaLogoBuffer = await sharp(trimmedLogoBuffer)
        .resize({ width: 425, height: 425, fit: 'contain', background: transparentBg })
        .png()
        .toBuffer();
        
    await sharp({
        create: { width: 512, height: 512, channels: 4, background: creamYellow }
    })
    .composite([{ input: pwaLogoBuffer, gravity: 'center' }])
    .png()
    .toFile('public/icon.png');

    // Splash screen
    const splashLogoBuffer = await sharp(tempTransPath)
        .trim()
        .resize({ width: 1200, height: 1200, fit: 'contain', background: transparentBg })
        .png()
        .toBuffer();
        
    await sharp({
        create: { width: 2732, height: 2732, channels: 4, background: creamYellow }
    })
    .composite([{ input: splashLogoBuffer, gravity: 'center' }])
    .png()
    .toFile('assets/splash.png');
    
    // Rename icon-foreground to icon-only.png as fallback
    fs.copyFileSync('assets/icon-foreground.png', 'assets/icon-only.png');
    
    console.log('Icons prepared successfully without black borders.');
}
main().catch(console.error);
