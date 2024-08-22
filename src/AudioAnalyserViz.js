/*

 Draws multiple AudioAnalyser bands
 stacked vertically
 1 canvas per viz
*/

const displayDims = { x: 400, y: 100 };
const maxVal = 255;

export class AudioAnalyserViz {
  constructor(audioAnalyser, domElement) {
    this.audioAnalyser = audioAnalyser;

    this.isLog = true; //TODO
    //this.ctxs = [];
    // this.bandsCount = this.audioAnalyser.bands.length;

    // this.audioAnalyser.bands.forEach((band, i) => {
    let canvas = document.createElement('canvas');
    canvas.width = displayDims.x;
    canvas.height = displayDims.y;
    domElement.appendChild(canvas);
    //canvas.style.position = 'absolute';
    //canvas.style.top = `${i * (displayDims.y + 10)}px`;

    this.ctx = canvas.getContext('2d');
    //this.ctx.lineWidth = 1;
    //this.ctx.strokeStyle = '#FFF';
    //labels
    this.ctx.font = '10px sans-serif';
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
    this.ctx.shadowBlur = 7;

    this.freqGradient = this.ctx.createLinearGradient(0, 0, 0, displayDims.y);
    this.freqGradient.addColorStop(1, '#00ff00'); //bottom
    this.freqGradient.addColorStop(0.5, '#ffff00');
    this.freqGradient.addColorStop(0.3, '#ff0000'); //top
    // });
    this.chartWidth = displayDims.x;

    this.update = this.update.bind(this);
    this.update();
  }

  update() {
    requestAnimationFrame(this.update);
    // console.log(this.audioAnalyser.getVolume());

    //clear
    //this.audioAnalyser.bands.forEach((band, i) => {

    // this.ctx.fillStyle = band.onBeat ? '#FFF' : '#111';
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, displayDims.x, displayDims.y);

    // this.drawFreqLine(100, '100', this.isLog);
    // this.drawFreqLine(1000, '1K', this.isLog);
    // this.drawFreqLine(10000, '10K', this.isLog);

    this.ctx.strokeStyle = '#FFF';

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
    //this.ctx.stroke();

    //vert divider
    // this.ctx.beginPath();
    // this.ctx.moveTo(this.chartWidth, 0);
    // this.ctx.lineTo(this.chartWidth, displayDims.y);
    // this.ctx.stroke();

    this.ctx.fillStyle = this.freqGradient;

    if (this.bpmRange) this.drawBPMRange();
  }

  drawFreqLine(freq, isLog = true) {
    let xPos;
    if (isLog) {
      //let linearIndex = (freq / this.audioAnalyser.maxFreq) * this.audioAnalyser.binCount;
      xPos = this.audioAnalyser.getFreqLogIndex(freq) * this.chartWidth;
    } else {
      //LINEAR (WORKS)
      xPos = this.chartWidth * (freq / this.audioAnalyser.maxFreq);
    }
    //console.log(xPos);

    //console.log(xPos);
    this.ctx.strokeStyle = '#ccc';
    this.ctx.beginPath();
    this.ctx.moveTo(xPos, 0);
    this.ctx.lineTo(xPos, displayDims.y);
    this.ctx.stroke();
  }

  setBPMRange(minFreq, maxFreq, name) {
    this.bpmRange = {
      minFreq: minFreq,
      maxFreq: maxFreq,
      name: name,
    };
  }

  drawBPMRange() {
    //white

    this.drawFreqLine(this.bpmRange.minFreq);
    this.drawFreqLine(this.bpmRange.maxFreq);

    //name
    // this.ctx.fillStyle = 'white';
    // this.ctx.fillText(this.bpmRange.name, startX + 5, displayDims.y - 15);
  }
}
