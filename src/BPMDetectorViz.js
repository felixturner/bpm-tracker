const displayDims = { x: 600, y: 100 };

export class BPMDetectorViz {
  constructor(bpmDetector, domElement) {
    this.bpmDetector = bpmDetector;
    this.canvas = document.createElement('canvas');
    this.canvas.width = bpmDetector.volHistoryLen;
    this.canvas.height = displayDims.y;
    domElement.appendChild(this.canvas);
    //this.canvas.style.time = 'absolute';
    //this.canvas.style.top = `${i * (displayDims.y + 10)}px`;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#FFF';
    //labels
    // this.ctx.font = '10px sans-serif';
    // this.ctx.textBaseline = 'top';
    // this.ctx.textAlign = 'left';
    // this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
    // this.ctx.shadowBlur = 7;

    this.update = this.update.bind(this);
    this.update();
  }

  update() {
    requestAnimationFrame(this.update);
    let curTime = performance.now();

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, displayDims.y);

    //DRAW VOL HISTORY
    this.ctx.fillStyle = '#666';
    this.bpmDetector.volHistory.forEach((vol, i) => {
      this.ctx.fillRect(i, displayDims.y, 1, -vol.volume * displayDims.y);
    });

    //draw seconds
    // for (let i = 0; i < this.bpmDetector.volHistoryDuration; i++) {
    //   this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
    //   let sPos = (i / this.bpmDetector.volHistoryDuration) * displayDims.x;
    //   this.ctx.fillRect(sPos, displayDims.y, 3, -1 * displayDims.y);
    // }

    //draw peaks
    if (!this.bpmDetector.peaks) return;
    this.ctx.fillStyle = '#fff';
    this.bpmDetector.peaks.forEach((peak) => {
      this.ctx.fillRect(
        this.timeToDisplayPos(peak.time, curTime),
        displayDims.y,
        1,
        -peak.volume * displayDims.y
      );
    });
  }
  timeToDisplayPos(time, curTime) {
    //total array width is volHistoryLen
    return Math.round((curTime - time) / this.bpmDetector.volIntervalMS);
  }
}
