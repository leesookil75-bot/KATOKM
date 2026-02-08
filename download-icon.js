const fs = require('fs');
const https = require('https');

const file = fs.createWriteStream("public/icon.png");
https.get("https://placehold.co/512x512/4f46e5/ffffff.png?text=OK&font=roboto", response => {
    response.pipe(file);
});
