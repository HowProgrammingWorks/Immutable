'use strict';

const typeOf = (value) => {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
};

class Record {
  static immutable(defaults) {
    return Record.#build(defaults, false);
  }

  static mutable(defaults) {
    return Record.#build(defaults, true);
  }

  static #build(defaults, isMutable) {
    const fields = Object.keys(defaults);
    const schema = Object.create(null);
    for (let i = 0; i < fields.length; i++) {
      const key = fields[i];
      schema[key] = typeOf(defaults[key]);
    }
    Object.freeze(schema);

    class Struct {
      static fields = fields.slice();
      static schema = schema;
      static mutable = isMutable;

      constructor(data = {}) {
        Struct.#validate(data);
        for (let i = 0; i < fields.length; i++) {
          const key = fields[i];
          this[key] = key in data ? data[key] : defaults[key];
        }
        if (isMutable) Object.seal(this);
        else Object.freeze(this);
      }

      static create(data) {
        return new Struct(data);
      }

      static #validate(data) {
        const keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const expected = schema[key];
          if (!expected) {
            throw new TypeError(`Unknown field "${key}"`);
          }
          const actual = typeOf(data[key]);
          if (actual !== expected) {
            throw new TypeError(
              `Invalid type for "${key}": expected ${expected}, got ${actual}`,
            );
          }
        }
      }

      update(updates) {
        if (!isMutable) {
          throw new Error('Cannot update immutable Record, use fork or branch');
        }
        Struct.#validate(updates);
        return Object.assign(this, updates);
      }

      fork(updates = {}) {
        return new Struct({ ...this.toObject(), ...updates });
      }

      branch(updates = {}) {
        Struct.#validate(updates);
        const obj = Object.create(this);
        const keys = Object.keys(updates);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          Reflect.defineProperty(obj, key, {
            value: updates[key],
            writable: isMutable,
            configurable: false,
            enumerable: true,
          });
        }
        return isMutable ? Object.seal(obj) : Object.freeze(obj);
      }

      toObject() {
        const obj = {};
        for (let i = 0; i < fields.length; i++) {
          const key = fields[i];
          obj[key] = this[key];
        }
        return obj;
      }
    }

    return Struct;
  }
}

// Usage

const City = Record.immutable({ name: 'Unknown' });
const User = Record.mutable({
  id: 0,
  name: 'Anonymous',
  city: new City(),
  email: '',
  roles: [],
});

const rome = new City({ name: 'Rome' });
const marcus = new User({
  id: 1,
  name: 'Marcus',
  city: rome,
  email: 'marcus@metarhia.com',
});
marcus.update({ name: 'Marcus Aurelius' });

const lucius = marcus.fork({ name: 'Lucius Verus' });
lucius.update({ email: 'lucius@metarhia.com' });

const commodus = marcus.branch({ name: 'Commodus' });
console.log({ marcus, lucius, commodus: commodus.toObject() });
console.log('branch shares city:', commodus.city === marcus.city);
console.log('fork copies city ref:', lucius.city === marcus.city);
console.log('branch is a User:', commodus instanceof User);

try {
  const invalid = new User({ id: 'one' });
  console.log(invalid);
} catch (error) {
  console.log('Type error:', error.message);
}

try {
  rome.update({ name: 'Roma' });
} catch (error) {
  console.log('Immutable error:', error.message);
}
