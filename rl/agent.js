'use strict';
/* global tf, _, utils */

/* AI architectures */

/* throughtout this code there are conversions between tf tensors and simple arrays that could be avoided to improve performace
  */

class Agent {
  constructor(opts) {
    const defaults = {
      discountRate: 0.95,
      epsilon: 1,
      epsilonMin: 0.02,
      epsilonDecay: 0.99, // TODO better decay settings
      model: undefined, // dnn
      targetModel: undefined,
      batchSize: 32,
      actionSize: undefined,
      stateSize: undefined
    };
    opts = _.extend(defaults, opts);
    console.log('creating agent', opts);

    if (!this._checkInitOpts(opts)) throw new Error('Bad agent initialization');
    for (let key in opts) {
      this[key] = opts[key];
    }

    this.model = this.model || this._createModel();
    this.targetModel = this.targetModel || this._createModel();
  }

  _createModel() {
    // input size is stateSize. output size is actionSize
    const model = tf.sequential();
    model.add(tf.layers.dense({units: 24, activation: 'relu', inputShape: [this.stateSize]}));
    model.add(tf.layers.dense({units: 24, activation: 'relu'}));
    model.add(tf.layers.dense({units: this.actionSize, activation: 'linear'}));
    model.compile({loss: 'meanSquaredError', optimizer: 'adam'});
    return model;
  }

  // creates a tensor from the state,
  // this is used to allow the memory to store the state as simple arrays (not optimal)
  _makeTensor(state) {
    let stateTensor = tf.tensor2d(state, [1, state.length]);
    return stateTensor;
  }

  async act(state) {
    state = this._makeTensor(state);
    if (Math.random() <= this.epsilon) {
      return utils.getRandomInt(this.actionSize);
    }
    let actVals = await this.model.predict(state).dataSync();
    return utils.indexOfMax(actVals); // returns action
  }

  async replay(memories) {
    // TODO train the model with new data once there are enough memories
    if (memories.length < this.batchSize) {
      return false;
    }
    // take a random batch from memories train on it
    // QUESTION shuffle the whole thing take a random batch
    // 1. how manytimes do we shuffle the whole thing?
    // 2. be able to remove old memories
    const minibatch = utils.sampleBatch(memories, this.batchSize); // non consecutive

    async function replayMemory(singleMemory) { // FIXME
      let [state, action, reward, nextState, done] = singleMemory;
      state = this._makeTensor(state);
      nextState = this._makeTensor(nextState);
      let target = await this.model.predict(state);
      target = target.buffer(); // convert tensor into tensor buffer to manipulate
      if (done) {
        target.values[action] = reward;
      } else {
        let a = await this.model.predict(nextState).data();
        let t = await this.targetModel.predict(nextState).data();
        target.values[action] = reward + this.discountRate * t[utils.indexOfMax(a)];
      }
      target = target.toTensor();
      await this.model.fit(state, target, {
        // batchSize: this.batchSize,
        // epochs: 1
      });
    }

    for (let i = 0; i < minibatch.length; i++) { // TODO OPTIMIZE vectorize
      await replayMemory.call(this, minibatch[i]);
    }

    this._decayEpsilon();
  }

  async save(location) {
    print('saving model..', location);
    const saveResults = await this.model.save(location);
  }

  async load(location) {
    console.log('loading model..', location);
    this.model = await tf.loadModel(location);
    this.targetModel = await tf.loadModel(location);
  }

  _checkInitOpts() {
    return true;
  }

  _decayEpsilon() {
    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
  }

  async updateTargetModel() {
    // copy weights from model to targetModel
    // here we are copying the whole model. OPTIMIZE?
    const SAVEPATH = 'localstorage://dqnModel';
    const saveResults = await this.model.save(SAVEPATH);
    this.targetModel = await tf.loadModel(SAVEPATH);
  }
}
