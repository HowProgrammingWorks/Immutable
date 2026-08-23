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

      // Приймаємо об'єкт з іменованими полями замість позиційних аргументів.

      static create(props) {
        const obj = Object.create(null);
        for (const field of fields) {
          if (!Reflect.has(props, field)) {
            throw new Error(`Missing field: ${field}`);
          }
          obj[field] = props[field];
        }

        for (const key in props) {
          if (!fieldSet.has(key)) {
            throw new Error(`Unexpected field: ${key}`);
          }
        }
        return isMutable ? Object.seal(obj) : Object.freeze(obj);
      }
    }
    return Struct;
  }

  // Оновлює мутабельний екземпляр. Залишається без змін, логіка коректна.
  
  static update(instance, updates) {
    if (Object.isFrozen(instance)) {
      throw new Error('Cannot mutate an immutable Record instance');
    }
    for (const key of Object.keys(updates)) {
      if (Reflect.has(instance, key)) {
        instance[key] = updates[key];
      }
    }
    return instance;
  }

   //Створює новий, незалежний екземпляр (імутабельне оновлення).

  static fork(instance, updates) {
    const newInstance = { ...instance, ...updates };
    return Object.isFrozen(instance) 
      ? Object.freeze(newInstance) 
      : Object.seal(newInstance);
  }

// Метод `branch` видалено.

}

module.exports = { Record };

// Приклад використання оптимізованого коду

const User = Record.immutable(['id', 'name', 'email']);
const user1 = User.create({
  id: 1,
  name: 'Marcus',
  email: 'marcus@metarhia.com',
});

const user2 = Record.fork(user1, { name: 'Marcus Aurelius' });

// `user1` залишився незмінним
const user3 = Record.fork(user2, { email: 'm.aurelius@rome.com', name: 'Marcus Aurelius Antoninus' });

console.log('User 1:', user1);
console.log('User 2:', user2);
console.log('User 3:', user3);

try {
  Record.update(user1, { name: 'FAIL' });
} catch (e) {
  console.error('\nSuccessfully caught error:', e.message);
}
