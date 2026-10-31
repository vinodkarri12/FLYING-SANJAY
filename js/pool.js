/**
 * ANTIGRAV: VECTOR SURGE - Object Pooling Architecture
 * High-performance object pooling to avoid garbage collection hitches and maintain locked 60 FPS.
 */

class ObjectPool {
  constructor(factoryFn, initialSize = 50) {
    this.factoryFn = factoryFn;
    this.pool = [];
    this.active = [];

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factoryFn());
    }
  }

  acquire() {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.factoryFn();
    }
    obj.active = true;
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    const idx = this.active.indexOf(obj);
    if (idx !== -1) {
      this.active.splice(idx, 1);
      obj.active = false;
      if (typeof obj.reset === 'function') {
        obj.reset();
      }
      this.pool.push(obj);
    }
  }

  releaseAll() {
    while (this.active.length > 0) {
      const obj = this.active.pop();
      obj.active = false;
      if (typeof obj.reset === 'function') {
        obj.reset();
      }
      this.pool.push(obj);
    }
  }

  forEach(callback) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      callback(this.active[i], i);
    }
  }

  get length() {
    return this.active.length;
  }
}

