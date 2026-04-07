const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const inputPath = 'C:/Users/mubin/.gemini/antigravity/brain/0d84c4e4-4875-4d73-9c05-d729e21bf910/media__1775568771563.jpg';
const artifactsDir = 'C:/Users/mubin/.gemini/antigravity/brain/0d84c4e4-4875-4d73-9c05-d729e21bf910/artifacts';

const palettes = [
    { name: 'cream_yellow', r: 255, g: 247, b: 230 }, // Soft cream yellow
    { name: 'alice_blue', r: 240, g: 248, b: 255 },  // Light cool blue, makes orange pop
    { name: 'soft_gray', r: 245, g: 246, b: 248 }    // Very light premium gray
];

async function generatePreviews() {
    for (const color of palettes) {
        console.log(`Generating preview for ${color.name}...`);
        const image = await Jimp.read(inputPath);
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            
            // Replace white/light grey background pixels
            if (r > 210 && g > 210 && b > 210) {
                this.bitmap.data[idx + 0] = color.r;
                this.bitmap.data[idx + 1] = color.g;
                this.bitmap.data[idx + 2] = color.b;
            }
        });

        const outputPath = path.join(artifactsDir, `preview_${color.name}.png`);
        await image.writeAsync(outputPath);
    }
    console.log('Previews generated successfully.');
}

generatePreviews().catch(console.error);
