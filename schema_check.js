const { query } = require('./lib/db');
query('SHOW CREATE TABLE product_serial_numbers').then(r => console.log(r[0]['Create Table'])).catch(console.error);
