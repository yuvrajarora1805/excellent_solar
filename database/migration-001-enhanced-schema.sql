-- ============================================
-- EXCELLENT SOLAR - ENHANCED SCHEMA MIGRATION
-- Migration: 001
-- Description: Add critical missing tables for comprehensive solar management
-- ============================================

USE excellent_solar;

-- ============================================
-- ENHANCE CUSTOMERS TABLE
-- ============================================

-- Add new columns to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS gps_latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS gps_longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS gps_accuracy DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS customer_type ENUM('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INSTITUTIONAL') DEFAULT 'RESIDENTIAL',
  ADD COLUMN IF NOT EXISTS customer_remarks TEXT,
  ADD COLUMN IF NOT EXISTS sales_person VARCHAR(255),
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS alternative_mobile VARCHAR(20);

-- ============================================
-- ELECTRICITY BILLS
-- ============================================

CREATE TABLE IF NOT EXISTS electricity_bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  project_id INT,

  -- Bill Details
  account_number VARCHAR(50),
  consumer_number VARCHAR(50),
  consumer_name VARCHAR(255),
  bill_address TEXT,

  -- DISCOM Info
  discom VARCHAR(100),
  division VARCHAR(100),
  subdivision VARCHAR(100),

  -- Load/Connection Info
  sanctioned_load DECIMAL(10, 2),
  connected_load DECIMAL(10, 2),
  meter_number VARCHAR(50),
  phase ENUM('SINGLE', 'THREE'),
  tariff_category VARCHAR(50),

  -- Bill Info
  bill_date DATE,
  due_date DATE,
  bill_amount DECIMAL(10, 2),
  units_consumed DECIMAL(10, 2),

  -- Document
  file_path VARCHAR(500),
  file_name VARCHAR(255),
  ocr_extracted JSON,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INT,
  verified_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id),

  INDEX idx_customer_id (customer_id),
  INDEX idx_project_id (project_id),
  INDEX idx_account_number (account_number),
  INDEX idx_consumer_number (consumer_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- WAREHOUSES
-- ============================================

CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  warehouse_type ENUM('MAIN', 'REGIONAL', 'SITE_STORE', 'VEHICLE', 'DAMAGED', 'RETURNED') DEFAULT 'MAIN',
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pin_code VARCHAR(10),
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  manager_id INT,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (manager_id) REFERENCES users(id),
  INDEX idx_code (code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PRODUCT SERIAL NUMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS product_serial_numbers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  warehouse_id INT,
  current_location ENUM('WAREHOUSE', 'RESERVED', 'ISSUED', 'INSTALLED', 'RETURNED', 'DAMAGED', 'SOLD') DEFAULT 'WAREHOUSE',
  project_id INT,
  purchase_id INT,
  installation_id INT,
  manufacturing_date DATE,
  warranty_expiry DATE,
  purchase_price DECIMAL(10, 2),
  remarks TEXT,
  status ENUM('AVAILABLE', 'RESERVED', 'ISSUED', 'INSTALLED', 'DAMAGED', 'RETIRED') DEFAULT 'AVAILABLE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (installation_id) REFERENCES installations(id) ON DELETE SET NULL,

  UNIQUE KEY unique_serial (serial_number),
  INDEX idx_product_id (product_id),
  INDEX idx_warehouse_id (warehouse_id),
  INDEX idx_current_location (current_location),
  INDEX idx_status (status),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS system_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  system_type ENUM('ON_GRID', 'OFF_GRID', 'HYBRID') NOT NULL,
  capacity_kw DECIMAL(10, 2) NOT NULL,
  template_type ENUM('STANDARD', 'PREMIUM', 'CUSTOM') DEFAULT 'STANDARD',
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_code (code),
  INDEX idx_system_type (system_type),
  INDEX idx_capacity_kw (capacity_kw),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM TEMPLATE BOM ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS system_template_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  system_template_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'Piece',
  is_optional BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (system_template_id) REFERENCES system_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),

  INDEX idx_system_template_id (system_template_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROJECT SYSTEM BOM (Generated from template or custom)
-- ============================================

CREATE TABLE IF NOT EXISTS project_bom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  system_template_id INT,
  name VARCHAR(255),
  description TEXT,
  status ENUM('DRAFT', 'FINALIZED', 'APPROVED') DEFAULT 'DRAFT',
  created_by INT NOT NULL,
  approved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (system_template_id) REFERENCES system_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),

  UNIQUE KEY unique_project_bom (project_id),
  INDEX idx_project_id (project_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROJECT BOM ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS project_bom_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_bom_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'Piece',
  is_optional BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (project_bom_id) REFERENCES project_bom(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),

  INDEX idx_project_bom_id (project_bom_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVENTORY RESERVATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  reservation_number VARCHAR(50) UNIQUE NOT NULL,
  reservation_date DATE NOT NULL,
  status ENUM('REQUESTED', 'PARTIAL', 'FULLY_RESERVED', 'ISSUED', 'RELEASED', 'CANCELLED') DEFAULT 'REQUESTED',
  remarks TEXT,
  created_by INT NOT NULL,
  approved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),

  INDEX idx_project_id (project_id),
  INDEX idx_reservation_number (reservation_number),
  INDEX idx_status (status),
  INDEX idx_reservation_date (reservation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVENTORY RESERVATION ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_reservation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  product_id INT NOT NULL,
  requested_quantity DECIMAL(10, 2) NOT NULL,
  reserved_quantity DECIMAL(10, 2) DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'Piece',
  shortage_quantity DECIMAL(10, 2) GENERATED ALWAYS AS (requested_quantity - reserved_quantity) STORED,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (reservation_id) REFERENCES inventory_reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),

  INDEX idx_reservation_id (reservation_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVENTORY RESERVATION SERIAL NUMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS reservation_serial_numbers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_item_id INT NOT NULL,
  serial_number_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (reservation_item_id) REFERENCES inventory_reservation_items(id) ON DELETE CASCADE,
  FOREIGN KEY (serial_number_id) REFERENCES product_serial_numbers(id),

  UNIQUE KEY unique_reservation_serial (reservation_item_id, serial_number_id),
  INDEX idx_reservation_item_id (reservation_item_id),
  INDEX idx_serial_number_id (serial_number_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- QUOTATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT NOT NULL,
  quotation_date DATE NOT NULL,
  valid_until DATE,

  -- System Details
  system_type ENUM('ON_GRID', 'OFF_GRID', 'HYBRID'),
  capacity_kw DECIMAL(10, 2),
  system_template_id INT,

  -- Financials
  subtotal DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  gst_amount DECIMAL(12, 2) DEFAULT 0,
  gst_percentage DECIMAL(5, 2) DEFAULT 18,
  total_amount DECIMAL(12, 2) DEFAULT 0,

  -- Payment Terms
  payment_schedule JSON,

  -- Status
  status ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_ORDER') DEFAULT 'DRAFT',
  sent_at TIMESTAMP NULL,
  accepted_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  rejection_reason TEXT,

  -- Terms
  terms_conditions TEXT,
  remarks TEXT,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (system_template_id) REFERENCES system_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_quotation_number (quotation_number),
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_quotation_date (quotation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- QUOTATION ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS quotation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  product_id INT,
  description VARCHAR(500),
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'Piece',
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  line_total DECIMAL(12, 2) NOT NULL,
  sort_order INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,

  INDEX idx_quotation_id (quotation_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PAYMENTS & PAYMENT SCHEDULES
-- ============================================

CREATE TABLE IF NOT EXISTS payment_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  installment_number INT NOT NULL,
  installment_name VARCHAR(100) NOT NULL,
  due_amount DECIMAL(12, 2) NOT NULL,
  due_date DATE,
  status ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED') DEFAULT 'PENDING',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

  UNIQUE KEY unique_project_installment (project_id, installment_number),
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT NOT NULL,
  payment_schedule_id INT,

  -- Payment Details
  payment_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'ONLINE') NOT NULL,

  -- Reference
  transaction_number VARCHAR(100),
  cheque_number VARCHAR(50),
  bank_name VARCHAR(100),
  reference_person VARCHAR(255),

  -- Document
  receipt_path VARCHAR(500),

  -- Status
  status ENUM('PENDING', 'COMPLETED', 'REJECTED', 'REFUNDED') DEFAULT 'COMPLETED',
  remarks TEXT,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_schedule_id) REFERENCES payment_schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_payment_number (payment_number),
  INDEX idx_project_id (project_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DISCOM HIERARCHY
-- ============================================

CREATE TABLE IF NOT EXISTS discom_masters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  state VARCHAR(100),
  website VARCHAR(255),
  portal_url VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_code (code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS discom_divisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discom_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  district VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (discom_id) REFERENCES discom_masters(id) ON DELETE CASCADE,

  UNIQUE KEY unique_discom_division (discom_id, code),
  INDEX idx_discom_id (discom_id),
  INDEX idx_code (code),
  INDEX idx_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS discom_subdivisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  division_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  area_covered TEXT,
  office_address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (division_id) REFERENCES discom_divisions(id) ON DELETE CASCADE,

  UNIQUE KEY unique_division_subdivision (division_id, code),
  INDEX idx_division_id (division_id),
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS discom_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subdivision_id INT,
  contact_type ENUM('JE', 'SDO', 'XEN', 'METER', 'LINE_MAN', 'OTHER') NOT NULL,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  email VARCHAR(255),
  area TEXT,
  status ENUM('ACTIVE', 'INACTIVE', 'TRANSFERRED') DEFAULT 'ACTIVE',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (subdivision_id) REFERENCES discom_subdivisions(id) ON DELETE SET NULL,

  INDEX idx_subdivision_id (subdivision_id),
  INDEX idx_contact_type (contact_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SERVICE / AMC / WARRANTY
-- ============================================

CREATE TABLE IF NOT EXISTS warranties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  warranty_type ENUM('PRODUCT', 'WORKMANSHIP', 'COMPREHENSIVE') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  coverage_details TEXT,
  terms_conditions TEXT,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS amc_contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Contract Details
  contract_amount DECIMAL(12, 2),
  payment_status ENUM('PENDING', 'PARTIAL', 'PAID') DEFAULT 'PENDING',
  service_visits INT DEFAULT 4,
  completed_visits INT DEFAULT 0,

  -- Services Included
  cleaning_included BOOLEAN DEFAULT TRUE,
  inspection_included BOOLEAN DEFAULT TRUE,
  repairs_included BOOLEAN DEFAULT FALSE,

  terms_conditions TEXT,
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_contract_number (contract_number),
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT NOT NULL,
  customer_id INT NOT NULL,

  -- Ticket Details
  issue_category ENUM('INVERTER', 'PANELS', 'WIRING', 'STRUCTURE', 'GENERATION', 'MONITORING', 'OTHER') NOT NULL,
  issue_type ENUM('BREAKDOWN', 'LOW_GENERATION', 'NO_POWER', 'WIFI_ISSUE', 'LEAKAGE', 'NOISE', 'OTHER') NOT NULL,
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  description TEXT NOT NULL,

  -- Resolution
  assigned_to INT,
  resolution TEXT,
  resolved_at TIMESTAMP NULL,

  -- Status
  status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED') DEFAULT 'OPEN',

  -- Customer Feedback
  customer_rating INT,
  customer_feedback TEXT,

  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_ticket_number (ticket_number),
  INDEX idx_project_id (project_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_ticket_id INT,
  amc_contract_id INT,
  visit_date DATE NOT NULL,
  technician_id INT NOT NULL,

  -- Visit Details
  start_time TIME,
  end_time TIME,
  work_performed TEXT,
  parts_used JSON,
  findings TEXT,

  -- GPS
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Customer Sign-off
  customer_signature_path VARCHAR(500),
  customer_name VARCHAR(255),
  customer_remarks TEXT,

  -- Before/After Photos
  before_photos JSON,
  after_photos JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (service_ticket_id) REFERENCES service_tickets(id) ON DELETE SET NULL,
  FOREIGN KEY (amc_contract_id) REFERENCES amc_contracts(id) ON DELETE SET NULL,
  FOREIGN KEY (technician_id) REFERENCES users(id),

  INDEX idx_service_ticket_id (service_ticket_id),
  INDEX idx_amc_contract_id (amc_contract_id),
  INDEX idx_visit_date (visit_date),
  INDEX idx_technician_id (technician_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- UPDATE PROJECT STATUS ENUM
-- ============================================

-- Create a new table with updated statuses if needed
-- For now, we'll add the new statuses via comment for reference
-- Additional statuses needed:
-- LEAD, CUSTOMER_REGISTERED, SITE_SURVEY_PENDING, DOCUMENTS_PENDING,
-- QUOTATION_PREPARED, QUOTATION_APPROVED, BOOKING_RECEIVED,
-- DISCOM_APPLICATION, PROCESSING_FEE, ESTIMATE, APPROVAL,
-- MATERIAL_RESERVED, INSTALLATION_SCHEDULED, METER_NET_METERING,
-- FINAL_PAYMENT, PROJECT_COMPLETED

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default warehouse
INSERT INTO warehouses (code, name, warehouse_type, city, state) VALUES
('WH-MAIN', 'Main Warehouse - Ludhiana', 'MAIN', 'Ludhiana', 'Punjab')
ON DUPLICATE KEY UPDATE code = code;

-- Insert sample DISCOM
INSERT INTO discom_masters (code, name, state, portal_url) VALUES
('PSPCL', 'Punjab State Power Corporation Ltd', 'Punjab', 'https://pspcl.com')
ON DUPLICATE KEY UPDATE code = code;

-- Insert sample System Templates
INSERT INTO system_templates (name, code, description, system_type, capacity_kw, template_type, created_by) VALUES
('3 kW On-Grid - Standard', '3KW-ON-STD', 'Standard 3 kW On-Grid Solar System', 'ON_GRID', 3.0, 'STANDARD', 1),
('5 kW On-Grid - Standard', '5KW-ON-STD', 'Standard 5 kW On-Grid Solar System', 'ON_GRID', 5.0, 'STANDARD', 1),
('5 kW On-Grid - Premium', '5KW-ON-PREM', 'Premium 5 kW On-Grid Solar System with High Efficiency Panels', 'ON_GRID', 5.0, 'PREMIUM', 1),
('10 kW On-Grid - Standard', '10KW-ON-STD', 'Standard 10 kW On-Grid Solar System', 'ON_GRID', 10.0, 'STANDARD', 1),
('5 kW Hybrid - Standard', '5KW-HYB-STD', 'Standard 5 kW Hybrid Solar System with Battery Backup', 'HYBRID', 5.0, 'STANDARD', 1),
('3 kW Off-Grid - Standard', '3KW-OFF-STD', 'Standard 3 kW Off-Grid Solar System', 'OFF_GRID', 3.0, 'STANDARD', 1)
ON DUPLICATE KEY UPDATE code = code;

-- ============================================
-- END OF MIGRATION
-- ============================================
