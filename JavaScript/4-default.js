'use strict';

function getType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validateTypes(props, defaults) {
  for (const key in props) {
    if (Reflect.has(defaults, key)) {
      const defaultValue = defaults[key];
      const newValue = props[key];
      const expectedType = getType(defaultValue);
      const actualType = getType(newValue);
      if (expectedType !== actualType) {
        throw new TypeError(
          `Invalid type for "${key}": expected ${expectedType}, got ${actualType}`
        );
      }
    }
  }
}


class Record {


  static immutable(defaults) {
    return Record.#build(defaults, false);
  }

  static mutable(defaults) {
    return Record.#build(defaults, true);
  }

  static #build(defaults, isMutable) {
    // Заморожуємо структуру "класу", щоб уникнути її випадкової зміни
    const fields = Object.keys(defaults);
    const frozenDefaults = Object.freeze({ ...defaults });

    class Struct {
      static fields = Object.freeze(fields);
      static defaults = frozenDefaults;
      static mutable = isMutable;
      static create(data = {}) {
        validateTypes(data, frozenDefaults);
        
        // Створюємо екземпляр декларативно, поєднуючи `defaults` і `data`
        const newInstance = { ...frozenDefaults, ...data };
        return isMutable ? Object.seal(newInstance) : Object.freeze(newInstance);
      }
    }
    return Struct;
  }

  static update(instance, updates) {
    if (Object.isFrozen(instance)) {
      throw new Error('Cannot mutate an immutable Record');
    }
    validateTypes(updates, instance);
    Object.assign(instance, updates);
    return instance;
  }

  static fork(instance, updates) {
    validateTypes(updates, instance);
    const newInstance = { ...instance, ...updates };
    return Object.isFrozen(instance) 
      ? Object.freeze(newInstance) 
      : Object.seal(newInstance);
  }
  
   // Метод `branch` видалено.
}

module.exports = { Record };

// Приклад використання оптимізованого коду

const User = Record.immutable({
  id: 0,
  name: 'Guest',
  email: null,
  roles: ['guest'],
});

const user1 = User.create({
  id: 1,
  name: 'Marcus',
});

console.log('User 1 (defaults applied):', user1);
const user2 = Record.fork(user1, { email: 'marcus@rome.com' });
console.log('User 2 (forked):', user2);
console.log('User 1 (remains unchanged):', user1);
try {
  User.create({ id: 2, name: 'Lucius', roles: 'admin' }); // roles має бути масивом
} catch (e) {
  console.error('\nSuccessfully caught type error:', e.message);
}
