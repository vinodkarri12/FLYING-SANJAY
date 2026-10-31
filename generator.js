const fs = require('fs');

const b64 = JSON.parse(fs.readFileSync('assets/sanjay_base64.json', 'utf8'));
let tpl = fs.readFileSync('template.html', 'utf8');

tpl = tpl.replace('__SANJAY_HERO_B64__', b64.sanjay_hero);
tpl = tpl.replace('__SANJAY_FAIL_B64__', b64.sanjay_fail);
tpl = tpl.replace('__SANJAY_SMILE_B64__', b64.sanjay_smile);
if (b64.uploaded_song) {
  tpl = tpl.replace('__UPLOADED_SONG_B64__', b64.uploaded_song);
}

fs.writeFileSync('index.html', tpl, 'utf8');
console.log('index.html generated, size:', fs.statSync('index.html').size);
