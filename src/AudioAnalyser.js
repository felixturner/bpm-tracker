/*

  AudioAnalyser publishes frequency data and logarithmic frequency data from an AnalyserNode.
  Logarithmic frequency is a more human readable way to visualize the audio spectrum.
*/

export class AudioAnalyser {
  constructor(context, options = {}) {
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = options.fftSize || 4096;
    this.analyser.smoothingTimeConstant = options.smoothingTimeConstant || 0; // 0 gives faster response
    //The frequencies are spread linearly from 0 to 1/2 of the sample rate.
    //For example, for 48000 sample rate, the last item of the array will represent the decibel value for 24000 Hz.
    this.maxFreq = context.sampleRate / 2;
    this.binCount = this.analyser.frequencyBinCount;
    this.logScale = Math.log(this.binCount) / this.binCount;

    //OUTPUTS
    this.freqData = new Uint8Array(this.binCount);
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

  update() {
    requestAnimationFrame(this.update);
    if (!this.isConnected) return;
    this.analyser.getByteFrequencyData(this.freqData);
    this.calcLogData();
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

  calcLogData() {
    for (let i = 0; i < this.binCount; i++) {
      let index = this.logIndexToIndex(i);
      //As the index will be fractional, we need to interpolate
      let low = Math.floor(index);
      let high = Math.ceil(index);
      let lv = this.freqData[low];
      let hv = this.freqData[high];
      let w = (index - low) / (high - low);
      let val = lv + (hv - lv) * w;
      this.logData[i] = val;
    }
  }

  getBinIndex(freq) {
    return Math.round((freq / this.maxFreq) * this.binCount);
  }

  //log math from https://stackoverflow.com/a/846249/357976
  logIndexToIndex(i) {
    return Math.exp(i * this.logScale);
  }

  indexToLogIndex(i) {
    return Math.log(i) / this.logScale;
  }

  getLogIndexFromFreq(freq) {
    return this.indexToLogIndex(this.getBinIndex(freq));
  }
}
