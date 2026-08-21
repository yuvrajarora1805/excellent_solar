const bcrypt = require('bcryptjs');
const hash = "$2b$12$Izv00qxOLA0XkqgpD505/uyH/9sLGex18qdJjWlp.sF7c3B34xX9S";
bcrypt.compare("admin123", hash).then(res => console.log("admin123:", res));
bcrypt.compare("password", hash).then(res => console.log("password:", res));
bcrypt.compare("excellent123", hash).then(res => console.log("excellent123:", res));
