require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  try {
    const [users] = await connection.execute('SELECT id, email, password FROM users');
    
    let updatedCount = 0;
    
    for (const user of users) {
      // bcrypt hashes usually start with $2a$, $2b$, or $2y$ and are 60 characters long
      if (!user.password.startsWith('$2') || user.password.length < 50) {
        console.log(`Found plain-text password for user: ${user.email}`);
        
        // Hash the plain text password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update the database
        await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        console.log(`✅ Successfully hashed password for ${user.email}`);
        updatedCount++;
      }
    }
    
    console.log(`\nFinished! Updated ${updatedCount} users.`);
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await connection.end();
  }
}

fixPasswords();
