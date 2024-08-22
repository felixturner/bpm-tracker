import { GUI } from 'lil-gui';
import { GUIOptions } from './lib/GUIOptions.js';
import { $, $$ } from './lib/QuerySelector.js';
import { makeDroppable } from './lib/FileSelect.js';
import { AudioAnalyser } from './AudioAnalyser.js';
import { BPMDetector } from './BPMDetector.js';
import { BPMDetectorViz } from './BPMDetectorViz.js';
import { AudioPlayer } from './AudioPlayer.js';
import { AudioAnalyserViz } from './AudioAnalyserViz.js';

import { gsap } from 'gsap';

import { Wave } from './Wave.js';

let stats;
let audioAnalyser;
let audioAnalyserViz;
let audioPlayer;
let initialized = false;
let bpmDetector;
let bpmDetectorViz;
let clockViz;
let waveViz;

//GUI
let gui = new GUI();

//gui.domElement.style.visibility = 'hidden';
let guiParams = {
  //trim: { type: 'f', value: 1, min: 0.1, max: 1, step: 0.01, gui: true },
  pause: { value: pause, gui: true }, //function
  showMeter: { value: showMeter, gui: true }, //function
  showDebug: { value: showDebug, gui: true }, //function
  showGL: { value: showGL, gui: true }, //function
  //getBPM: { value: getBPM, gui: true }, //function
  // mute: { type: 'b', value: true, gui: true },
  debugBPM: { type: 'b', value: false, gui: true },
  useMic: { type: 'b', value: true, gui: true },
  //gain: { type: 'f', value: 1, min: 0, max: 3, step: 0.001, gui: true },
  minBPM: {
    type: 'f',
    value: 85,
    min: 50,
    max: 200,
    gui: true,
  },
  maxBPM: {
    type: 'f',
    value: 170,
    min: 50,
    max: 200,
    gui: true,
  },
  smoothing: {
    type: 'f',
    value: 0,
    min: 0,
    max: 1,
    step: 0.001,
    gui: true,
  },
  // bpmHistoryLength: {
  //   type: 'f',
  //   value: 20,
  //   min: 5,
  //   max: 60,
  //   step: 1,
  //   gui: true,
  // },
  minFreq: {
    type: 'f',
    value: 100,
    min: 0,
    max: 10000,
    gui: true,
  },
  maxFreq: {
    type: 'f',
    value: 250,
    min: 0,
    max: 10000,
    gui: true,
  },
  peakVolThreshold: {
    type: 'f',
    value: 0.3,
    min: 0,
    max: 1,
    step: 0.001,
    gui: true,
  },
};
let guiOptions = new GUIOptions(guiParams, gui, null, onParamsChange, true);
let lastUseMic;
//gui.close();

function init() {
  //stats
  $('#start-btn').onclick = start;
  $('#reset-btn').onclick = resetBPM;

  waveViz = new Wave($('#sine-wave'));
  //clockViz = new ClockViz($('#clock-viz'));
}
function toggleVis(elem) {
  elem.style.visibility =
    elem.style.visibility === 'visible' ? 'hidden' : 'visible';
}

function showDebug() {
  toggleVis($('.debug'));
}
function showMeter() {
  toggleVis($('.debug-viz'));
}
function showGL() {
  toggleVis($('#webgl'));
}

function pause() {
  bpmDetector.pause();
}

async function start() {
  $$('.hidden-at-start').forEach((el) => {
    el.style.visibility = 'visible';
  });
  $('#start-btn').style.visibility = 'hidden';
  //CALL ONCE AFTER USER CLICK
  initialized = true;
  audioPlayer = new AudioPlayer();
  audioAnalyser = new AudioAnalyser(audioPlayer.context);
  audioAnalyserViz = new AudioAnalyserViz(audioAnalyser, $('#aa-viz-holder'));
  bpmDetector = new BPMDetector(audioAnalyser, 100, 200, 1, 'KICK');
  bpmDetectorViz = new BPMDetectorViz(bpmDetector, $('#bpm-viz-holder'));

  audioAnalyserViz.setBPMRange(
    bpmDetector.minFreq,
    bpmDetector.maxFreq,
    bpmDetector.name
  );

  makeDroppable(document.body, loadMP3File);
  update();
  onParamsChange();
}

async function loadMP3File(file) {
  await audioPlayer.loadMP3File(file);
  audioAnalyser.connectSource(audioPlayer.source);
}

let pulseTween;

