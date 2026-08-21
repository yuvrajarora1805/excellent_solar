-- Migration 004: Inventory Reservation System
-- Adds reserved_stock to products and creates project_reservations table

USE excellent_solar;

-- Step 1: Add reserved_stock column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INT DEFAULT 0;

-- Step 2: Create project_reservations table
CREATE TABLE IF NOT EXISTS project_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  status ENUM('RESERVED', 'ISSUED', 'RELEASED') DEFAULT 'RESERVED',
  reserved_by INT NOT NULL,
  notes TEXT,
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (reserved_by) REFERENCES users(id),

  UNIQUE KEY unique_project_product (project_id, product_id),
  INDEX idx_project_id (project_id),
  INDEX idx_product_id (product_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
