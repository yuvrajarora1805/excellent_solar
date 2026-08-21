# Excellent Solar - Product Plan
## Web Application & Mobile App Feature Allocation

---

## 🎯 Core Principle

**Web = Command Center**  
**Mobile = Field Tool**

The web application is for administration, reporting, and office operations. The mobile app is for field workers performing site visits, surveys, and installations.

**Mobile Connectivity Strategy: Online-First with Graceful Sync**
- Mobile app operates **online-first** — assumes network is available
- All actions attempt real-time sync with server
- If network is unavailable, data is saved locally
- Automatic background sync when connection restores
- Visual indicator shows sync status (synced, syncing, pending)

---

## 👥 User Roles & Platform Access

| Role | Web Access | Mobile Access | Primary Focus |
|------|-----------|---------------|---------------|
| **Admin** | ✅ Full | ✅ View Only | Dashboard, Reports, Settings, All CRUD |
| **Sales/Office Staff** | ✅ Partial | ❌ | Customers, Quotations, Projects, Scheduling |
| **Field Worker** | ❌ | ✅ Full | Site Surveys, Installations, Photo Uploads |
| **DISCOM Operator** | ✅ Partial | ❌ | DISCOM Applications, Document Tracking |

---

## 🖥️ Web Application Features

### 1. Dashboard (Admin/Office Only)
- KPI overview (leads, jobs, installs this month, pending DISCOM)
- Project pipeline funnel visualization
- Today's schedule (surveys, installations, DISCOM tasks)
- Inventory status alerts
- Team workload overview
- Revenue & quotation metrics

### 2. Customer Management
- Customer database (CRUD)
- Lead tracking with source attribution
- Customer communication history
- Document repository (electricity bills, IDs, contracts)
- Search & filter
- Customer portal links (for future self-service)

### 3. Project Management
- Create projects from leads
- Project status tracking (New → Survey → Design → Install → DISCOM → Done)
- Project timeline/Gantt view
- Assign projects to workers
- Project documents & specifications
- Bulk project actions (reassign, update status)

### 4. Quotations (Office/Admin)
- Create quotations from system templates
- Custom quotation builder
- Line items, discounts, GST calculation
- Send quotation (email/PDF)
- Quotation status tracking (Draft → Sent, Accepted, Rejected)
- Convert accepted quotation to project
- Quotation analytics (conversion rate, average value)

### 5. Inventory Management
- Product catalog (panels, inverters, mounting structures, wiring)
- Stock levels & locations
- Stock transactions (in/out)
- Low stock alerts & reordering
- Supplier database
- Purchase orders & invoices
- Stock reservations for projects
- Stock transfer between warehouses

### 6. Scheduling & Dispatch
- Calendar view of surveys & installations
- Assign workers to jobs
- Route optimization (future)
- Daily job sheets for workers
- Rescheduling tools

### 7. DISCOM Application Tracking
- Application dashboard with stage tracking
- Document checklist per application
- Status by stage (JE, SDO, XEN, Estimate, Fee, Approval)
- Bulk upload documents for multiple applications
- Track pending approvals
- Application aging reports
- Fee payment tracking

### 8. Service Management
- Service ticket creation
- Ticket assignment to workers
- Priority levels (Low, Medium, High, Urgent)
- SLA tracking
- Resolution tracking
- Customer communication logs
- Warranty tracking per installation

### 9. Reports & Analytics
- Project status reports
- Sales performance reports
- Installation completion reports
- DISCOM clearance reports
- Inventory reports
- Worker productivity reports
- Monthly/quarterly summaries
- Export to PDF/Excel
- Scheduled email reports

### 10. User Management
- User CRUD operations
- Role assignment (Admin, Sales, Worker, DISCOM Operator)
- Team management
- Performance tracking
- Access logs

### 11. Settings & Configuration
- Company profile & branding
- System templates (solar configurations)
- Tax rates (GST)
- Notification preferences
- Email/SMS templates
- Backup & restore
- Permission configuration

### 12. System Templates
- Pre-configured solar system templates
- Template components (panel + inverter bundles)
- Pricing per template
- Template specifications
- Template usage analytics

---

