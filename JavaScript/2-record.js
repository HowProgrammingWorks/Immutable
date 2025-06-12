'use strict';

class Record {
  static immutable(fields) {
    return Record.#build(fields, false);
  }

  static mutable(fields) {
    return Record.#build(fields, true);
  }

  static #build(fields, isMutable) {
    const fieldSet = new Set(fields);

    class Struct {
      static fields = Object.freeze(fields.slice());
      static mutable = isMutable;
      static create(props) {
        for (const field of fields) {
          if (!Reflect.has(props, field)) {
            throw new Error(`Missing field: ${field}`);
          }
        }
        for (const key in props) {
            if (!fieldSet.has(key)) {
                throw new Error(`Unexpected field: ${key}`);
            }
        }

        const obj = Object.fromEntries(
          fields.map(field => [field, props[field]])
        );
        return isMutable ? Object.seal(obj) : Object.freeze(obj);
      }
    }
    return Struct;
  }
  static update(instance, updates) {
    if (Object.isFrozen(instance)) {
      throw new Error('Cannot mutate immutable Record');
    }
    for (const key of Object.keys(updates)) {
      if (Reflect.has(instance, key)) {
        instance[key] = updates[key];
      }
    }
    return instance;
  }
  
  static fork(instance, updates) {
    const copy = { ...instance, ...updates };
    return Object.isFrozen(instance) ? Object.freeze(copy) : Object.seal(copy);
  }
}

// Оновлений приклад використання

const City = Record.immutable(['name']);
const User = Record.immutable(['id', 'name', 'city', 'email']); 
const rome = City.create({ name: 'Rome' });
const marcus = User.create({
  id: 1,
  name: 'Marcus',
  city: rome,
  email: 'marcus@metarhia.com'
});

const marcusUpdated = Record.fork(marcus, { name: 'Marcus Aurelius' });
const lucius = Record.fork(marcusUpdated, { 
    name: 'Lucius Verus',
    email: 'lucius@metarhia.com'
});

console.log({ marcus, marcusUpdated, lucius });

try {
    Record.update(marcus, { name: 'FAIL' });
} catch (err) {
    console.error('\nError trying to update immutable record:', err.message);
}
