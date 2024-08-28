/*
  Animated sine wave drawn to canvas
*/

let numPoints = 100;
let height = 800;
let width = 800;
let waveHeight = 80;
let padding = 350;

export class Wave {
  constructor(domElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.width = width;
    this.canvas.height = height;
    domElement.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = 55;
    this.ctx.strokeStyle = '#fff';
    this.waveLength = Math.PI * 3;
    this.update = this.update.bind(this);
    this.update();
  }

  update() {
    requestAnimationFrame(this.update);
    let time = performance.now();
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.beginPath();
    //animate line
    for (let j = 0; j <= numPoints; j++) {
      let p = j / numPoints;
      let x = p * (width - padding) + padding / 2;
      let y =
        Math.cos(p * this.waveLength + (time / 1000) * 5) * waveHeight +
        height / 2;
      this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  }
}
