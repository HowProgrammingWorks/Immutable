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

      // Приймаємо один об'єкт з іменованими аргументами
      static create(props) {
        for (const field of fields) {
          if (!Reflect.has(props, field)) {
            throw new Error(`Missing field: ${field}`);
          }
        }
        
        // Перевірка на зайві поля (опціонально)
        for (const key in props) {
            if (!fieldSet.has(key)) {
                throw new Error(`Unexpected field: ${key}`);
            }
        }

        // Створюємо об'єкт більш декларативно
        const obj = Object.fromEntries(
          fields.map(field => [field, props[field]])
        );

        // Залишаємо вихідну логіку "заморозки"
        return isMutable ? Object.seal(obj) : Object.freeze(obj);
      }
    }
    return Struct;
  }

  // Функція використання update має бути усвідомленим
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
// Зробимо User також імутабельним для кращої практики
const User = Record.immutable(['id', 'name', 'city', 'email']); 

// Створюємо екземпляри за допомогою іменованих полів — це набагато чистіше
const rome = City.create({ name: 'Rome' });

const marcus = User.create({
  id: 1,
  name: 'Marcus',
  city: rome,
  email: 'marcus@metarhia.com'
});

// Замість мутації (update), створюємо нову версію об'єкта через fork
const marcusUpdated = Record.fork(marcus, { name: 'Marcus Aurelius' });

const lucius = Record.fork(marcusUpdated, { 
    name: 'Lucius Verus',
    email: 'lucius@metarhia.com'
});

console.log({ marcus, marcusUpdated, lucius });

// Спроба оновити імутабельний об'єкт викличе помилку
try {
    Record.update(marcus, { name: 'FAIL' });
} catch (err) {
    console.error('\nError trying to update immutable record:', err.message);
}
