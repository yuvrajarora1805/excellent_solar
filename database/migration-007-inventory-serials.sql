-- Migration: Add inventory_serials table

CREATE TABLE IF NOT EXISTS inventory_serials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  status ENUM('IN_STOCK', 'DISPATCHED', 'RETURNED') DEFAULT 'IN_STOCK',
  added_by INT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES users(id),

  UNIQUE KEY unique_serial (serial_number),
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
