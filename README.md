# LoveFreq Web Radio Interface 🎧📻

## Overview
LoveFreq is an interactive web-based radio interface that simulates a vintage tuner experience using modern web technologies. It features:

- 🧊 A glassmorphic navigation bar with smooth scroll links.
- 📺 A main radio display showing frequency, station name, and now playing information with typewriter and glow animations.
- 📶 An animated FM spectrum analyzer with tuning indicator.
- 🗂️ A detailed information panel displaying signal strength, track info, and technical stats.
- 🎛️ Interactive controls including presets, play/pause, skip, and scanning mode.
- ❤️ A special "Love Radio" station with user choice for a custom track.

## Getting Started 🚀
To run LoveFreq locally:

1. 🗂️ Clone or download the project folder.
2. ✅ Ensure the following files and folders are present:
   - `index.html` (main HTML file)
   - `style.css` (styling and animations)
   - `script.js` (radio logic and interactivity)
   - `audio/` (folder containing .mp3 files for stations)
3. 🌐 Because modern browsers restrict audio playback over the file:// protocol, serve the folder with a simple HTTP server. For example:

   ```bash
   # Python 3.x
   cd path/to/project
   python -m http.server 8000
   # Then open http://localhost:8000 in your browser
   ```

4. 🌍 Open a modern browser (Chrome, Firefox, Edge) and navigate to the local server URL.

## Usage 🎮
- 🔘 Click or tap the tuning knob to change stations.
- 🎚️ Use the preset buttons (1–4) to jump to saved frequencies. The 4th preset launches "Love Radio", prompting you to choose a track.
- ⏯️ Play/Pause: Click the large central button to start or stop playback.
- ⏮⏭ Skip Forward/Backward: Use to jump between stations in sequence.
- 🔁 Scan Mode: Activates automatic cycling through all stations every 2 seconds; click again to stop.
- 🌈 Observe the animated spectrum bars and tuning indicator for a realistic radio feel.

## File Structure 🗃️

```
LoveFreq/
│
├─ index.html        # Main HTML markup
├─ style.css         # Styles, glassmorphism, animations
├─ script.js         # JavaScript logic for audio and UI
└─ audio/
   ├─ salem.mp3
   ├─ iqra.mp3
   ├─ abdelrahmank.mp3
   ├─ naz1.mp3
   └─ naz2.mp3
```

## Customization 🛠️
- ➕ To add or edit stations, modify the `stations` array in `script.js`.
- 🎨 Adjust CSS variables or rules in `style.css` to change colors, fonts, or animations.
- 🎵 Replace audio files in the `audio/` folder with your own .mp3 tracks, ensuring file paths match.

## Browser Compatibility 🌐
LoveFreq is built with standard HTML5, CSS3, and vanilla JavaScript. It should work in all modern browsers that support:

- `<audio>` element with JavaScript control
- CSS `backdrop-filter` for glassmorphism (fallbacks will display semi-transparent backgrounds)
- Flexbox and Grid layouts
- CSS animations and keyframes

## Acknowledgments 🙏
Inspired by classic Braun radio designs and modern glassmorphism trends.
