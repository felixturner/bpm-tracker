/*

  Web app using BPMDetector to visualize BPM from microphone input

*/
import { gsap } from 'gsap';
import { $, $$ } from './lib/QuerySelector.js';
import { AudioPlayer } from './AudioPlayer.js';
import { AudioAnalyser } from './AudioAnalyser.js';
import { BPMDetector } from './BPMDetector.js';
import { BPMDetectorViz } from './BPMDetectorViz.js';
import { AudioAnalyserViz } from './AudioAnalyserViz.js';
import { Wave } from './Wave.js';

let bpmDetector;
let lastBeatIsLeft = false;

function init() {
  $('#start-btn').onclick = start;
  $('#reset-btn').onclick = resetBPM;
  $('#info-btn').onclick = toggleInfo;
  const waveViz = new Wave($('#sine-wave'));
}

async function start() {
  $$('.hidden-at-start').forEach((el) => {
    showEl(el);
  });
  showEl($('#start-btn'), false);
  //Init audio after user click
  const audioPlayer = new AudioPlayer();
  await audioPlayer.getMic();
  const audioAnalyser = new AudioAnalyser(audioPlayer.context);
  audioAnalyser.connectSource(audioPlayer.source);
  const audioAnalyserViz = new AudioAnalyserViz(
    audioAnalyser,
    $('#aa-viz-holder')
  );
  bpmDetector = new BPMDetector(audioAnalyser, 100, 200, 1);
  const bpmDetectorViz = new BPMDetectorViz(bpmDetector, $('#bpm-viz-holder'));

  audioAnalyserViz.setBPMRange(bpmDetector.minFreq, bpmDetector.maxFreq);

  update();
}

function update() {
  requestAnimationFrame(update);

  $('#conf-meter-inner').style.width = `${bpmDetector.historicalConf * 100}%`;

  if (!bpmDetector.isConfident) {
    showBPMVisualizer(false);
    $('#conf-meter-inner').style.backgroundColor = '#aaa';
    return;
  }

  //show BPM visualizer
  showBPMVisualizer(true);
  gsap.set('#sweeper', { rotation: bpmDetector.getBeatTime(4) * 360 });

  //animate BPM text scale
  $('#bpm-text').innerHTML = bpmDetector.detectedBPM;
  const val = rationalBump(bpmDetector.getBeatTime() - 0.5, 260);
  gsap.set('#bpm-text', { scale: 1 + val * 0.15 });
  $('#conf-meter-inner').style.backgroundColor = '#FFF';

  //animate stepper
  let beatIsLeft = bpmDetector.getBeatTime() < 0.5;
  if (beatIsLeft !== lastBeatIsLeft) {
    lastBeatIsLeft = beatIsLeft;
    $('#stepper-left').classList.toggle('on', beatIsLeft);
    $('#stepper-right').classList.toggle('on', !beatIsLeft);
    //animate pulse
    if (!beatIsLeft) {
      gsap.fromTo(
        '#pulser',
        { scale: 1, opacity: 1 },
        {
          scale: 1.7,
          opacity: 0,
          ease: 'expo.out',
          duration: (bpmDetector.bpmMS / 1000) * 1,
        }
      );
    }
  }
}

// Toggle the visibility of the BPM visualizer elements
function showBPMVisualizer(show) {
  showEl($('#bpm-text'), show);
  showEl($('#sweeper'), show);
  showEl($('#pulser'), show);
  showEl($('#sine-wave'), !show);
}

function toggleInfo() {
  toggleVisibility($('#info'));
  $('#info-btn').classList.toggle('open');
}

function showEl(elem, show = true) {
  elem.style.visibility = show ? 'visible' : 'hidden';
}

function toggleVisibility(elem) {
  elem.style.visibility =
    elem.style.visibility === 'visible' ? 'hidden' : 'visible';
}

function resetBPM() {
  bpmDetector.resetBPM();
}

function rationalBump(x, k) {
  return 1.0 / (1.0 + k * x * x);
}

init();
