-- Migration 005: System Enhancements for DISCOM, Meter Status & Office Approvals

USE excellent_solar;

-- Add NP confirmation and Office approval fields to discom_applications
ALTER TABLE discom_applications
  ADD COLUMN IF NOT EXISTS np_confirmed TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS np_confirmed_by INT NULL,
  ADD COLUMN IF NOT EXISTS np_confirmed_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS meter_status VARCHAR(50) DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS meter_effect VARCHAR(50) DEFAULT 'NO',
  ADD COLUMN IF NOT EXISTS meter_verified_by INT NULL,
  ADD COLUMN IF NOT EXISTS meter_verified_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS office_approval_status VARCHAR(50) DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS office_approval_remarks TEXT NULL;

-- Expand users table role column width to avoid truncation for long role names
ALTER TABLE users MODIFY COLUMN role VARCHAR(100) DEFAULT 'WORKER';

-- Add uploader attribution tracking column to photo tables
ALTER TABLE site_survey_photos ADD COLUMN IF NOT EXISTS uploaded_by INT NULL;
ALTER TABLE installation_photos ADD COLUMN IF NOT EXISTS uploaded_by INT NULL;
