const utils = {
  /**
   * Shuffles array in place. ES6 version
   * @param {Array} a items An array containing the items.
   */
  shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  },

  pickRandom(list) {
    let idx = this.getRandomInt(list.length - 1);
    return list[idx];
  },

  sampleBatch(arr, batchSize) {
    console.assert(arr.length >= batchSize, 'the array is smaller than batchSize');
    let maxBatchStart = arr.length - batchSize;
    let batchStartIndex = this.getRandomInt(maxBatchStart);
    return arr.slice(batchStartIndex, batchStartIndex + batchSize);
  },

  indexOfMax(arr) {
    if (arr.length === 0) {
      return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
        maxIndex = i;
        max = arr[i];
      }
    }

    return maxIndex;
  },

  download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
      var event = document.createEvent('MouseEvents');
      event.initEvent('click', true, true);
      pom.dispatchEvent(event);
    } else {
      pom.click();
    }
  },

  // onehot encodes 1d array
  onehot(list, depth) {
    let oh = list
      .map(val => {
        let vec = new Array(depth).fill(0);
        vec[val] = 1;
        return vec;
      })
      .reduce((a, b) => a.concat(b));
    return oh;
  },

  createMemory(capacity) {
    class Memory {
      constructor(size) {
        this._size = size;
        this._storage = [];
      }

      remember(item) {
        this._storage.push(item);
        if (this._storage.length > this._size) {
          this._storage.shift();
        }
      }

      get memories() {
        return this._storage;
      }
    }
    return new Memory(capacity);
  }

};