## 📱 Mobile App Features (Field Worker)

### 1. Authentication
- Secure login (email/password)
- Biometric login (fingerprint/face) for quick access
- Remember me functionality
- Session management with auto-refresh
- Logout with confirmation

### 2. My Jobs Dashboard
- Today's assigned jobs (surveys + installations)
- Week view calendar
- Job list with filters (Today, Upcoming, Completed, All)
- Status badges (Pending, In Progress, Completed)
- Quick actions (Start Job, View Details, Navigate)
- Sync status indicator
- Pull-to-refresh

### 3. Site Survey Module

#### Customer Information Section (Read-Only)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Customer Name | Text | Read-only | From system |
| Phone Number | Phone | Read-only | Tap to call |
| Email | Email | Read-only | Tap to email |
| Site Address | Text | Read-only | Full address |
| Contact Person | Text | Read-only | If different from customer |
| Contact Phone | Phone | Read-only | If different from customer |

#### GPS Location Section
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Latitude | Number | ✅ Yes | Auto-captured, decimal format |
| Longitude | Number | ✅ Yes | Auto-captured, decimal format |
| Accuracy | Number | No | GPS accuracy in meters (auto) |
| Capture Method | Select | ✅ Yes | Auto / Manual |
| Map Preview | Map | No | Visual confirmation of location |
| Open in Maps | Button | No | Launch external maps app |

**Actions:**
- "Capture Current Location" button — uses device GPS
- "Verify on Map" — shows pin on map
- Manual override allowed if GPS inaccurate

#### Site Photos Section
| Field | Type | Required | Max Photos |
|-------|------|----------|------------|
| Roof Photos | Image | ✅ Yes | 5 |
| Shadow Area Photos | Image | ✅ Yes | 3 |
| Electricity Meter | Image | ✅ Yes | 2 |
| Service Main | Image | ✅ Yes | 2 |
| Site Entrance | Image | No | 2 |
| Obstacle Photos | Image | No | 5 |
| Additional Notes | Text | No | 500 chars |

**Photo Features:**
- Capture from camera or select from gallery
- Auto-tag based on photo category
- Preview thumbnail gallery
- Delete individual photos
- Photo compression (max 2MB per photo)
- Timestamp auto-recorded

#### Roof Details Section
| Field | Type | Required | Options |
|-------|------|----------|---------|
| Roof Type | Select | ✅ Yes | Flat, Tilted, Asbestos Sheet, Metal Sheet, Concrete, Tile |
| Roof Orientation | Select | ✅ Yes | North, South, East, West, North-East, North-West, South-East, South-West |
| Roof Tilt Angle | Number | No | Degrees (0-90) |
| Roof Area | Number | ✅ Yes | Square feet |
| Area Calculation Method | Select | ✅ Yes | Measured / Estimated |
| Building Floors | Number | ✅ Yes | Total floors in building |
| Installation Floor | Number | ✅ Yes | Which floor for installation |
| Shadow Intensity | Select | ✅ Yes | No Shadow, Light Shadow, Moderate Shadow, Heavy Shadow |
| Shadow Source | Text | No | Describe shadow sources (trees, buildings) |
| Access Type | Select | ✅ Yes | Stairs, Lift, Both, Difficult |
| Structure Condition | Select | ✅ Yes | New, Good, Fair, Needs Repair |

#### Electrical Details Section
| Field | Type | Required | Options |
|-------|------|----------|---------|
| Current Connection Type | Select | ✅ Yes | Single Phase, Three Phase |
| Current Load | Number | ✅ Yes | kW |
| Meter Number | Text | ✅ Yes | As per electricity bill |
| DISCOM | Select | ✅ Yes | [Dynamic list from system] |
| Consumer Number | Text | ✅ Yes | From electricity bill |
| Existing Sanctioned Load | Number | No | kW (if available) |
| Proposed System Capacity | Number | ✅ Yes | kW (recommended) |
| Net Metering Required | Boolean | ✅ Yes | Yes / No |
| Phase Upgrade Required | Boolean | No | Yes / No |

