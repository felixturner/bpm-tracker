/*

 Draws frequency data of an AudioAnalyser instance to canvas
 Draw with logarithmic freq scale to better show full spectrum
 Additionally draws a band indicating a frequency range for BPM detection

*/

const displayDims = { x: 600, y: 100 };
const maxVal = 255;

export class AudioAnalyserViz {
  constructor(audioAnalyser, domElement) {
    this.audioAnalyser = audioAnalyser;
    this.isLog = true; //TODO
    let canvas = document.createElement('canvas');
    canvas.width = displayDims.x;
    canvas.height = displayDims.y;
    domElement.appendChild(canvas);
    this.ctx = canvas.getContext('2d');
    this.chartWidth = displayDims.x;
    this.update = this.update.bind(this);
    this.update();
  }

  update() {
    requestAnimationFrame(this.update);

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.clearRect(0, 0, displayDims.x, displayDims.y);

    //DRAW FREQ
    let freqData = this.isLog
      ? this.audioAnalyser.logData
      : this.audioAnalyser.freqData;
    this.ctx.fillStyle = '#666';
    this.ctx.beginPath();
    this.ctx.moveTo(0, displayDims.y);
    for (let i = 0; i < freqData.length; i++) {
      let val = freqData[i] / maxVal;
      this.ctx.lineTo(
        (i / freqData.length) * this.chartWidth,
        displayDims.y - val * displayDims.y
      );
    }
    this.ctx.lineTo(this.chartWidth, displayDims.y);
    this.ctx.lineTo(0, displayDims.y);
    this.ctx.fill();
    if (this.bpmRange) this.drawBPMRange();
  }

  setBPMRange(minFreq, maxFreq) {
    this.bpmRange = {
      minFreq: minFreq,
      maxFreq: maxFreq,
    };
  }

  drawBPMRange() {
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(
      this.audioAnalyser.getFreqLogIndex(this.bpmRange.minFreq) *
        this.chartWidth,
      0,
      this.audioAnalyser.getFreqLogIndex(this.bpmRange.maxFreq) *
        this.chartWidth,
      displayDims.y
    );
  }
}