let lastBpmIsLeft = false;
let altIsLeft = 0;

function rationalBump(x, k) {
  return 1.0 / (1.0 + k * x * x);
}

function update() {
  requestAnimationFrame(update);
  //clockViz.update(bpmDetector.barTime);
  waveViz.update();

  $('#bpm-debug').innerHTML = `${bpmDetector.currentBPM} CURRENT BPM <br>
  ${bpmDetector.currentConf.toFixed(2)} CURRENT CONFIDENCE <br>
  ${bpmDetector.intervalsCount} INTERVAL COUNT <br>
  ${bpmDetector.peakCount} PEAK COUNT`;

  $('#conf-meter-inner').style.width = `${bpmDetector.historicalConf * 100}%`;

  if (!bpmDetector.isConfident) {
    $('#bpm-text').style.visibility = 'hidden';
    $('#sine-wave').style.visibility = 'visible';
    $('#sweeper').style.visibility = 'hidden';
    $('#conf-meter-inner').style.backgroundColor = '#aaa';
    return;
  }

  $('#bpm-text').style.visibility = 'visible';
  $('#bpm-text').innerHTML = bpmDetector.displayBPM;
  $('#sweeper').style.visibility = 'visible';
  gsap.set('#sweeper', { rotation: bpmDetector.barTime * 360 });
  $('#sine-wave').style.visibility = 'hidden';

  let val = (Math.sin(bpmDetector.bpmTime * Math.PI * 2) + 1) / 2;
  val = rationalBump(bpmDetector.bpmTime - 0.5, 260);
  gsap.set('#bpm-text', { scale: 1 + val * 0.15 });
  $('#conf-meter-inner').style.backgroundColor = '#FFF';

  //stepper
  let bpmIsLeft = bpmDetector.bpmTime < 0.5;
  $('#stepper-left').classList.toggle('on', bpmIsLeft);
  $('#stepper-right').classList.toggle('on', !bpmIsLeft);

  //animate pulse
  if (bpmIsLeft !== lastBpmIsLeft) {
    //console.log('PULSE ', performance.now(), bpmMS);
    lastBpmIsLeft = bpmIsLeft;

    //if (bpmIsLeft) {
    altIsLeft++;
    altIsLeft = altIsLeft % 2;

    if (!altIsLeft) {
      pulseTween = gsap.fromTo(
        '#pulser',
        { scale: 1, opacity: 1 },
        {
          scale: 1.8,
          opacity: 0,
          ease: 'expo.out',
          duration: (bpmDetector.bpmMS / 1000) * 1,
        }
      );
    }
  }
}

async function onParamsChange() {
  if (lastUseMic !== guiParams.useMic.value) {
    if (guiParams.useMic.value) {
      await audioPlayer.getMic();
    } else {
      await audioPlayer.loadMP3Url('../res/chrono.mp3');
      await audioPlayer.loadMP3Url('../res/house-bits-EQ.mp3');
      //await audioPlayer.loadMP3Url('../res/freq-rise.mp3');
    }
  }
  if (initialized) {
    audioAnalyser.analyser.smoothingTimeConstant = guiParams.smoothing.value;
    audioAnalyser.connectSource(audioPlayer.source);
    bpmDetector.minFreq = guiParams.minFreq.value;
    bpmDetector.maxFreq = guiParams.maxFreq.value;
    bpmDetector.peakVolThreshold = guiParams.peakVolThreshold.value;
    // bpmDetector.beatHoldTime = guiParams.beatHoldTime.value;
    // bpmDetector.beatDecay = guiParams.beatDecay.value;

    bpmDetector.minBPM = guiParams.minBPM.value;
    bpmDetector.maxBPM = guiParams.maxBPM.value;
    //bpmDetector.bpmHistoryLength = guiParams.bpmHistoryLength.value;

    audioAnalyserViz.setBPMRange(
      bpmDetector.minFreq,
      bpmDetector.maxFreq,
      bpmDetector.name
    );
  }
  lastUseMic = guiParams.useMic.value;
  bpmDetector.useDebugBPM = guiParams.debugBPM.value;
  //audioPlayer.mute(guiParams.mute.value);
}

function mute() {
  audioPlayer.toggleMute();
}

function resetBPM() {
  bpmDetector.resetBPM();
}

// function getBPM() {
//   console.log('start', performance.now());
//   bpmDetector.getPeaks();
//   console.log('end', performance.now());
// }

init();