#### Site Assessment Section
| Field | Type | Required | Options |
|-------|------|----------|---------|
| Site Accessibility | Select | ✅ Yes | Easy, Moderate, Difficult, Very Difficult |
| Vehicle Parking | Select | ✅ Yes | Available, Nearby, Not Available |
| Distance from Parking | Number | No | Meters (walking distance) |
| Material Handling | Select | ✅ Yes | Easy, Moderate, Difficult |
| Work Hours Possible | Select | ✅ Yes | Anytime, Morning Only, Evening Only, Restricted |
| Water Availability | Select | ✅ Yes | Available, Not Available |
| Permission Required | Boolean | No | Yes / No |
| Permission Details | Text | No | If yes, describe |

#### Recommended System Section
| Field | Type | Required | Options |
|-------|------|----------|---------|
| Recommended Capacity | Number | ✅ Yes | kW |
| Panel Type | Select | ✅ Yes | [From system templates] |
| Panel Quantity | Number | ✅ Yes | Count |
| Inverter Type | Select | ✅ Yes | [From system templates] |
| Inverter Capacity | Number | ✅ Yes | kW |
| Mounting Structure | Select | ✅ Yes | Rail, Clamp, Standing Seam |
| Estimated Generation | Number | ✅ Yes | Units per day (auto-calculated) |

#### Notes Section
| Field | Type | Required | Max Length |
|-------|------|----------|-------------|
| Surveyor Notes | Textarea | No | 1000 chars |
| Special Instructions | Textarea | No | 1000 chars |
| Customer Concerns | Textarea | No | 1000 chars |
| Voice Note | Audio | No | Max 3 minutes |

#### Survey Form Actions
- **Save as Draft** — Saves locally, syncs when online
- **Submit for Verification** — Validates all required fields, submits to server
- **Clear Form** — Clears all fields (with confirmation)
- **Cancel** — Return to job list

**Sync Status Indicator:**
- 🟢 Synced — All data uploaded to server
- 🟡 Syncing — Uploading data
- 🔴 Pending — Saved locally, waiting for network
- ❌ Sync Failed — Retry required

---

### 4. Installation Module

#### Project Information Section (Read-Only)
| Field | Type | Notes |
|-------|------|-------|
| Project ID | Text | From system |
| Customer Name | Text | From system |
| Site Address | Text | From system |
| System Capacity | Text | e.g., "5 kW" |
| Assigned Components | List | Panels, Inverter, Structure, etc. |

#### Pre-Installation Checklist Section
| Field | Type | Required | Options |
|-------|------|----------|---------|
| Material Received | Boolean | ✅ Yes | Yes / No |
| Material Condition | Select | ✅ Yes | Good, Damaged, Partial |
| Tools Available | Boolean | ✅ Yes | Yes / No |
| Safety Equipment | Boolean | ✅ Yes | Yes / No |
| Site Access Confirmed | Boolean | ✅ Yes | Yes / No |
| Customer Present | Boolean | ✅ Yes | Yes / No |
| Weather Suitable | Boolean | ✅ Yes | Yes / No |

#### Component Verification Section (QR Code Scanning)
| Field | Type | Required |
|-------|------|----------|
| Panel 1 QR | Scan/Text | ✅ Yes |
| Panel 2 QR | Scan/Text | ✅ Yes |
| ... | ... | ... (repeat for all panels) |
| Inverter QR | Scan/Text | ✅ Yes |
| Structure QR | Scan/Text | ✅ Yes |

**Actions:**
- Scan QR code with camera
- Manual entry option (if QR damaged)
- Shows component details after scan
- Mismatch warning if component doesn't match project
- Mark as verified

#### Installation Photos Section
| Photo Category | Required | Max Count | Description |
|----------------|----------|-----------|-------------|
| Before Photos | ✅ Yes | 5 | Site before installation starts |
| Structure Mounting | ✅ Yes | 5 | Rails/clamps being installed |
| Panel Installation | ✅ Yes | 5 | Panels being mounted |
| Wiring Photos | ✅ Yes | 5 | DC wiring, AC wiring |
| Inverter Setup | ✅ Yes | 5 | Inverter installation |
| Connection Photos | ✅ Yes | 3 | Net meter, main line connections |
| Final Installation | ✅ Yes | 8 | Complete system view (multiple angles) |
| Generation Meter | ✅ Yes | 3 | Generation meter display |
| Label/Nameplate | ✅ Yes | 2 | System label with details |
| Customer with System | ✅ Yes | 2 | Customer standing with installation |

