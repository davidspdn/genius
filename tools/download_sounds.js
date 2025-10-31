const https = require('https');
const fs = require('fs');
const path = require('path');

const SOUND_URLS = [
  'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg',
  'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg',
  'https://actions.google.com/sounds/v1/cartoon/doorbell_chime.ogg',
  'https://actions.google.com/sounds/v1/cartoon/metal_thud.ogg',
];

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
          return;
        }
        res.pipe(file);
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });

    file.on('finish', () => file.close(resolve));
    file.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  try {
    console.log('Downloading sounds to', outDir);
    for (let i = 0; i < SOUND_URLS.length; i++) {
      const url = SOUND_URLS[i];
      const ext = path.extname(url).split('?')[0] || '.ogg';
      const dest = path.join(outDir, `sound${i}${ext}`);
      process.stdout.write(`Downloading ${url} -> ${path.relative(process.cwd(), dest)} ... `);
      await download(url, dest);
      console.log('done');
    }
    console.log('All sounds downloaded successfully.');
    console.log('You can now update App.js to use local files (require) if you prefer.');
  } catch (e) {
    console.error('Error downloading sounds:', e);
    process.exit(1);
  }
})();
