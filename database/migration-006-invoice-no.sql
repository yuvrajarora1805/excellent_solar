-- Migration 006: Add invoice_no column to product_serial_numbers table
ALTER TABLE product_serial_numbers 
  ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(50) DEFAULT NULL COMMENT 'FTR Import Invoice Number';