**Photo Features:**
- Capture from camera
- Gallery selection
- Timestamp auto-recorded
- Preview thumbnails
- Delete/re-take option
- Auto-categorize by section
- Compression applied

#### Installation Checklist Section
| Task | Type | Required |
|------|------|----------|
| Structure mounting completed | Checkbox | ✅ Yes |
| Panel installation completed | Checkbox | ✅ Yes |
| DC wiring completed | Checkbox | ✅ Yes |
| Inverter installation completed | Checkbox | ✅ Yes |
| AC wiring completed | Checkbox | ✅ Yes |
| Earthing completed | Checkbox | ✅ Yes |
| Net meter connection completed | Checkbox | ✅ Yes |
| Generation meter installed | Checkbox | ✅ Yes |
| Labels affixed | Checkbox | ✅ Yes |
| Site cleaned | Checkbox | ✅ Yes |

#### Testing Results Section
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| VOC (Open Circuit Voltage) | Number | ✅ Yes | Volts |
| ISC (Short Circuit Current) | Number | ✅ Yes | Amps |
| VMP (Max Power Voltage) | Number | ✅ Yes | Volts |
| IMP (Max Power Current) | Number | ✅ Yes | Amps |
| Inverter Output Voltage | Number | ✅ Yes | Volts |
| Inverter Output Current | Number | ✅ Yes | Amps |
| Grid Voltage | Number | ✅ Yes | Volts |
| Test Generation Reading | Number | ✅ Yes | kW (measured at time of test) |
| Test Time | DateTime | ✅ Yes | Auto-set to current |
| Test Result | Select | ✅ Yes | Pass / Fail |

#### Commissioning Section
| Field | Type | Required | Options |
|-------|------|----------|---------|
| Commissioning Status | Select | ✅ Yes | Complete, Incomplete, Needs Follow-up |
| Customer Training Given | Boolean | ✅ Yes | Yes / No |
| Warranty Card Handed Over | Boolean | ✅ Yes | Yes / No |
| Operation Manual Given | Boolean | ✅ Yes | Yes / No |
| Emergency Contact Shared | Boolean | ✅ Yes | Yes / No |

#### Customer Sign-off Section
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Customer Name | Text | ✅ Yes | Pre-filled, editable |
| Customer Signature | Signature | ✅ Yes | Digital signature pad |
| Sign-off Date | Date | ✅ Yes | Auto-set to current |
| Customer Rating | Rating | No | 1-5 stars |
| Customer Feedback | Textarea | No | 500 chars |

#### Installation Notes Section
| Field | Type | Required | Max Length |
|-------|------|----------|-------------|
| Installation Notes | Textarea | No | 1000 chars |
| Issues Faced | Textarea | No | 1000 chars |
| Additional Work Required | Textarea | No | 1000 chars |
| Next Visit Required | Boolean | No | Yes / No |
| Next Visit Reason | Text | No | If above is Yes |

#### Installation Form Actions
- **Save as Draft** — Saves locally, syncs when online
- **Submit Installation** — Validates all required fields, submits to server
- **Clear Form** — Clears all fields (with confirmation)
- **Cancel** — Return to job list

**Sync Status Indicator:** Same as Survey Module

---

### 5. Service Tickets (Mobile)

#### Ticket Information Section (Read-Only)
| Field | Type | Notes |
|-------|------|-------|
| Ticket ID | Text | From system |
| Project/Customer | Text | From system |
| Issue Category | Text | From system |
| Priority | Badge | High/Medium/Low |
| Assigned Date | Date | From system |

#### Resolution Section
| Field | Type | Required | Options |
|-------|------|----------|---------|
| Issue Diagnosis | Textarea | ✅ Yes | 1000 chars |
| Resolution Applied | Textarea | ✅ Yes | 1000 chars |
| Parts Replaced | Text | No | List if any |
| Parts Used | Text | No | List if any |
| Resolution Status | Select | ✅ Yes | Resolved, Needs Follow-up, Escalated |
| Follow-up Date | Date | Conditional | If "Needs Follow-up" |

