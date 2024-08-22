/*

  Audio Analyser 
  
  can choose between linear or logarithmic scale

  publishes:
    freqData - length: fftSize/2. range: 0 - 255
    waveData - length: fftSize. range: 0 - 255. 128 is no sound
    volume - ave volume range: 0 - 1
    bands[i].volume - ave volume in range: 0 - 1
    TODO 
    - cleanup log lookup like https://github.com/mattdesl/spectrum/

*/

const maxVal = 255;

export class AudioAnalyser {
  constructor(context, fftSize = 4096) {
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = fftSize;
    // this.analyser.minDecibels = -120; //default: -100
    // this.analyser.maxDecibels = 0; //default: -30
    this.analyser.smoothingTimeConstant = 0.8; //default: 0.8

    //The frequencies are spread linearly from 0 to 1/2 of the sample rate.
    //For example, for 48000 sample rate, the last item of the array will represent the decibel value for 24000 Hz.
    this.maxRangeFreq = context.sampleRate / 2;

    console.log('context.sampleRate', context.sampleRate);

    this.binCount = this.analyser.frequencyBinCount; //fftSize / 2

    //OUTPUTS
    this.freqData = new Uint8Array(this.binCount);
    this.waveData = new Uint8Array(fftSize); //fftSize
    this.volume = 0;
    this.logData = new Uint8Array(this.binCount);

    console.log(
      'AudioAnalyser binCount:',
      this.binCount,
      ' maxRangeFreq:',
      this.maxRangeFreq,
      this.analyser.smoothingTimeConstant
    );
    this.isConnected = false;

    this.lastTime = 0;
    this.beatTime = 0;

    this.update = this.update.bind(this);
    this.update();
  }

  connectSource(source) {
    if (this.source) this.source.disconnect(this.analyser);
    this.source = source;
    this.source.connect(this.analyser);
    this.isConnected = true;
  }

  getVolume() {
    //returns 0-256
    let value = 0;
    for (let i = 0; i < this.freqData.length; i++) {
      value += this.freqData[i];
    }
    return value / this.freqData.length / maxVal;
  }

  //from https://stackoverflow.com/questions/9367732/plotting-logarithmic-graph-javascript
  getFreqLogIndex(freq) {
    let min_f = Math.log(20) / Math.log(10);
    let max_f = Math.log(this.maxRangeFreq) / Math.log(10);
    let range = max_f - min_f;
    return (Math.log(freq) / Math.log(10) - min_f) / range;
  }

  //from https://stackoverflow.com/questions/35799286/get-logarithmic-bytefrequencydata-from-audio
  toLog(value, min, max) {
    let exp = (value - min) / (max - min);
    return min * Math.pow(max / min, exp);
  }

  getLogIndex(binIndex) {
    //return Math.round(this.toLog(binIndex, 1, this.binCount));
    return this.toLog(binIndex, 1, this.binCount - 1);
  }

  calcLogArray() {
    for (let i = 0; i < this.binCount; i++) {
      let logIndex = this.getLogIndex(i);

      //single sample
      //logIndex = Math.round(logIndex);
      //let val = this.freqData[logIndex];

      //As the logindex will probably be decimal, we need to interpolate (in this case linear interpolation)
      let low = Math.floor(logIndex);
      let high = Math.ceil(logIndex);
      let lv = this.freqData[low];
      let hv = this.freqData[high];
      let w = (logIndex - low) / (high - low);
      let val = lv + (hv - lv) * w;

      this.logData[i] = val;
    }
  }

  update() {
    //console.log('AA ups');
    let time = performance.now();
    let delta = time - this.lastTime;
    this.lastTime = time;
    //console.log(time, delta);
    requestAnimationFrame(this.update);
    if (!this.isConnected) return;
    //returns 0 - 256 range.
    this.analyser.getByteFrequencyData(this.freqData);
    //returns 0 - 256 range. 128 is middle
    this.analyser.getByteTimeDomainData(this.waveData);
    this.calcLogArray();
    this.volume = this.getVolume();
  }
}
