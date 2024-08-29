/*

  Utility class to play an MP3 or load the mic
  Handles drag and drop MP3.

*/

export class AudioPlayer {
  constructor() {
    this.context = new AudioContext();
    this.playing = false;
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.isConnected = false;
    this.loadMP3File = this.loadMP3File.bind(this);
  }

  async getMic() {
    this.disconnect();
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.context.createMediaStreamSource(stream);
  }

  disconnect() {
    if (this.isConnected) {
      this.source.disconnect(this.gainNode);
      this.isConnected = false;
    }
  }

  async loadMP3File(file) {
    const url = URL.createObjectURL(file);
    await this.loadMP3Url(url);
  }

  async loadMP3Url(mp3URL) {
    this.disconnect();
    let response = await fetch(mp3URL);
    let arrayBuffer = await response.arrayBuffer();
    let audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.audioBuffer = audioBuffer;
    this.source = this.context.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.loop = true;
    this.source.start();
    this.playing = true;
    this.source.connect(this.gainNode);
    this.isConnected = true;
  }

  mute(doMute) {
    this.gainNode.gain.value = doMute ? 0 : 1;
  }
}