#### Photos Section
| Field | Type | Required | Max Count |
|-------|------|----------|-----------|
| Issue Photos | Image | No | 3 |
| Resolution Photos | Image | ✅ Yes | 5 |
| Parts Replaced Photos | Image | No | 3 |

#### Customer Acknowledgment Section
| Field | Type | Required |
|-------|------|----------|
| Customer Name | Text | ✅ Yes |
| Customer Signature | Signature | ✅ Yes |
| Resolution Date | Date | ✅ Yes |
| Customer Rating | Rating | No |
| Customer Feedback | Textarea | No |

#### Ticket Actions
- **Start Work** — Change status to "In Progress"
- **Save Draft** — Save locally
- **Submit Resolution** — Submit to server
- **Request Support** — Escalate to admin

---

### 6. Inventory (Mobile View Only)

#### Stock View Section
| Field | Type | Notes |
|-------|------|-------|
| Product Name | Text | From system |
| Current Stock | Number | From system |
| Reserved Stock | Number | From system |
| Available Stock | Number | Calculated |
| Location | Text | Warehouse location |

#### Actions
- **Scan QR Code** — Look up component details
- **View Details** — Full product specifications
- **Report Issue** — Report damaged/missing item

---

### 7. Profile & Settings

#### Worker Profile Section
| Field | Type | Notes |
|-------|------|-------|
| Name | Text | From system |
| Employee ID | Text | From system |
| Phone | Text | From system |
| Email | Text | From system |
| Role | Text | From system |

#### Settings Section
| Setting | Type | Options |
|---------|------|---------|
| Notifications | Toggle | On/Off |
| Sound | Toggle | On/Off |
| Vibration | Toggle | On/Off |
| Language | Select | English, Hindi (future) |
| Theme | Select | Light, Dark, Auto |

#### Support Section
| Action | Type |
|---------|------|
| Call Office | Button |
| Email Support | Button |
| View Manual | Button |
| Logout | Button |

---

### 8. Navigation & Map Features

#### Navigation Features
- **Navigate to Site** — Opens Google Maps/Apple Maps with destination
- **Call Customer** — Direct phone call
- **Share Location** — Share worker location with office (future)
- **ETA Update** — Update estimated arrival (future)

---

## 🔄 Cross-Platform Workflows

