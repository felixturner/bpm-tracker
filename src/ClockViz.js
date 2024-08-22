let height = 800;
let width = 800;

export class ClockViz {
  constructor(domElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.width = width;
    this.canvas.height = height;
    domElement.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    //this.ctx.lineCap = 'round';
    //this.ctx.lineWidth = 5;
    //this.ctx.strokeStyle = '#f0f';
    this.waveLength = Math.PI * 3;
  }

  update(bpmTime = 0) {
    this.ctx.clearRect(0, 0, width, height);

    const gradient = this.ctx.createConicGradient(
      Math.PI * 2 * bpmTime - Math.PI / 2,
      width / 2,
      height / 2
    );

    gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, `rgba(255,255,255,0.3`);

    // Set the fill style and draw a rectangle
    this.ctx.fillStyle = gradient;

    //pie slice
    // this.ctx.beginPath();
    // this.ctx.moveTo(width / 2, height / 2);
    // this.ctx.lineTo(width / 2, -height);
    // this.ctx.arc(
    //   width / 2,
    //   height / 2,
    //   width / 2,
    //   -Math.PI / 2,
    //   Math.PI * 2 * bpmTime - Math.PI / 2
    // );
    // this.ctx.lineTo(width / 2, height / 2);
    // this.ctx.fill();

    //curcle
    this.ctx.beginPath();
    this.ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // //animate line
    // for (let j = 0; j <= numPoints; j++) {
    //   let p = j / numPoints;
    //   let x = p * (width - padding) + padding / 2;
    //   let y =
    //     Math.cos(p * this.waveLength + (time / 1000) * 5) * waveHeight +
    //     height / 2;

    //   this.ctx.lineTo(x, y);
    // }
    this.ctx.stroke();

    // this.ctx.fillStyle = '#F0f';
    // this.ctx.fillRect(0, 0, width, height);
  }
}
