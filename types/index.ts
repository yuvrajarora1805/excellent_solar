// User Roles
export enum Role {
  ADMIN = 'ADMIN',
  MARKETING = 'MARKETING',
  INSTALLATION = 'INSTALLATION',
  DISCOM = 'DISCOM',
}

// User
export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  mobile?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Project Status
export enum ProjectStatus {
  NEW = 'NEW',
  SITE_SURVEY = 'SITE_SURVEY',
  SURVEY_SUBMITTED = 'SURVEY_SUBMITTED',
  SURVEY_VERIFIED = 'SURVEY_VERIFIED',
  MATERIAL_ALLOCATED = 'MATERIAL_ALLOCATED',
  INSTALLATION_STARTED = 'INSTALLATION_STARTED',
  INSTALLATION_COMPLETED = 'INSTALLATION_COMPLETED',
  FINAL_VERIFICATION = 'FINAL_VERIFICATION',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',
}

// Customer
export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  created_at: Date;
  updated_at: Date;
}

// Project
export interface Project {
  id: number;
  project_id: string;
  customer_id: number;
  status: ProjectStatus;
  account_number?: string;
  consumer_number?: string;
  discom?: string;
  subdivision?: string;
  division?: string;
  sanctioned_load?: number;
  solar_load?: number;
  site_address?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  installation_date?: Date;
  created_by: number;
  verified_by?: number;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
  customer?: Customer;
  created_by_user?: User;
  verified_by_user?: User;
}

// DISCOM Status
export enum DiscomStatus {
  DRAFT = 'DRAFT',
  DOCUMENTS_PENDING = 'DOCUMENTS_PENDING',
  DOCUMENTS_VERIFIED = 'DOCUMENTS_VERIFIED',
  APPLICATION_PREPARED = 'APPLICATION_PREPARED',
  SUBMITTED_TO_DISCOM = 'SUBMITTED_TO_DISCOM',
  JE_PENDING = 'JE_PENDING',
  JE_APPROVED = 'JE_APPROVED',
  SDO_PENDING = 'SDO_PENDING',
  SDO_APPROVED = 'SDO_APPROVED',
  XEN_PENDING = 'XEN_PENDING',
  XEN_APPROVED = 'XEN_APPROVED',
  ESTIMATE_GENERATED = 'ESTIMATE_GENERATED',
  FEE_PENDING = 'FEE_PENDING',
  FEE_PAID = 'FEE_PAID',
  PORTAL_UPDATE_PENDING = 'PORTAL_UPDATE_PENDING',
  PORTAL_UPDATED = 'PORTAL_UPDATED',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
}

// Product
export interface Product {
  id: number;
  product_code: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  specification?: string;
  unit: string;
  minimum_stock: number;
  current_stock: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  reserved_stock: number;
  selling_price: number;
}

// Stock Transaction Type
export enum StockTransactionType {
  PURCHASE = 'PURCHASE',
  ISSUE = 'ISSUE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
}

// Stock Transaction
export interface StockTransaction {
  id: number;
  product_id: number;
  type: StockTransactionType;
  quantity: number;
  reference_id?: number;
  reference_type?: string;
  remarks?: string;
  created_by: number;
  created_at: Date;
  product?: Product;
}