### Workflow 1: New Customer → Site Survey → Installation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WEB (Sales/Office)                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Create Customer Entry                                                     │
│    - Add name, phone, email, address                                        │
│    - Upload electricity bill, ID proof                                      │
│    - Set lead source (Facebook, referral, website, etc.)                   │
│    - Status: New Lead                                                       │
│                 ↓                                                            │
│ 2. Create Project from Customer                                             │
│    - Set preliminary capacity (from customer's bill)                       │
│    - Assign to worker                                                        │
│    - Schedule site survey date                                              │
│    - Status: Survey Scheduled                                               │
│                 ↓                                                            │
│ 3. Dispatch Survey Job to Mobile App                                        │
│    - Job appears in worker's "Today's Jobs"                                 │
│    - Push notification sent to worker                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                   ↓ (Real-time sync)
┌─────────────────────────────────────────────────────────────────────────────┐
│ MOBILE (Field Worker) - Online First with Sync When Available               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. Receive Survey Assignment                                                 │
│    - App refreshes data (auto on open, or pull-to-refresh)                  │
│    - Notification: New survey assigned                                       │
│    - View job in "My Jobs"                                                   │
│    - Tap to navigate to customer location                                   │
│                 ↓                                                            │
│ 5. Conduct Site Survey                                                      │
│    - Open survey form                                                       │
│    - Capture GPS coordinates (auto if network available)                     │
│    - Take photos (roof, shadow, meter, entrance)                            │
│    - Fill roof details, electrical details, site assessment                 │
│    - Enter recommended system                                               │
│    - Add notes                                                               │
│    - If network available: Real-time save to server                          │
│    - If network NOT available: Save locally → pending sync (🔴 indicator)     │
│                 ↓                                                            │
│ 6. Submit Survey                                                             │
│    - Review captured data                                                   │
│    - Tap "Submit for Verification"                                         │
│    - If online: Immediate sync → Status: Survey Complete → Pending Verification │
│    - If offline: Save locally → Auto-sync when connection available         │
│    - Sync indicator shows: Syncing (🟡) → Synced (🟢)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                   ↓ (Sync completes)
┌─────────────────────────────────────────────────────────────────────────────┐
│ WEB (Admin/Office)                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 7. Review & Verify Survey                                                    │
│    - Review survey photos & data                                            │
│    - Verify GPS location matches customer address                           │
│    - Adjust capacity recommendation if needed                              │
│    - Select system template based on survey                                 │
│    - Approve/Reject survey with notes                                       │
│    - If Approved → Status: Design Pending                                   │
│                 ↓                                                            │
│ 8. Create Quotation                                                         │
│    - Generate from system template                                          │
│    - Or build custom quotation with items                                   │
│    - Calculate pricing + discount + GST                                    │
│    - Status: Quotation Draft                                                │
│                 ↓                                                            │
│ 9. Send Quotation to Customer                                               │
│    - Generate PDF                                                           │
│    - Send via email/WhatsApp                                                │
│    - Status: Quotation Sent                                                 │
│                 ↓                                                            │
│ 10. Customer Acceptance (or Rejection)                                      │
│     - Wait for customer response                                           │
│     - If accepted → Status: Quotation Accepted                               │
│     - If rejected → Status: Quotation Rejected (can follow up)              │
│     - If accepted → Convert to Project → Status: Installation Scheduled     │
│                  ↓                                                           │
│ 11. Reserve Inventory                                                       │
│     - Auto-reserve components from stock                                   │
│     - Generate pick list for warehouse                                     │
│                  ↓                                                           │
│ 12. Schedule Installation                                                   │
│     - Assign worker and date                                                │
│     - Dispatch job to mobile app → Push notification                        │
└─────────────────────────────────────────────────────────────────────────────┘
                   ↓ (Real-time sync)
┌─────────────────────────────────────────────────────────────────────────────┐
│ MOBILE (Field Worker) - Online First with Sync When Available               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 13. Receive Installation Assignment                                          │
│     - App auto-syncs on open (or background)                                  │
│     - Notification: Installation scheduled                                   │
│     - View job details with component list                                  │
│     - Navigate to customer location                                        │
│                  ↓                                                           │
│ 14. Perform Installation                                                    │
│     - Open installation form                                                │
│     - Complete pre-installation checklist                                    │
│     - Scan component QR codes (verifies with server if online)              │
│     - Take progress photos (mounting, wiring, inverter setup)               │
│     - Complete installation checklist                                        │
│     - Enter test readings                                                   │
│     - Get customer digital signature                                        │
│     - If online: Real-time saves to server                                   │
│     - If offline: Saves locally → pending sync (🔴)                          │
│                  ↓                                                           │
│ 15. Submit Installation                                                     │
│     - Tap "Complete Installation"                                          │
│     - If online: Immediate sync → Status: Installation Complete → DISCOM Pending │
│     - If offline: Save locally → Auto-sync when connection returns           │
│     - Stock automatically deducted from inventory when synced                │
│     - Sync indicator: Syncing (🟡) → Synced (🟢)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                   ↓ (Sync completes)
┌─────────────────────────────────────────────────────────────────────────────┐
│ WEB (Admin/Office)                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 16. Prepare DISCOM Application                                               │
│     - Review installation photos                                            │
│     - Gather required documents:                                            │
│       ✓ Installation completion certificate                                 │
│       ✓ System layout diagram                                               │
│       ✓ Component specifications                                            │
│       ✓ Customer electricity bill                                          │
│       ✓ ID proof                                                            │
│       ✓ NOC from landlord (if rented)                                      │
│     - Upload documents to system                                            │
│     - Create DISCOM application record                                       │
│     - Status: Documents Pending                                             │
│                  ↓                                                           │
│ 17. Document Verification                                                    │
│     - Internal verification of all documents                                 │
│     - If complete → Status: Verified                                        │
│     - If incomplete → Request missing documents → Back to Documents Pending │
│                  ↓                                                           │
│ 18. Submit to DISCOM Portal                                                  │
│     - Export application package                                             │
│     - Submit on DISCOM website                                               │
│     - Get application reference number                                      │
│     - Update system with reference number                                    │
│     - Status: Submitted → JE Pending                                         │
└─────────────────────────────────────────────────────────────────────────────┘

[DISCOM Approval Workflow continues in Workflow 2]
```

---

### Workflow 2: DISCOM Approval Process (Web Only)

*(Same as before - DISCOM operations are web-only)*

---

### Workflow 3: Service Request (Web + Mobile)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WEB (Admin/Office OR Customer Portal - Future)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Create Service Ticket                                                    │
│    - Select project/installation                                             │
│    - Enter issue description                                                 │
│    - Select category (warranty, breakdown, performance, other)              │
│    - Set priority (Low, Medium, High, Urgent)                               │
│    - Status: Open                                                           │
│                 ↓                                                            │
│ 2. Assign to Worker                                                         │
│    - Select available worker                                                │
│    - Dispatch to mobile app → Push notification                              │
│    - Status: Assigned                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                   ↓ (Real-time sync)
┌─────────────────────────────────────────────────────────────────────────────┐
│ MOBILE (Field Worker) - Online First with Sync When Available               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Receive Service Ticket                                                   │
│    - App auto-syncs on open                                                  │
│    - View in "My Jobs"                                                       │
│    - Read issue details                                                      │
│    - Navigate to customer location                                         │
│                 ↓                                                            │
│ 4. Resolve Issue                                                             │
│    - Start work → Status: In Progress                                       │
│    - Diagnose problem                                                       │
│    - Perform repairs                                                        │
│    - Take photos of issue & resolution (save locally if offline)             │
│    - Add resolution notes                                                    │
│    - Get customer acknowledgment (signature/rating)                         │
│    - Submit → Immediate sync if online, pending sync if offline             │
│    - Status: Resolved (once synced)                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                   ↓ (Sync completes)
┌─────────────────────────────────────────────────────────────────────────────┐
│ WEB (Admin)                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. Review Resolution                                                         │
│    - Review resolution notes & photos                                      │
│    - Close ticket OR request follow-up                                       │
│    - If closed → Status: Closed                                             │
│    - Update warranty records if parts replaced                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Sync Architecture

### Online Mode (Primary)
- All API calls attempt real-time communication
- Data validates on server before saving
- Immediate feedback to user
- Sync indicator shows green (🟢 Synced)

### Network Unavailable (Graceful Degradation)
- All data saves to local storage (SQLite/Realm)
- Form validation happens locally
- Sync indicator shows red (🔴 Pending)
- User can continue working normally

### Network Restored (Auto-Sync)
- Background service detects connection
- Queued data uploads automatically
- Conflicts resolved (last-write-wins for simple fields)
- Photos upload with progress indication
- Sync indicator transitions: 🔴 → 🟡 → 🟢

### Sync Queue Management
| Data Type | Priority | Retry Logic |
|-----------|----------|-------------|
| New Job Assignments | High | Poll every 30 sec |
| Survey Submissions | High | Exponential backoff, max 1 hr |
| Installation Submissions | High | Exponential backoff, max 1 hr |
| Service Resolutions | Medium | Exponential backoff, max 2 hr |
| Photos | Medium | Upload after text data, retry 3 times |

### Data Caching for Mobile
| Entity | Cache Duration | Reason |
|--------|----------------|---------|
| Worker's Jobs | 1 day | Refresh on pull-to-refresh |
| Customer Info | 7 days | Static mostly |
| System Templates | 30 days | Rarely changes |
| Product Catalog | 7 days | For QR lookup |
| Previous Survey Data | 30 days | Reference for same project |

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- Web authentication & roles
- Web dashboard (existing UI)
- Mobile authentication
- Mobile basic layout & navigation
- Sync infrastructure setup

### Phase 2: Core Workflows (Weeks 5-10)
- Web: Customer CRUD
- Web: Project CRUD
- Mobile: Site Survey Module with all fields
- Web: Survey verification
- Web: Quotations
- Sync mechanism for surveys

### Phase 3: Installation & Inventory (Weeks 11-16)
- Web: Inventory management
- Mobile: Installation Module with all fields
- Web: Stock reservations
- Component QR code scanning
- Sync mechanism for installations

### Phase 4: DISCOM & Service (Weeks 17-20)
- Web: DISCOM application tracking
- Web: Service ticket management
- Mobile: Service ticket resolution
- Sync mechanism for service tickets

### Phase 5: Reporting & Optimization (Weeks 21-24)
- Web: Reports module
- Web: Scheduling & dispatch
- Mobile: Route optimization
- Analytics dashboard
- Push notifications

---

## 📱 Mobile App Technical Specifications

### Platform
- **React Native** or **Flutter** for cross-platform (iOS + Android)
- Shared TypeScript types/interfaces with web app
- Shared API client library
- Code sharing: ~80% between iOS and Android

### Local Storage
- **SQLite** via react-native-sqlite-storage (React Native)
- **Hive** or **Isar** (Flutter) for NoSQL local data
- Encrypted storage for sensitive data
- Maximum local storage: ~500MB (mostly photos)

### Photo Handling
- Max photo size: 2MB per photo (compressed)
- JPEG format, 80% quality
- Local cache for upload queue
- Background upload service

### Push Notifications
- Firebase Cloud Messaging (FCM) for Android
- Apple Push Notification Service (APNs) for iOS
- Notification types:
  - New job assignment
  - Job rescheduled
  - High-priority service tickets
  - Survey approved/rejected
  - Quote acceptance (sales staff)

### Hardware Features Used
| Feature | Usage |
|---------|-------|
| GPS | Auto-capture coordinates, navigation |
| Camera | Site photos, installation photos, QR scanning |
| Biometrics | Quick login (fingerprint/face) |
| Internet | Real-time sync, API calls |

### Network Handling
- Reachability detection
- Auto-retry with exponential backoff
- User-visible sync status
- Manual sync button (for user control)

---

## 🔐 Security Considerations

| Feature | Web | Mobile |
|---------|-----|--------|
| Authentication | NextAuth + JWT | JWT with refresh token |
| Data in Transit | HTTPS | HTTPS |
| Data at Rest | Encrypted DB | Encrypted SQLite |
| Role-Based Access | Middleware | Role-based API calls |
| Audit Logs | ✅ | ✅ (synced) |
| Biometric | N/A | ✅ (local only) |
| Session Timeout | 30 min | 7 days (biometric re-auth) |

---

## 📈 Success Metrics

- **Sync Success Rate** > 99.5%
- **Sync Latency** < 5 seconds (online mode)
- **Offline Recovery** 100% (no data loss)
- **Lead to Survey Time** < 2 days
- **Survey to Quote Time** < 3 days
- **Quote Acceptance Rate** > 40%
- **Installation Completion Rate** > 95%
- **DISCOM Approval Time** < 30 days
- **Field Worker Productivity** +30% (vs paper)
- **Customer Satisfaction** > 4.5/5

---

## 📋 Mobile Form Field Summary

### Site Survey Form: ~45 fields
- Customer Info: 6 fields (read-only)
- GPS Location: 5 fields
- Site Photos: 7 categories
- Roof Details: 9 fields
- Electrical Details: 9 fields
- Site Assessment: 8 fields
- Recommended System: 6 fields
- Notes: 4 fields

### Installation Form: ~50+ fields
- Project Info: 5 fields (read-only)
- Pre-Installation Checklist: 7 fields
- Component Verification: Dynamic (based on components)
- Installation Photos: 10 categories
- Installation Checklist: 10 items
- Testing Results: 9 fields
- Commissioning: 5 fields
- Customer Sign-off: 5 fields
- Installation Notes: 6 fields

### Service Ticket Form: ~12 fields
- Ticket Info: 5 fields (read-only)
- Resolution: 5 fields
- Photos: 3 categories
- Customer Acknowledgment: 4 fields

---

*This plan serves as the blueprint for building the Excellent Solar project management system across web and mobile platforms with an online-first mobile app that gracefully handles offline scenarios.*
