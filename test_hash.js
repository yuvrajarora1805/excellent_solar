const bcrypt = require('bcryptjs'); // or bcrypt
const hash = '$2b$12$Izv00qxOLA0XkqgpD505/uyH/9sLGex18qdJjWlp.sF7c3B34xX9S';
const match = bcrypt.compareSync('admin123', hash);
console.log('Match?', match);