// Site Survey
export interface SiteSurvey {
  id: number;
  project_id: number;
  roof_type?: string;
  roof_condition?: string;
  available_area?: number;
  roof_length?: number;
  roof_width?: number;
  shading: boolean;
  extra_structure: boolean;
  structure_type?: string;
  structure_qty?: number;
  structure_cost?: number;
  estimated_capacity?: number;
  remarks?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  status: string;
  submitted_at?: Date;
  verified_at?: Date;
  rejection_reason?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// Installation
export interface Installation {
  id: number;
  project_id: number;
  installation_date?: Date;
  installed_capacity?: number;
  panel_quantity?: number;
  inverter_model?: string;
  structure_installed: boolean;
  earthing_completed: boolean;
  wiring_completed: boolean;
  testing_completed: boolean;
  remarks?: string;
  status: string;
  submitted_at?: Date;
  verified_at?: Date;
  rejection_reason?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// Document Status
export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// DISCOM Application
export interface DiscomApplication {
  id: number;
  application_id: string;
  project_id: number;
  status: DiscomStatus;
  submitted_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  processing_fee?: number | null;
  je_approval_status?: string | null;
  je_name?: string | null;
  je_phone?: string | null;
  sdo_xen_approval_status?: string | null;
  second_approval_status?: string | null;
  np_number?: string | null;
  file_apply_upload_path?: string | null;
  project?: Project;
}

// Document
export interface Document {
  id: number;
  discom_application_id: number;
  document_type_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  rejection_reason?: string;
  verified_by?: number;
  verified_at?: Date;
  created_by: number;
  created_at: Date;
}

// JE Verification
export interface JeVerification {
  id: number;
  discom_application_id: number;
  assigned_date?: Date;
  visit_date?: Date;
  status: string;
  remarks?: string;
  document_path?: string;
  created_at: Date;
  updated_at: Date;
}

// SDO Verification
export interface SdoVerification {
  id: number;
  discom_application_id: number;
  submission_date?: Date;
  approval_date?: Date;
  status: string;
  remarks?: string;
  created_at: Date;
  updated_at: Date;
}

// XEN Verification
export interface XenVerification {
  id: number;
  discom_application_id: number;
  submission_date?: Date;
  approval_date?: Date;
  status: string;
  remarks?: string;
  created_at: Date;
  updated_at: Date;
}

// Estimate
export interface Estimate {
  id: number;
  discom_application_id: number;
  estimate_number?: string;
  estimate_date?: Date;
  estimate_amount?: number;
  fee_amount?: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

// Estimate Payment
export interface EstimatePayment {
  id: number;
  estimate_id: number;
  payment_date?: Date;
  payment_reference?: string;
  payment_status: string;
  receipt_path?: string;
  created_at: Date;
  updated_at: Date;
}

// Portal Update
export interface PortalUpdate {
  id: number;
  discom_application_id: number;
  date: Date;
  user_id: number;
  action: string;
  reference_number?: string;
  status: string;
  remarks?: string;
  screenshot_path?: string;
  created_at: Date;
}

// Dashboard Stats
export interface DashboardStats {
  projects: {
    total: number;
    installation: number;
    completed: number;
    pending_verification: number;
  };
  discom: {
    total: number;
    pending_je: number;
    pending_sdo: number;
    pending_xen: number;
  };
  inventory: {
    panels: number;
    inverters: number;
    low_stock: number;
  };
}

// ============================================
// ENHANCED CUSTOMER TYPES
// ============================================

export enum CustomerType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  INSTITUTIONAL = 'INSTITUTIONAL',
}

export interface CustomerEnhanced extends Customer {
  pin_code?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy?: number;
  customer_type: CustomerType;
  customer_remarks?: string;
  sales_person?: string;
  lead_source?: string;
  alternative_mobile?: string;
}

// Solar Requirement
export interface SolarRequirement {
  connection_type: 'ON_GRID' | 'OFF_GRID' | 'HYBRID';
  required_capacity: number;
  estimated_monthly_consumption?: number;
  average_monthly_bill?: number;
  roof_type?: string;
  roof_area?: number;
  installation_type?: string;
}

// ============================================
// ELECTRICITY BILL
// ============================================

export interface ElectricityBill {
  id: number;
  customer_id: number;
  project_id?: number;
  account_number?: string;
  consumer_number?: string;
  consumer_name?: string;
  bill_address?: string;
  discom?: string;
  division?: string;
  subdivision?: string;
  sanctioned_load?: number;
  connected_load?: number;
  meter_number?: string;
  phase?: 'SINGLE' | 'THREE';
  tariff_category?: string;
  bill_date?: Date;
  due_date?: Date;
  bill_amount?: number;
  units_consumed?: number;
  file_path?: string;
  file_name?: string;
  ocr_extracted?: any;
  is_verified: boolean;
  verified_by?: number;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// WAREHOUSE
// ============================================

export enum WarehouseType {
  MAIN = 'MAIN',
  REGIONAL = 'REGIONAL',
  SITE_STORE = 'SITE_STORE',
  VEHICLE = 'VEHICLE',
  DAMAGED = 'DAMAGED',
  RETURNED = 'RETURNED',
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  warehouse_type: WarehouseType;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  manager_id?: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
  manager?: User;
}

// ============================================
// PRODUCT SERIAL NUMBERS
// ============================================

export enum SerialLocation {
  WAREHOUSE = 'WAREHOUSE',
  RESERVED = 'RESERVED',
  ISSUED = 'ISSUED',
  INSTALLED = 'INSTALLED',
  RETURNED = 'RETURNED',
  DAMAGED = 'DAMAGED',
  SOLD = 'SOLD',
}

export enum SerialStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  ISSUED = 'ISSUED',
  INSTALLED = 'INSTALLED',
  DAMAGED = 'DAMAGED',
  RETIRED = 'RETIRED',
}

export interface ProductSerialNumber {
  id: number;
  product_id: number;
  serial_number: string;
  warehouse_id?: number;
  current_location: SerialLocation;
  project_id?: number;
  purchase_id?: number;
  installation_id?: number;
  manufacturing_date?: Date;
  warranty_expiry?: Date;
  purchase_price?: number;
  remarks?: string;
  status: SerialStatus;
  created_at: Date;
  updated_at: Date;
  product?: Product;
  warehouse?: Warehouse;
}

// ============================================
// SYSTEM TEMPLATES & BOM
// ============================================

export enum SystemType {
  ON_GRID = 'ON_GRID',
  OFF_GRID = 'OFF_GRID',
  HYBRID = 'HYBRID',
}

export enum TemplateType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  CUSTOM = 'CUSTOM',
}

export interface SystemTemplate {
  id: number;
  name: string;
  code: string;
  description?: string;
  system_type: SystemType;
  capacity_kw: number;
  template_type: TemplateType;
  status: 'ACTIVE' | 'INACTIVE';
  created_by: number;
  created_at: Date;
  updated_at: Date;
  created_by_user?: User;
  items?: SystemTemplateItem[];
}

export interface SystemTemplateItem {
  id: number;
  system_template_id: number;
  product_id: number;
  quantity: number;
  unit: string;
  is_optional: boolean;
  sort_order: number;
  remarks?: string;
  created_at: Date;
  product?: Product;
}

export interface ProjectBom {
  id: number;
  project_id: number;
  system_template_id?: number;
  name?: string;
  description?: string;
  status: 'DRAFT' | 'FINALIZED' | 'APPROVED';
  created_by: number;
  approved_by?: number;
  created_at: Date;
  updated_at: Date;
  system_template?: SystemTemplate;
  items?: ProjectBomItem[];
}

export interface ProjectBomItem {
  id: number;
  project_bom_id: number;
  product_id: number;
  quantity: number;
  unit: string;
  is_optional: boolean;
  sort_order: number;
  remarks?: string;
  created_at: Date;
  product?: Product;
}

// ============================================
// INVENTORY RESERVATIONS
// ============================================

export enum ReservationStatus {
  REQUESTED = 'REQUESTED',
  PARTIAL = 'PARTIAL',
  FULLY_RESERVED = 'FULLY_RESERVED',
  ISSUED = 'ISSUED',
  RELEASED = 'RELEASED',
  CANCELLED = 'CANCELLED',
}

export interface InventoryReservation {
  id: number;
  project_id: number;
  reservation_number: string;
  reservation_date: Date;
  status: ReservationStatus;
  remarks?: string;
  created_by: number;
  approved_by?: number;
  created_at: Date;
  updated_at: Date;
  project?: Project;
  items?: InventoryReservationItem[];
}

export interface InventoryReservationItem {
  id: number;
  reservation_id: number;
  product_id: number;
  requested_quantity: number;
  reserved_quantity: number;
  shortage_quantity: number;
  unit: string;
  remarks?: string;
  created_at: Date;
  updated_at: Date;
  product?: Product;
}

export interface ReservationSerialNumber {
  id: number;
  reservation_item_id: number;
  serial_number_id: number;
  created_at: Date;
}

// ============================================
// QUOTATIONS
// ============================================

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CONVERTED_TO_ORDER = 'CONVERTED_TO_ORDER',
}

