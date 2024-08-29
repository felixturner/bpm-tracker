/*

 Draws logarithmic frequency data of an AudioAnalyser instance to canvas
 Additionally draws a band indicating a frequency range for BPM detection

*/

const canvasSize = { x: 1024, y: 100 };

export class AudioAnalyserViz {
  constructor(audioAnalyser, domElement) {
    this.audioAnalyser = audioAnalyser;
    let canvas = document.createElement('canvas');
    canvas.width = canvasSize.x;
    canvas.height = canvasSize.y;
    domElement.appendChild(canvas);
    this.ctx = canvas.getContext('2d');
    this.update = this.update.bind(this);
    this.update();
  }

  update() {
    requestAnimationFrame(this.update);

    this.ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);

    //DRAW FREQ
    this.ctx.globalCompositeOperation = 'source-over';
    let freqData = this.audioAnalyser.logData;
    this.ctx.fillStyle = '#666';
    this.ctx.beginPath();
    this.ctx.moveTo(0, canvasSize.y);
    for (let i = 0; i < freqData.length; i++) {
      let val = freqData[i] / 255; //convert to 0-1 range
      this.ctx.lineTo(
        (i / freqData.length) * canvasSize.x,
        canvasSize.y - val * canvasSize.y
      );
    }
    this.ctx.lineTo(canvasSize.x, canvasSize.y);
    this.ctx.lineTo(0, canvasSize.y);
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
    const startPos = this.getFreqPos(this.bpmRange.minFreq);
    const endPos = this.getFreqPos(this.bpmRange.maxFreq);
    this.ctx.fillRect(startPos, 0, endPos - startPos, canvasSize.y);
  }

  getFreqPos(freq) {
    return (
      (this.audioAnalyser.getLogIndexFromFreq(freq) * canvasSize.x) /
      this.audioAnalyser.binCount
    );
  }
}
