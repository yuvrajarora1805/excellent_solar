const mysql = require('mysql2/promise');

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost', user: 'solar_user', password: 'solar123', database: 'excellent_solar'
    });
    
    // Hash for "admin123"
    const defaultHash = '$2b$12$Izv00qxOLA0XkqgpD505/uyH/9sLGex18qdJjWlp.sF7c3B34xX9S';
    
    await conn.query(
      'UPDATE users SET password = ? WHERE email = ?', 
      [defaultHash, 'admin@excellentsolar.com']
    );
    
    console.log("Admin password reset successfully.");
    conn.end();
  } catch (error) {
    console.error("Fatal error:", error);
  }
}
run();
