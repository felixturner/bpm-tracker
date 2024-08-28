/*

  Detects BPM from audio data via an AudioAnalyser instance. 
*/

export class BPMDetector {
  constructor(audioAnalyser, options = {}) {
    const {
      minFreq = 100,
      maxFreq = 250,
      gain = 1,
      minBPM = 85,
      maxBPM = 170,
      peakVolThreshold = 0.3,
      peakWindowSize = 15,
      peakWindowCount = 40,
      volIntervalMS = 20,
      bpmIntervalMS = 200,
      bpmHistoryLength = 20,
      historicalMinConf = 0.3,
    } = options;

    // OPTIONS
    this.minFreq = minFreq; //min freq to look for kick drum
    this.maxFreq = maxFreq; //max freq to look for kick drum
    this.gain = gain; //volume boost factor
    this.minBPM = minBPM;
    this.maxBPM = maxBPM;
    this.peakVolThreshold = peakVolThreshold; //ignore peaks below this volume
    this.peakWindowSize = peakWindowSize; //number of volume records to check for a peak. (15 * 20ms = 300ms = 200 max BPM)
    this.peakWindowCount = peakWindowCount; //halved (only looks at loudest 1/2 of peaks)
    this.volIntervalMS = volIntervalMS; //how often to get volume (20MS - about 60fps)
    this.bpmIntervalMS = bpmIntervalMS; //how often to calculate BPM
    this.bpmHistoryLength = bpmHistoryLength; //duration = bpmHistoryLength * bpmIntervalMS (4s)
    this.historicalMinConf = historicalMinConf; //min historical confidence to show a result

    this.audioAnalyser = audioAnalyser;
    this.volHistoryLen = this.peakWindowSize * this.peakWindowCount;
    this.intervalsCount = 0;
    this.peakCount = 0;
    this.historicalConf = 0;
    this.isConfident = false;
    this.bpmMS = 10000;

    this.resetBPM();

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
    //write current volume in the frequency range into volHistory as 0-1
    let volume = this.audioAnalyser.getVolumeInRange(
      this.minFreq,
      this.maxFreq
    );
    volume *= this.gain;
    //put new volume on front of volHistory
    this.volHistory.unshift({ volume: volume, time: performance.now() });
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
    this.historicalConf = 0;
    this.isConfident = false;
  }

  getMostCommonBPM() {
    return mode([...this.bpmHistory]);
  }

  updateBPMHistory(bpm) {
    this.bpmHistory.push(bpm);
    this.bpmHistory.shift();
  }

  //get 0 - 1 time within a number of beats
  getBeatTime(numBeats = 1) {
    return (
      (performance.now() % (this.bpmMS * numBeats)) / (this.bpmMS * numBeats)
    );
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
