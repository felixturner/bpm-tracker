const maxVal = 255;

export class BPMDetector {
  constructor(audioAnalyser, minFreq = 20, maxFreq = 20000, gain = 1, name) {
    this.audioAnalyser = audioAnalyser;
    this.volume = 0;
    this.minFreq = minFreq;
    this.maxFreq = maxFreq;
    this.maxRangeFreq = audioAnalyser.maxRangeFreq;
    this.gain = gain;
    this.name = name;

    this.detectedBPM = '---';

    // ARBITRARY VALUES
    this.maxBPM = 160;
    this.minBPM = 80;
    this.peakVolThreshold = 0.5; //ignore peaks below this volume
    this.peakWindowSize = 15; //number of volume records to check for a peak 15 * 17 = 225ms = 235 max BPM
    this.peakWindowCount = 40; //halved (only look at loudest 1/2 of peaks)

    this.peaksIntervalMS = 200; //do more often?
    this.volIntervalMS = 20; //about 60fps

    this.lastConfidentBPM = 0;
    this.bpmHistoryLength = 20; //duration = bpmHistoryLength * peaksInterval
    this.historicalMinConf = 0.3; //min historical confidence to show a result
    this.holdLastDetectedMS = 4000; //how long to hold last good BPm to avoid BPM jiggering

    this.volHistoryLen = this.peakWindowSize * this.peakWindowCount;

    console.log('volHistoryLen', this.volHistoryLen);

    this.displayBPM = 0;
    this.historicalConf = 0;
    this.intervalsCount = 0;
    this.peakCount = 0;
    this.currentConf = 0;

    this.isConfident = false;
    this.bpmMS = 10000;
    this.bpmTime = 0;

    this.resetBPM();

    console.log('new BPM Detector', name, this.minFreq, this.maxFreq);

    setInterval(() => {
      this.getVolume();
    }, this.volIntervalMS);

    this.peaksInt = setInterval(() => {
      this.getBPM();
    }, this.peaksIntervalMS);
  }

  resetBPM() {
    this.volHistory = new Array(this.volHistoryLen).fill({
      volume: 0,
      time: 0,
    });
    this.bmpHistory = new Array(this.bpmHistoryLength).fill(0);
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
    let total = 0;
    for (let i = this.startIndex; i <= this.endIndex; i++) {
      total += this.audioAnalyser.freqData[i];
    }
    this.volume = total / (this.endIndex - this.startIndex);
    this.volume *= this.gain;
    this.volume /= maxVal;

    //put new volume on front of volumeHistory
    this.volHistory.unshift({ volume: this.volume, time: time });
    this.volHistory.pop();

    //bpmTime is 0 - 1 within a beat
    this.bpmTime = (performance.now() % this.bpmMS) / this.bpmMS;
    this.barTime = (performance.now() % (this.bpmMS * 4)) / (this.bpmMS * 4);
  }

  pause() {
    clearInterval(this.peaksInt);
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
    this.peaks.sort(function (a, b) {
      return b.volume - a.volume;
    });
    // ...take the loudest half of those...
    this.peaks = this.peaks.splice(0, this.peaks.length * 0.5);
    //resort in time order
    this.peaks.sort(function (a, b) {
      return a.time - b.time;
    });

    this.peakCount = this.peaks.length;

    let intervals = [];

    //number of peaks to look ahead to find intervals
    let maxPeaksBetweenIntervals = 10;

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
        group.bpm = Math.round(group.bpm);
        //group.bpm = group.bpm.toFixed(1);

        if (
          !intervals.some(function (interval) {
            return interval.bpm === group.bpm ? interval.count++ : 0;
          })
        ) {
          intervals.push(group);
        }
      }
    });

    this.intervalsCount = intervals.length;

    //TEST
    if (this.useDebugBPM) {
      this.displayBPM = 120;
      this.isConfident = true;
      this.bpmMS = 500;
      return;
    }

    if (this.intervalsCount < 10) {
      this.displayBPM = 0;
      this.currentBPM = 0;
      this.currentConf = 0;
      this.historicalConf = 0;
      this.isConfident = false;
      this.bpmMS = 100000;
      this.bpmTime = 0;
      return;
    }

    //sort by count
    intervals.sort(function (intA, intB) {
      return intB.count - intA.count;
    });

    let totalCount = intervals.reduce((accum, group) => {
      return accum + group.count;
    }, 0);

    //get most common interval
    this.topInterval = intervals[0];

    this.currentConf = this.topInterval.count / totalCount;
    this.currentBPM = this.topInterval.bpm;

    //put most common detected BPM on bpmHistory
    this.bmpHistory.push(this.topInterval.bpm);
    this.bmpHistory.shift();

    //detectedBPM is most common in history
    this.detectedBPM = mode([...this.bmpHistory]);
    let detectedBPMCount = this.bmpHistory.filter(
      (x) => x == this.detectedBPM
    ).length;

    this.historicalConf = detectedBPMCount / this.bpmHistoryLength;
    this.isConfident = this.historicalConf > this.historicalMinConf;
    this.displayBPM = this.detectedBPM;

    //hold last confident BPM for a little while (in case there is a drop, want to keep current bpm)
    // if (isConfident !== this.lastIsConfident) {
    //   this.lastIsConfident = isConfident;
    //   //console.log('CONFIDENCE CHANGED');
    //   if (isConfident) {
    //     this.lastConfidentBPM = this.detectedBPM;
    //     this.displayBPM = this.detectedBPM;
    //     clearTimeout(this.lastConfidentBPMTimeout);
    //   } else {
    //     //TEST
    //     //this.displayBPM = 120;

    //     //lost confidence - hang  on to last good BPM for X seconds
    //     //to keep BPMs during breakdowns
    //     this.detectedBPM = this.lastConfidentBPM;
    //     clearTimeout(this.lastConfidentBPMTimeout);
    //     //console.log('LOW CONF');
    //     this.lastConfidentBPMTimeout = setTimeout(() => {
    //       //console.log('CLEAR BPM');
    //       //this.detectedBPM = 0;
    //       this.displayBPM = 0; //counts as no BPM found
    //     }, this.holdLastDetectedMS);
    //   }
    // }

    //overwrite hold time if super low current confidence e.g. white noise
    // if (this.detectedBPM === 0 || this.topInterval.count < 5) {
    //   console.log('YALLLOO');
    //   //this.historicalConf = 0;
    //   this.displayBPM = 0;
    //   clearTimeout(this.lastConfidentBPMTimeout);
    // }

    //bpmMS is length of a half note
    this.bpmMS = bpmToMS(this.displayBPM) * 2; //duration of half note

    //console.log('>>>', this.displayBPM);
  }
}

// MS =  60000 / BPM
function msToBPM(ms) {
  return 60000 / ms;
}

function bpmToMS(bpm) {
  // MS =  60000 / BPM
  return 60000 / bpm;
}

function mode(arr) {
  return arr
    .sort(
      (a, b) =>
        arr.filter((v) => v === a).length - arr.filter((v) => v === b).length
    )
    .pop();
}
