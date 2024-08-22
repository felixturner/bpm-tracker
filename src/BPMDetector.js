export class BPMDetector {
  constructor(audioAnalyser, minFreq = 20, maxFreq = 20000, gain = 1) {
    this.audioAnalyser = audioAnalyser;
    this.volume = 0;
    this.minFreq = minFreq;
    this.maxFreq = maxFreq;
    this.maxRangeFreq = audioAnalyser.maxRangeFreq;
    this.gain = gain;

    // ARBITRARY VALUES
    this.maxBPM = 160;
    this.minBPM = 80;
    this.peakVolThreshold = 0.5; //ignore peaks below this volume
    this.peakWindowSize = 15; //number of volume records to check for a peak. (15 * 20 = 300ms = 200 max BPM)
    this.peakWindowCount = 40; //halved (only look at loudest 1/2 of peaks)
    this.volHistoryLen = this.peakWindowSize * this.peakWindowCount;
    this.bpmIntervalMS = 200; //do more often?
    this.volIntervalMS = 20; //about 60fps
    this.bpmHistoryLength = 20; //duration = bpmHistoryLength * bpmIntervalMS (4s)
    this.historicalMinConf = 0.3; //min historical confidence to show a result

    this.intervalsCount = 0;
    this.peakCount = 0;
    this.currentConf = 0;
    this.historicalConf = 0;
    this.isConfident = false;
    this.bpmMS = 10000;

    this.resetBPM();

    console.log('new BPM Detector', this.minFreq, this.maxFreq);

    setInterval(() => {
      this.getVolume();
    }, this.volIntervalMS);

    setInterval(() => {
      this.getBPM();
    }, this.bpmIntervalMS);
  }

  resetBPM() {
    this.volHistory = new Array(this.volHistoryLen).fill({
      volume: 0,
      time: 0,
    });
    this.bpmHistory = new Array(this.bpmHistoryLength).fill(0);
  }

  getVolume() {
    //write current volume into volHistory as 0-1
    let time = performance.now();
    this.startIndex = Math.round(
      (this.minFreq / this.audioAnalyser.maxRangeFreq) *
        (this.audioAnalyser.binCount - 1)
    );
    this.endIndex = Math.round(
      (this.maxFreq / this.audioAnalyser.maxRangeFreq) *
        (this.audioAnalyser.binCount - 1)
    );
    //average volume in range
    let total = 0;
    for (let i = this.startIndex; i <= this.endIndex; i++) {
      total += this.audioAnalyser.freqData[i];
    }
    this.volume = total / (this.endIndex - this.startIndex);
    this.volume *= this.gain;
    this.volume /= 255; //convert to 0-1 range

    //put new volume on front of volumeHistory
    this.volHistory.unshift({ volume: this.volume, time: time });
    this.volHistory.pop();
  }

  getBPM() {
    //GET PEAKS
    //peaks are spikes in volume
    //create array of peaks with volume and time
    this.peaks = [];
    this.peaks = new Array(this.peakWindowCount).fill({
      volume: 0,
      time: 0,
    });

    //find peak volume in each peak window
    for (let i = 0; i < this.peakWindowCount; i++) {
      let max = {};
      for (let j = 0; j < this.peakWindowSize; j++) {
        let data = this.volHistory[i * this.peakWindowSize + j];
        if (!max.volume || data.volume > max.volume) {
          max = {
            volume: data.volume,
            time: data.time,
          };
        }
      }
      if (max.volume > this.peakVolThreshold) {
        this.peaks.push(max);
        this.peaks.shift();
      }
    }

    //sort peaks by volume
    this.peaks.sort((a, b) => {
      return b.volume - a.volume;
    });
    //take the loudest half of those...
    this.peaks = this.peaks.splice(0, this.peaks.length * 0.5);
    //resort in time order
    this.peaks.sort((a, b) => {
      return a.time - b.time;
    });

    this.peakCount = this.peaks.length;

    let intervals = [];

    //number of peaks to look ahead to find intervals
    let maxPeaksBetweenIntervals = 10;

    //GET INTERVALS
    //create list of intervals with bpms and count
    //interval is distance between 2 peaks
    this.peaks.forEach((peak, index) => {
      for (
        let i = 1;
        index + i < this.peakCount && i < maxPeaksBetweenIntervals;
        i++
      ) {
        //for (let i = 1; index + i < this.peakCount; i++) {
        if (peak.time === 0) continue;
        let group = {
          bpm: msToBPM(this.peaks[index + i].time - peak.time),
          count: 1,
        };
        while (group.bpm < this.minBPM) {
          group.bpm *= 2;
        }
        while (group.bpm > this.maxBPM) {
          group.bpm /= 2;
        }
        group.bpm = Math.round(group.bpm); //integer BPMs only

        if (
          !intervals.some((interval) => {
            return interval.bpm === group.bpm ? interval.count++ : 0;
          })
        ) {
          intervals.push(group);
        }
      }
    });

    this.intervalsCount = intervals.length;

    if (intervals.length < 10) {
      this.resetBPMValues();
      return;
    }

    // Sort intervals by count in descending order
    intervals.sort((a, b) => b.count - a.count);

    // Calculate total count of intervals
    const totalCount = intervals.reduce(
      (accumulator, group) => accumulator + group.count,
      0
    );

    // Get the most common interval
    this.topInterval = intervals[0];

    this.currentConf = this.topInterval.count / totalCount;
    const currentBPM = this.topInterval.bpm;

    // Update BPM history
    this.updateBPMHistory(currentBPM);

    // Determine the most common BPM in history
    this.detectedBPM = this.getMostCommonBPM();
    const detectedBPMCount = this.bpmHistory.filter(
      (bpm) => bpm === this.detectedBPM
    ).length;

    this.historicalConf = detectedBPMCount / this.bpmHistoryLength;
    this.isConfident =
      this.historicalConf > this.historicalMinConf && this.detectedBPM > 0;

    //bpmMS is length of a half note
    this.bpmMS = bpmToMS(this.detectedBPM) * 2; //duration of half note
  }

  resetBPMValues() {
    this.currentConf = 0;
    this.historicalConf = 0;
    this.isConfident = false;
    this.bpmMS = 100000;
  }

  getMostCommonBPM() {
    return mode([...this.bpmHistory]);
  }

  updateBPMHistory(bpm) {
    this.bpmHistory.push(bpm);
    this.bpmHistory.shift();
  }

  //get 0-1 time within a  beats
  get beatTime() {
    return (performance.now() % this.bpmMS) / this.bpmMS;
  }
  //get 0-1 time within 4 beats
  get barTime() {
    return (performance.now() % (this.bpmMS * 4)) / (this.bpmMS * 4);
  }
}

// Utility functions
const msToBPM = (ms) => 60000 / ms;

const bpmToMS = (bpm) => 60000 / bpm;

function mode(arr) {
  return arr
    .sort(
      (a, b) =>
        arr.filter((v) => v === a).length - arr.filter((v) => v === b).length
    )
    .pop();
}
