/*

  Audio Analyser 
  
  can choose between linear or logarithmic scale

  publishes:
    freqData - length: fftSize/2. range: 0 - 255
    
    - cleanup log lookup like https://github.com/mattdesl/spectrum/

*/

const maxVal = 255;

export class AudioAnalyser {
  constructor(context, options = {}) {
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = options.fftSize || 4096;
    this.analyser.smoothingTimeConstant = options.smoothingTimeConstant || 0; // faster response
    //The frequencies are spread linearly from 0 to 1/2 of the sample rate.
    //For example, for 48000 sample rate, the last item of the array will represent the decibel value for 24000 Hz.
    this.maxRangeFreq = context.sampleRate / 2;
    this.binCount = this.analyser.frequencyBinCount;

    //OUTPUTS
    this.freqData = new Uint8Array(this.binCount);
    this.volume = 0;
    this.logData = new Uint8Array(this.binCount);
    this.isConnected = false;
    this.update = this.update.bind(this);
    this.update();
  }

  connectSource(source) {
    if (this.source) this.source.disconnect(this.analyser);
    this.source = source;
    this.source.connect(this.analyser);
    this.isConnected = true;
  }

  getBinIndex(freq) {
    return Math.round((freq / this.maxRangeFreq) * (this.binCount - 1));
  }

  //get average volume in a frequency range as 0-1 value
  getVolumeInRange(minFreq, maxFreq) {
    const startIndex = this.getBinIndex(minFreq);
    const endIndex = this.getBinIndex(maxFreq);
    let total = this.freqData
      .slice(startIndex, endIndex + 1)
      .reduce((acc, value) => acc + value, 0);
    let volume = total / (endIndex - startIndex);
    volume /= 255; //convert to 0-1 range
    return volume;
  }

  update() {
    requestAnimationFrame(this.update);
    if (!this.isConnected) return;
    this.analyser.getByteFrequencyData(this.freqData);
    this.calcLogArray();
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

  log(n) {
    return Math.log(n) / Math.log(2);
  }

  getLogIndex(binIndex) {
    //return Math.round(this.toLog(binIndex, 1, this.binCount));
    return this.toLog(binIndex, 1, this.binCount - 1);
  }

  calcLogArray() {
    for (let i = 0; i < this.binCount; i++) {
      let logIndex = this.getLogIndex(i);
      //let logIndex = this.log(i);

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
}
