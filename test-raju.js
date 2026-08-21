const bcrypt = require('bcryptjs');
const hash = "$2b$12$4j4PRl8u96dxGXlIG44tYOJAEmsdJ3FBJXV5qqk2AG.M21eag12EK";
bcrypt.compare("password", hash).then(res => console.log("raju password:", res));
