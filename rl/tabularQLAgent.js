require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

  // WARN excluding max [0, max)
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

    let max = arr[0];
    let maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
        maxIndex = i;
        max = arr[i];
      }
    }

    return maxIndex;
  },

  download(filename, text) {
    let pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
      let event = document.createEvent('MouseEvents');
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
  },

  // checks array equality
  areEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
      return false;
    for(let i = arr1.length; i--;) {
      if(arr1[i] !== arr2[i])
        return false;
    }
    return true;
  }

};

module.exports = utils;

},{}],"tabularQLAgent":[function(require,module,exports){
const utils = require('./utils');

class TabularQLearner {
  constructor(opts) {
    const defaults = {
      discountRate: 0.95,
      epsilon: 1,
      actionSize: undefined,
      stateSize: undefined,
      updateRate: 0.1,
    };
    opts = {...defaults, ...opts}; // apply the defaults

    console.log('creating tabular qlearning agent', opts);

    // QUESTION should I have it this way or rotated?
    // Create qTable and fill with random numbers
    this._qTable = [];
    for (var state = 0; state < opts.stateSize; ++state) {
      let action_array = [];
      for (var action = 0; action < opts.actionSize; ++action) {
        action_array.push(Math.random());
      }
      this._qTable.push(action_array);
    }
    this.state_size = opts.stateSize;
    this.action_size = opts.actionSize;
    this.discount_factor = opts.discountRate; // gamma
    this.update_rate = opts.updateRate; // alpha
    this.epsilon = opts.epsilon;
  }

  // getQ
  q(state, action) {
    return this._qTable[state][action];
  }

  _setQ(state, action, value) {
    this._qTable[state][action] = value;
  }

  // Since the "utils.indexOfMax" function only returns one action
  // we don't need the _best_actions/best_action combo
  // If this isn't "random enough" in the case of a tie,
  // we can modify how indexOfMax handles ties
  best_action(state) {
    if (state >= this.state_size) throw new Error(`Invalid choice of state: ${state}. Must be less than state_size ${this.state_size}`);
    return utils.indexOfMax(this._qTable[state]);
  }

  act(state) {
    let action = null; //null or undefined? Does it matter?
    if (Math.random() <= this.epsilon) {
      action = utils.getRandomInt(this.action_size);
    } else {
      action = this.best_action(state);
      if (action >= this.action_size || action < 0) {
        throw new Error(`Invalid choice of action: ${action}. Must be between 0 and ${this.action_size - 1} (inclusive)`);
      }
    }
    return action;
  }

  update(state, action, reward, next_state) {
    // compute the difference
    const best_next_action = this.best_action(next_state);
    const best_next_value = this.q(next_state, best_next_action);
    const diff = reward + (this.discount_factor * best_next_value) - this.q(state, action);
    // compute the update
    const new_value = this.q(state, action) + this.update_rate * diff;

    // do the update
    this._setQ(state, action, new_value);
  }
}

module.exports = TabularQLearner;

},{"./utils":1}]},{},[]);
