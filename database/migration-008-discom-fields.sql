-- Add new fields for DISCOM applications to match new tracking requirements
ALTER TABLE discom_applications 
ADD COLUMN mco_issue ENUM('YES', 'NO') DEFAULT 'NO',
ADD COLUMN estimate_paid DECIMAL(12, 2) DEFAULT NULL,
ADD COLUMN second_xen_approval ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING';
