const bcrypt = require('bcryptjs');
const password = 'admin123';
const hash = '$2a$10$jLGw0yKFlgTriOpgpyXz/OhOINKpxKJRN252DhBZPdevAFrC9vk6m';

console.log('Testing bcrypt.compare...');
console.log('password:', password);
console.log('hash:', hash);

bcrypt.compare(password, hash).then(result => {
  console.log('Result:', result);
}).catch(err => {
  console.log('Error:', err.message);
});
