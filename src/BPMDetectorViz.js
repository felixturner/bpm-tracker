/*

Draws volume history and peaks of a BPMDetector instance

*/

const displayHeight = 100;

export class BPMDetectorViz {
  constructor(bpmDetector, domElement) {
    this.bpmDetector = bpmDetector;
    this.canvas = document.createElement('canvas');
    this.canvas.width = bpmDetector.volHistoryLen;
    this.canvas.height = displayHeight;
    domElement.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.update = this.update.bind(this);
    this.update();
  }

  update() {
    requestAnimationFrame(this.update);
    this.ctx.clearRect(0, 0, this.canvas.width, displayHeight);

    //Draw Volume History
    this.ctx.fillStyle = '#666';
    this.bpmDetector.volHistory.forEach((vol, i) => {
      this.ctx.fillRect(i, displayHeight, 1, -vol.volume * displayHeight);
    });

    //draw peaks
    if (!this.bpmDetector.peaks) return;
    this.ctx.fillStyle = '#fff';
    this.bpmDetector.peaks.forEach((peak) => {
      this.ctx.fillRect(
        this.timeToDisplayPos(peak.time, performance.now()),
        displayHeight,
        1,
        -peak.volume * displayHeight
      );
    });
  }
  timeToDisplayPos(time, curTime) {
    return Math.round((curTime - time) / this.bpmDetector.volIntervalMS);
  }
}
