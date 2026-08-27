-- Excellent Solar Management System - MySQL Database Schema
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS excellent_solar;
USE excellent_solar;

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'WORKER',
  mobile VARCHAR(20),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CUSTOMERS
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mobile (mobile),
  INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  status ENUM('NEW', 'SITE_SURVEY', 'SURVEY_SUBMITTED', 'SURVEY_VERIFIED',
              'MATERIAL_ALLOCATED', 'INSTALLATION_STARTED', 'INSTALLATION_COMPLETED',
              'FINAL_VERIFICATION', 'PROJECT_COMPLETED') DEFAULT 'NEW',

  -- Customer DISCOM Info
  account_number VARCHAR(50),
  consumer_number VARCHAR(50),
  discom VARCHAR(100),
  subdivision VARCHAR(100),
  division VARCHAR(100),
  sanctioned_load DECIMAL(10, 2),
  solar_load DECIMAL(10, 2),

  -- Site Info
  site_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Installation Info
  capacity DECIMAL(10, 2),
  installation_date DATE,
  geotag_location VARCHAR(255),
  site_photo_path VARCHAR(500),

  -- Audit
  created_by INT NOT NULL,
  verified_by INT,
  verified_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id),

  INDEX idx_project_id (project_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROJECT STATUS HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS project_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id),

  INDEX idx_project_id (project_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PRODUCT CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PRODUCTS
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  specification TEXT,
  unit VARCHAR(20) DEFAULT 'Piece',
  minimum_stock INT DEFAULT 0,
  current_stock INT DEFAULT 0,
  reserved_stock INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_product_code (product_code),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_current_stock (current_stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SUPPLIERS
-- ============================================

CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  mobile VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  gstin VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PURCHASE INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  supplier_id INT NOT NULL,
  invoice_date DATE NOT NULL,
  total_amount DECIMAL(12, 2),
  remarks TEXT,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_invoice_number (invoice_number),
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_invoice_date (invoice_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PURCHASE ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_invoice_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  rate DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  remarks TEXT,

  FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),

  INDEX idx_purchase_invoice_id (purchase_invoice_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STOCK TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS stock_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('PURCHASE', 'ISSUE', 'RETURN', 'ADJUSTMENT') NOT NULL,
  quantity INT NOT NULL,
  reference_id INT,
  reference_type VARCHAR(50), -- 'PURCHASE_INVOICE', 'MATERIAL_ISSUE', etc.
  remarks TEXT,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_product_id (product_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STOCK ADJUSTMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  old_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  reason TEXT NOT NULL,

  created_by INT NOT NULL,
  approved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MATERIAL ISSUES
-- ============================================

CREATE TABLE IF NOT EXISTS material_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  issue_date DATE NOT NULL,
  remarks TEXT,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_project_id (project_id),
  INDEX idx_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MATERIAL ISSUE ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS material_issue_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_issue_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  remarks TEXT,

  FOREIGN KEY (material_issue_id) REFERENCES material_issues(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),

  INDEX idx_material_issue_id (material_issue_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SITE SURVEYS
-- ============================================

CREATE TABLE IF NOT EXISTS site_surveys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNIQUE NOT NULL,

  -- Survey Details
  roof_type VARCHAR(50),
  roof_condition VARCHAR(50),
  available_area DECIMAL(10, 2),
  roof_length DECIMAL(10, 2),
  roof_width DECIMAL(10, 2),
  shading BOOLEAN DEFAULT FALSE,
  extra_structure BOOLEAN DEFAULT FALSE,
  structure_type VARCHAR(50),
  structure_qty INT,
  structure_cost DECIMAL(10, 2),
  estimated_capacity DECIMAL(10, 2),
  remarks TEXT,

  -- GPS
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(10, 2),

  -- Status
  status ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED') DEFAULT 'DRAFT',
  submitted_at TIMESTAMP NULL,
  verified_at TIMESTAMP NULL,
  rejection_reason TEXT,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SITE SURVEY PHOTOS
-- ============================================

CREATE TABLE IF NOT EXISTS site_survey_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_survey_id INT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'SITE_FRONT', 'ROOF', 'METER', etc.
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),

  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  rejection_reason TEXT,

  FOREIGN KEY (site_survey_id) REFERENCES site_surveys(id) ON DELETE CASCADE,

  INDEX idx_site_survey_id (site_survey_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSTALLATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS installations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNIQUE NOT NULL,

  -- Installation Details
  installation_date DATE,
  installed_capacity DECIMAL(10, 2),
  panel_quantity INT,
  inverter_model VARCHAR(100),
  structure_installed BOOLEAN DEFAULT FALSE,
  earthing_completed BOOLEAN DEFAULT FALSE,
  wiring_completed BOOLEAN DEFAULT FALSE,
  testing_completed BOOLEAN DEFAULT FALSE,
  remarks TEXT,

  -- Status
  status ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED') DEFAULT 'DRAFT',
  submitted_at TIMESTAMP NULL,
  verified_at TIMESTAMP NULL,
  rejection_reason TEXT,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_project_id (project_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSTALLATION PHOTOS
-- ============================================

CREATE TABLE IF NOT EXISTS installation_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  installation_id INT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'BEFORE', 'DURING', 'AFTER', etc.
  subcategory VARCHAR(50),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (installation_id) REFERENCES installations(id) ON DELETE CASCADE,

  INDEX idx_installation_id (installation_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROJECT PHOTOS (General)
-- ============================================

CREATE TABLE IF NOT EXISTS project_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  category VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),

  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),

  INDEX idx_project_id (project_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DISCOM APPLICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS discom_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id VARCHAR(50) UNIQUE NOT NULL,
  project_id INT UNIQUE NOT NULL,
  status ENUM('DRAFT', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED', 'APPLICATION_PREPARED',
              'SUBMITTED_TO_DISCOM', 'JE_PENDING', 'JE_APPROVED', 'SDO_PENDING', 'SDO_APPROVED',
              'XEN_PENDING', 'XEN_APPROVED', 'ESTIMATE_GENERATED', 'FEE_PENDING', 'FEE_PAID',
              'PORTAL_UPDATE_PENDING', 'PORTAL_UPDATED', 'APPROVED', 'COMPLETED') DEFAULT 'DRAFT',

  np_number VARCHAR(100),
  application_date DATE NULL,
  processing_fee DECIMAL(10,2),
  je_name VARCHAR(100),
  je_phone VARCHAR(20),

  submitted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

  INDEX idx_application_id (application_id),
  INDEX idx_project_id (project_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DISCOM STATUS HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS discom_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discom_application_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (discom_application_id) REFERENCES discom_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id),

  INDEX idx_discom_application_id (discom_application_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DOCUMENT TYPES
-- ============================================

CREATE TABLE IF NOT EXISTS document_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  mandatory BOOLEAN DEFAULT TRUE,
  applicable_for VARCHAR(50), -- 'ALL', 'RESIDENTIAL', 'COMMERCIAL', etc.
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discom_application_id INT NOT NULL,
  document_type_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),

  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  rejection_reason TEXT,
  verified_by INT,
  verified_at TIMESTAMP NULL,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (discom_application_id) REFERENCES discom_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (document_type_id) REFERENCES document_types(id),
  FOREIGN KEY (verified_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_discom_application_id (discom_application_id),
  INDEX idx_document_type_id (document_type_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DOCUMENT CHECKLISTS
-- ============================================

CREATE TABLE IF NOT EXISTS document_checklists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discom_application_id INT NOT NULL,
  document_type_id INT NOT NULL,
  is_uploaded BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (discom_application_id) REFERENCES discom_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (document_type_id) REFERENCES document_types(id),

  UNIQUE KEY unique_app_doc (discom_application_id, document_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- JE VERIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS je_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discom_application_id INT UNIQUE NOT NULL,

  assigned_date DATE,
  visit_date DATE,
  status VARCHAR(50) DEFAULT 'PENDING',
  remarks TEXT,
  document_path VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (discom_application_id) REFERENCES discom_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SDO VERIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS sdo_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discom_application_id INT UNIQUE NOT NULL,

  submission_date DATE,
  approval_date DATE,
  status VARCHAR(50) DEFAULT 'PENDING',
  remarks TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (discom_application_id) REFERENCES discom_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- XEN VERIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS xen_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discom_application_id INT UNIQUE NOT NULL,

  submission_date DATE,
  approval_date DATE,
  status VARCHAR(50) DEFAULT 'PENDING',
  remarks TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (discom_application_id) REFERENCES discom_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ESTIMATES
-- ============================================

CREATE TABLE IF NOT EXISTS estimates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discom_application_id INT UNIQUE NOT NULL,

  estimate_number VARCHAR(100),
  estimate_date DATE,
  estimate_amount DECIMAL(12, 2),
  fee_amount DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'PENDING',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (discom_application_id) REFERENCES discom_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ESTIMATE PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS estimate_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estimate_id INT NOT NULL,

  payment_date DATE,
  payment_reference VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'PENDING',
  receipt_path VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PORTAL UPDATES
-- ============================================

CREATE TABLE IF NOT EXISTS portal_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discom_application_id INT NOT NULL,

  date DATE NOT NULL,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  reference_number VARCHAR(100),
  status VARCHAR(50),
  remarks TEXT,
  screenshot_path VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (discom_application_id) REFERENCES discom_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),

  INDEX idx_discom_application_id (discom_application_id),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'SITE_SURVEY', 'INSTALLATION', 'FINAL'
  file_path VARCHAR(500),
  generated_by INT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id),

  INDEX idx_project_id (project_id),
  INDEX idx_report_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'INFO', -- 'INFO', 'SUCCESS', 'WARNING', 'ERROR'
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),

  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA (Initial Admin User)
-- ============================================

-- Insert default admin user (password: admin123)
INSERT INTO users (email, name, password, role, mobile) VALUES
('admin@excellentsolar.com', 'System Administrator', '$2b$12$Izv00qxOLA0XkqgpD505/uyH/9sLGex18qdJjWlp.sF7c3B34xX9S', 'ADMIN', '9876543210')
ON DUPLICATE KEY UPDATE email = email;

-- Insert sample product categories
INSERT INTO product_categories (name, description) VALUES
('Solar Panels', 'Solar photovoltaic panels'),
('Inverters', 'Solar inverters and converters'),
('Structure', 'Mounting structures and rails'),
('Cables', 'DC and AC cables'),
('Connectors', 'MC4 and other connectors'),
('Earthing', 'Earthing materials and equipment'),
('Boxes', 'ACDB, DCDB, and junction boxes'),
('Breakers', 'MCB, MCCB, and other breakers'),
('Accessories', 'Miscellaneous accessories')
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample document types
INSERT INTO document_types (name, description, mandatory) VALUES
('Electricity Bill', 'Latest electricity bill', TRUE),
('Aadhaar Card', 'Aadhaar card for identity proof', TRUE),
('PAN Card', 'PAN card for identity proof', TRUE),
('Ownership Document', 'Property ownership document', TRUE),
('Customer Photograph', 'Passport size photograph', TRUE),
('Bank Document', 'Bank passbook or cancelled cheque', TRUE),
('Site Photograph', 'Photograph of the installation site', TRUE),
('Solar Proposal', 'Detailed solar proposal', TRUE)
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample products
INSERT INTO products (product_code, name, category, brand, model, specification, current_stock, reserved_stock, minimum_stock) VALUES
('SP-540W-LUM', 'Luminous 540W Mono PERC', 'Solar Panels', 'Luminous', 'LUM-540', '540W Monocrystalline', 150, 0, 20),
('SP-550W-WAA', 'Waaree 550W Bifacial', 'Solar Panels', 'Waaree', 'WAR-550B', '550W Bifacial', 200, 0, 30),
('INV-5KW-GRO', 'Growatt 5kW On-Grid', 'Inverters', 'Growatt', 'MIN 5000TL-X', '5kW Single Phase', 25, 0, 5),
('INV-10KW-LUM', 'Luminous 10kW On-Grid', 'Inverters', 'Luminous', 'NXI-110', '10kW Three Phase', 10, 0, 2),
('STR-GI-3KW', '3kW GI Structure', 'Structure', 'Local', 'GI-3KW', 'Galvanized Iron Structure', 50, 0, 10),
('CBL-DC-4SQ', '4 sqmm DC Cable', 'Cables', 'Polycab', 'DC-4SQ', '4 sqmm Tinned Copper', 1000, 0, 200)
ON DUPLICATE KEY UPDATE name = name;

-- ============================================
-- MISSING TABLES (Quotations, Service Tickets, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS service_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT,
  customer_id INT NOT NULL,
  issue_category VARCHAR(100),
  issue_type VARCHAR(100),
  priority VARCHAR(50),
  description TEXT,
  assigned_to INT,
  status VARCHAR(50) DEFAULT 'OPEN',
  resolved_at TIMESTAMP NULL,
  resolution TEXT,
  customer_rating INT,
  customer_feedback TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT,
  customer_id INT NOT NULL,
  quotation_date DATE NOT NULL,
  valid_until DATE,
  system_type VARCHAR(100),
  capacity_kw DECIMAL(10, 2),
  system_template_id INT,
  subtotal DECIMAL(12, 2),
  discount_amount DECIMAL(12, 2),
  discount_percentage DECIMAL(5, 2),
  gst_amount DECIMAL(12, 2),
  gst_percentage DECIMAL(5, 2),
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_schedule TEXT,
  status VARCHAR(50) DEFAULT 'DRAFT',
  terms_conditions TEXT,
  remarks TEXT,
  created_by INT,
  sent_at TIMESTAMP NULL,
  accepted_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  product_id INT,
  description VARCHAR(255),
  quantity INT NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  line_total DECIMAL(12, 2) NOT NULL,
  sort_order INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(100),
  description TEXT,
  system_type VARCHAR(100),
  capacity_kw DECIMAL(10, 2) NOT NULL,
  template_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_template_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  system_template_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit VARCHAR(50),
  is_optional BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (system_template_id) REFERENCES system_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  status VARCHAR(50) DEFAULT 'RESERVED',
  reserved_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY(project_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
