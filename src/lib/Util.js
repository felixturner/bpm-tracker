/*
 	Airtight Utilities v 0.1.3
	@author felixturner / http://airtight.cc/

	import Util from 'Util.js';
	let r = Util.randomInt(1,30);

*/

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isAndroid = navigator.userAgent.toLowerCase().indexOf('android') > -1;

const Util = {
  randomRange: function (min, max) {
    return min + Math.random() * (max - min);
  },
  randomInt: function (min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  },
  //map one range to another (not clamped)
  map: function (value, min1, max1, min2, max2) {
    return Util.lerp(Util.norm(value, min1, max1), min2, max2);
  },
  mapClamp: function (value, min1, max1, min2, max2) {
    return Util.clamp(Util.lerp(Util.norm(value, min1, max1), min2, max2), min2, max2);
  },
  lerp: function (value, min, max) {
    return min + (max - min) * value;
  },
  //normalize value within range (not clamped)
  norm: function (value, min, max) {
    return (value - min) / (max - min);
  },
  clamp: function (value, min, max) {
    return Math.max(Math.min(value, max), min);
  },
  smoothstep: function (value, min, max) {
    let x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  },
  //return a randomly seleted item in an array
  sample: function (ary) {
    return ary[Util.randomInt(0, ary.length - 1)];
  },
  //remove an item from an array by value, modifies passed array (does not work for arrays of objects)
  remove: function (array, element) {
    const index = array.indexOf(element);
    if (index !== -1) {
      array.splice(index, 1);
    }
  },
  //a modulo function that handles negatives numbers 'correctly'
  mod: function (n, m) {
    return ((n % m) + m) % m;
  },
  degToRad: function (degrees) {
    return (degrees * Math.PI) / 180;
  },
  //random with seed, returns 0-1 range
  random1D: function (seed) {
    return Util.mod(Math.sin(seed) * 43758.5453, 1);
  },
  //returns 0-1 range
  noise1D: function (x) {
    let i = Math.floor(x);
    let f = Util.mod(x, 1);
    let u = f * f * (3.0 - 2.0 * f);
    return Util.lerp(u, Util.random1D(i), Util.random1D(i + 1.0));
  },
  //convert string like: "1,2,3" into [1,2,3]
  convertToNumArray: function (str) {
    let array = str.split(',');
    for (let i in array) {
      array[i] = parseInt(array[i], 10);
    }
    return array;
  },
  //create array of integers from 0 -> N-1
  range: (n) => Array.from({ length: n }, (value, key) => key),
  // shuffle array in place
  shuffle: function (a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  },
  //copy all object properties into another
  copyProps(fromObj, toObj) {
    for (let k in fromObj) toObj[k] = fromObj[k];
  },
  getQueryVar: function (query, variable) {
    let vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
        return decodeURIComponent(pair[1]);
      }
    }
    console.log('Query variable %s not found', variable);
  },
  //load image to local cache. returns promise with image reference.
  loadImage(src) {
    return new Promise((resolve) => {
      let img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.src = src;
    });
  },
  //promise based timeout
  //usage: Util.wait(500).then(() => doSomething());
  //OR
  //await Util.wait(500);
  wait(timeout) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  },
  Enum() {
    for (let i in arguments) {
      this[arguments[i]] = arguments[i];
    }
  },
  isMouseLess: isIOS || isAndroid,
  isMobile: !!('ontouchstart' in window),
  isIOS,
  isAndroid,
  isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  hasWebGL() {
    try {
      let canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  },
};

export default Util;
