import { gsap } from 'gsap';
import { $, $$ } from './lib/QuerySelector.js';
import { AudioAnalyser } from './AudioAnalyser.js';
import { BPMDetector } from './BPMDetector.js';
import { BPMDetectorViz } from './BPMDetectorViz.js';
import { AudioPlayer } from './AudioPlayer.js';
import { AudioAnalyserViz } from './AudioAnalyserViz.js';
import { Wave } from './Wave.js';

let audioAnalyser;
let audioAnalyserViz;
let audioPlayer;
let bpmDetector;
let bpmDetectorViz;
let waveViz;
let lastBeatIsLeft = false;

function init() {
  $('#start-btn').onclick = start;
  $('#reset-btn').onclick = resetBPM;
  $('#info-btn').onclick = showInfo;
  waveViz = new Wave($('#sine-wave'));
}
function showInfo() {
  toggleVisibility($('#info'));
  $('#info-btn').classList.toggle('open');
}

function toggleVisibility(elem) {
  elem.style.visibility =
    elem.style.visibility === 'visible' ? 'hidden' : 'visible';
}

async function start() {
  $$('.hidden-at-start').forEach((el) => {
    el.style.visibility = 'visible';
  });
  $('#start-btn').style.visibility = 'hidden';
  //CALL ONCE AFTER USER CLICK
  audioPlayer = new AudioPlayer();
  await audioPlayer.getMic();
  audioAnalyser = new AudioAnalyser(audioPlayer.context);
  audioAnalyser.connectSource(audioPlayer.source);
  audioAnalyserViz = new AudioAnalyserViz(audioAnalyser, $('#aa-viz-holder'));
  bpmDetector = new BPMDetector(audioAnalyser, 100, 200, 1);
  bpmDetectorViz = new BPMDetectorViz(bpmDetector, $('#bpm-viz-holder'));

  audioAnalyserViz.setBPMRange(
    bpmDetector.minFreq,
    bpmDetector.maxFreq,
    bpmDetector.name
  );

  update();
}

function rationalBump(x, k) {
  return 1.0 / (1.0 + k * x * x);
}

function update() {
  requestAnimationFrame(update);

  $('#conf-meter-inner').style.width = `${bpmDetector.historicalConf * 100}%`;

  if (!bpmDetector.isConfident) {
    $('#bpm-text').style.visibility = 'hidden';
    $('#sine-wave').style.visibility = 'visible';
    $('#sweeper').style.visibility = 'hidden';
    $('#pulser').style.visibility = 'hidden';
    $('#conf-meter-inner').style.backgroundColor = '#aaa';
    waveViz.update();
    return;
  }

  $('#bpm-text').style.visibility = 'visible';
  $('#bpm-text').innerHTML = bpmDetector.detectedBPM;
  $('#sweeper').style.visibility = 'visible';
  $('#pulser').style.visibility = 'visible';
  gsap.set('#sweeper', { rotation: bpmDetector.getBeatTime(4) * 360 });
  $('#sine-wave').style.visibility = 'hidden';

  //animate BPM text scale
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

function resetBPM() {
  bpmDetector.resetBPM();
}

init();