export interface Quotation {
  id: number;
  quotation_number: string;
  project_id: number;
  quotation_date: Date;
  valid_until?: Date;
  system_type?: SystemType;
  capacity_kw?: number;
  system_template_id?: number;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  gst_amount: number;
  gst_percentage: number;
  total_amount: number;
  payment_schedule?: any;
  status: QuotationStatus;
  sent_at?: Date;
  accepted_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
  terms_conditions?: string;
  remarks?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  project?: Project;
  system_template?: SystemTemplate;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: number;
  quotation_id: number;
  product_id?: number;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  line_total: number;
  sort_order: number;
  remarks?: string;
  created_at: Date;
  product?: Product;
}

// ============================================
// PAYMENTS
// ============================================

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
}

export enum PaymentScheduleStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
}

export interface PaymentSchedule {
  id: number;
  project_id: number;
  installment_number: number;
  installment_name: string;
  due_amount: number;
  due_date?: Date;
  status: PaymentScheduleStatus;
  remarks?: string;
  created_at: Date;
  updated_at: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
}

export interface Payment {
  id: number;
  payment_number: string;
  project_id: number;
  payment_schedule_id?: number;
  payment_date: Date;
  amount: number;
  payment_method: PaymentMethod;
  transaction_number?: string;
  cheque_number?: string;
  bank_name?: string;
  reference_person?: string;
  receipt_path?: string;
  status: PaymentStatus;
  remarks?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// DISCOM HIERARCHY
// ============================================

export interface DiscomMaster {
  id: number;
  code: string;
  name: string;
  state?: string;
  website?: string;
  portal_url?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
}

export interface DiscomDivision {
  id: number;
  discom_id: number;
  code: string;
  name: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
  discom?: DiscomMaster;
}

export interface DiscomSubdivision {
  id: number;
  division_id: number;
  code: string;
  name: string;
  area_covered?: string;
  office_address?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
  division?: DiscomDivision;
}

export enum DiscomContactType {
  JE = 'JE',
  SDO = 'SDO',
  XEN = 'XEN',
  METER = 'METER',
  LINE_MAN = 'LINE_MAN',
  OTHER = 'OTHER',
}

export interface DiscomContact {
  id: number;
  subdivision_id?: number;
  contact_type: DiscomContactType;
  name: string;
  designation?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  area?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED';
  remarks?: string;
  created_at: Date;
  updated_at: Date;
  subdivision?: DiscomSubdivision;
}

// ============================================
// SERVICE / AMC / WARRANTY
// ============================================

export enum WarrantyType {
  PRODUCT = 'PRODUCT',
  WORKMANSHIP = 'WORKMANSHIP',
  COMPREHENSIVE = 'COMPREHENSIVE',
}

export interface Warranty {
  id: number;
  project_id: number;
  warranty_type: WarrantyType;
  start_date: Date;
  end_date: Date;
  coverage_details?: string;
  terms_conditions?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date;
}

export interface AmcContract {
  id: number;
  contract_number: string;
  project_id: number;
  start_date: Date;
  end_date: Date;
  contract_amount?: number;
  payment_status: 'PENDING' | 'PARTIAL' | 'PAID';
  service_visits: number;
  completed_visits: number;
  cleaning_included: boolean;
  inspection_included: boolean;
  repairs_included: boolean;
  terms_conditions?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export enum ServiceCategory {
  INVERTER = 'INVERTER',
  PANELS = 'PANELS',
  WIRING = 'WIRING',
  STRUCTURE = 'STRUCTURE',
  GENERATION = 'GENERATION',
  MONITORING = 'MONITORING',
  OTHER = 'OTHER',
}

export enum IssueType {
  BREAKDOWN = 'BREAKDOWN',
  LOW_GENERATION = 'LOW_GENERATION',
  NO_POWER = 'NO_POWER',
  WIFI_ISSUE = 'WIFI_ISSUE',
  LEAKAGE = 'LEAKAGE',
  NOISE = 'NOISE',
  OTHER = 'OTHER',
}

export enum ServicePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ServiceTicketStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export interface ServiceTicket {
  id: number;
  ticket_number: string;
  project_id: number;
  customer_id: number;
  issue_category: ServiceCategory;
  issue_type: IssueType;
  priority: ServicePriority;
  description: string;
  assigned_to?: number;
  resolution?: string;
  resolved_at?: Date;
  status: ServiceTicketStatus;
  customer_rating?: number;
  customer_feedback?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  project?: Project;
  customer?: Customer;
  assigned_to_user?: User;
}

export interface ServiceVisit {
  id: number;
  service_ticket_id?: number;
  amc_contract_id?: number;
  visit_date: Date;
  technician_id: number;
  start_time?: string;
  end_time?: string;
  work_performed?: string;
  parts_used?: any;
  findings?: string;
  latitude?: number;
  longitude?: number;
  customer_signature_path?: string;
  customer_name?: string;
  customer_remarks?: string;
  before_photos?: any;
  after_photos?: any;
  created_at: Date;
  updated_at: Date;
  technician?: User;
}
