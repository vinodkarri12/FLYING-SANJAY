const fs = require('fs');

const b64Data = JSON.parse(fs.readFileSync('assets/sanjay_base64.json', 'utf8'));

let html = fs.readFileSync('template.html', 'utf8');
html = html.replace('__SANJAY_HERO_B64__', b64Data.sanjay_hero);
html = html.replace('__SANJAY_FAIL_B64__', b64Data.sanjay_fail);
html = html.replace('__SANJAY_SMILE_B64__', b64Data.sanjay_smile);

fs.writeFileSync('index.html', html);
console.log('index.html generated, size:', html.length);
