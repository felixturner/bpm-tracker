# BPM Tracker

Realtime BPM detection and visualization via the Web Audio API.

[Live Demo](https://airtight.cc/demos/bpm-tracker/)

## Description

BPM Tracker is a web application that detects and visualizes the beats per minute (BPM) of music in real-time using the Web Audio API. This app works best with 4/4 music with a strong kick drum.

The observed BPM range is 85 - 170 BPM. BPMs out of this range will be detected at half time or double time. BPM is detected by observing the 100 - 250 Mhz frequency range of the audio spectrum, where the kick drum is prevalent.

One the kick volume history is collected, the app calculates the BPM by finding the peaks in the volume history and calculating the time between them. Once BPMs are detected, a historical list of BPMs is collected over a time range and the most common recent BPM is displayed.

Note: audio playing in other chrome tabs will not be picked up by Web Audio API.

## Screenshot

![BPM Tracker Screenshot](/screenshot.png?raw=true)

## Build Dev

- `npm install`
- `npm run dev`
- Navigate to `http://127.0.0.1:8000/`
- Play some music to see the BPM detection and visualization in action.

## Build Production

- `npm run build`
- Production files are created in `dist` folder

## Credits

BPM detection technique is taken from this blog post: [Beat Detection Using JavaScript and the Web Audio API](http://joesul.li/van/beat-detection-using-web-audio/) This project adds realtime detection and visualization.

This project is developed by Felix Turner. [airtight.cc](https://airtight.cc)

## License

MIT
