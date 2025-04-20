
# Product Requirements Document (PRD)

**Product Name**: Annamrita POS  
**Author**: Arindam Dawn  
**Stakeholders**: ISKCON Asansol Event Team, Volunteers, Kitchen Team, Donors  
**Date**: April 20, 2025  
**Version**: 1.2

---

## Overview

Annamrita POS is a web-based Point-of-Sale system built for the ISKCON Asansol Rath Yatra Festival restaurant. It enables volunteers to take orders quickly, print thermal bills using the `react-thermal-printer` library, update menus daily, collect basic customer data like phone numbers, and generate sales reports — all optimized for high footfall and low-connectivity environments.

---

## Goals

- Streamline order and billing processes during Rath Yatra
- Allow quick volunteer training and usability
- Support thermal printer billing with customizable templates
- Enable dynamic menu changes on a daily basis
- Collect optional customer data (e.g., phone number) respectfully
- Offer real-time and downloadable reports
- Work seamlessly even with weak/no internet

---

## Non-Goals

- Inventory or stock-level tracking
- Online delivery or external integrations
- Payment gateway integration (for now)

---

## Features

### 1. Menu Management
- Admin interface to add/edit menu items
- Daily price updates
- Toggle item availability
- Assign short names for compact bill printing

### 2. Order Management
- POS-style touchscreen interface
- Fast item selection and quantity adjustments
- Track order status: Pending → Preparing → Ready → Completed
- Order ID generation
- Collect optional customer phone number with clear consent
- Offline-first architecture

### 3. Billing
- Generate clean, printer-optimized thermal bills
- Use [`react-thermal-printer`](https://github.com/seokju-na/react-thermal-printer) for ESC/POS thermal printing
- Show itemized list, subtotal, and total
- Include order ID, date, time, and optional customer phone
- Customizable receipt layout with:
  - Header/Footer text
  - Logo
  - Optional QR codes (donations, feedback)
- Real-time preview of receipt before printing
- Print via `react-thermal-printer` using WebUSB or Bluetooth (compatible printers)

### 4. Reports
- Daily sales and order summary
- Top-selling items
- Role-based data access
- Export to CSV or Excel

### 5. Authentication and Roles
- Admin: Full access (menu, reports, users)
- Volunteer: Take orders and print bills
- Kitchen Staff: View orders and mark preparation status

---

## User Stories

### As a Volunteer...
- I want to take orders fast and print a bill with a single tap
- I want to optionally enter a phone number for updates
- I want to see current orders and know which are pending

### As an Admin...
- I want to update the menu every morning without redeploying
- I want to customize the receipt layout and preview it before finalizing
- I want to track how much prasad was served and what sold most

### As a Kitchen Staff...
- I want to view all incoming orders and their status
- I want to mark items as prepared and notify volunteers

---

## User Flow

Admin logs in → Updates Menu → Volunteers login → Takes Orders (+ Optional Phone) → Prints Bill  
          ↓             ↓  
   Orders show in Kitchen UI → Kitchen prepares & updates status

---

## Tech Stack

| Layer        | Tech                                           |
|--------------|------------------------------------------------|
| Frontend     | Vite + React + React Router, Tailwind CSS, TypeScript, PWA |
| State Mgmt   | Zustand                                        |
| Backend      | **Appwrite** (Auth, Database, Functions, Storage) |
| DB           | Appwrite Database                             |
| Auth         | Appwrite Auth (Email/Password or Magic Link)  |
| Printing     | `react-thermal-printer` for thermal ESC/POS   |
| Offline Mode | Service Workers + IndexedDB                   |

---

## Data Models (Appwrite Collections)

### 1. `MenuItems`

| Field       | Type    |
|-------------|---------|
| name        | string  |
| category    | string  |
| price       | number  |
| available   | boolean |
| shortName   | string  |

### 2. `Orders`

| Field       | Type                                   |
|-------------|----------------------------------------|
| items       | array of `{ itemId, quantity, price }` |
| status      | enum: Pending, Preparing, Ready, Completed |
| total       | number                                 |
| phoneNumber | string (optional)                      |
| createdBy   | user ID                                |
| createdAt   | datetime                               |

### 3. `Users`

| Field       | Type                        |
|-------------|-----------------------------|
| name        | string                      |
| role        | enum: admin, volunteer, kitchen |

---

## Print Format

- Receipt width: 58mm or 80mm thermal roll
- Configurable sections:
  - **Header**: Logo, Title (e.g., "ISKCON Asansol")
  - **Order Details**: Order ID, date/time
  - **Items**: Qty x Name - Price
  - **Footer**: Optional QR code for donation, thank you message
- Include optional customer phone number
- **Real-time Preview UI** in Admin panel using simulated render of `react-thermal-printer` output

---

## Offline Strategy

- Menu cached locally using IndexedDB
- Orders queued in IndexedDB when offline
- Background sync when reconnected
- Service Worker handles fallback for core screens

---

## Milestones

| Phase   | Description                                 | Timeline |
|---------|---------------------------------------------|----------|
| Phase 1 | Menu + Order UI + Print Basic Bills         | 1 week   |
| Phase 2 | Kitchen Queue + Order Status                | 2-3 days |
| Phase 3 | Reports Dashboard + Export CSV              | 2 days   |
| Phase 4 | Receipt Customization + Preview Tool        | 2 days   |
| Phase 5 | PWA Support + Offline Sync                  | 2 days   |
| Phase 6 | Printer Integration using react-thermal-printer | 2 days   |

---

## Success Metrics

- < 1 min to serve each order  
- 100% successful print rate on supported printers  
- Menu updates reflected without redeploy  
- Zero downtime during peak hours  
- 40% of customers voluntarily provide phone numbers  

---

## Risks & Mitigation

| Risk                        | Mitigation                                      |
|-----------------------------|-------------------------------------------------|
| Weak festival network       | PWA + IndexedDB for local orders               |
| Thermal printer issues      | Use `react-thermal-printer` with fallback UI preview |
| Privacy with phone numbers  | Optional input + clear usage disclaimer        |
| Menu change complexity      | Use Appwrite dashboard or Admin UI with import/export |
