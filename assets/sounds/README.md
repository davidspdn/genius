This folder is intended to hold local sound assets for the Genius (Simon) game.

Provided helpers
- `../../tools/download_sounds.js` — a small Node script that downloads four public sound files into this folder.

How to get local sounds
1. From your project root run:

   node tools/download_sounds.js

   This will fetch 4 example .ogg files and save them here as `sound0.ogg`..`sound3.ogg`.

2. After downloading, you can modify `App.js` to use local requires instead of remote URLs. Example:

   // replace the SOUND_URLS array with local requires
   const SOUND_URLS = [
     require('./assets/sounds/sound0.ogg'),
     require('./assets/sounds/sound1.ogg'),
     require('./assets/sounds/sound2.ogg'),
     require('./assets/sounds/sound3.ogg'),
   ];

Notes
- Using `require('./assets/sounds/xxx.ogg')` will include the asset in the bundle. Make sure the files exist before building.
- You can also place your own .mp3/.wav/.ogg files here and update the requires accordingly.
