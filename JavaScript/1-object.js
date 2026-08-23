'use strict';

// Робимо спільний об'єкт `rome` незмінним.
const rome = Object.freeze({ name: 'Rome' });

// Створюємо об'єкт `marcus` одразу з потрібними даними, без подальших мутацій.
const marcus = {
  id: 1,
  name: 'Marcus Aurelius',
  city: rome,
  email: 'marcus@metarhia.com',
};

// Створюємо `lucius` на основі `marcus` за допомогою spread-синтаксису
const lucius = {
  ...marcus,
  name: 'Lucius Verus',
  email: 'lucius@metarhia.com',
};

// Можна "заморозити" і фінальні об'єкти
console.log({ marcus, lucius });
