# Fleetio vs Uhub Fleet Operations – Gap Analysis

This document compares **Fleetio** fleet management capabilities with **Uhub’s current fleet/operations** implementation and states whether the existing structure can be reused to reach a Fleetio-like product.

---

## 1. What Uhub Already Has (Current Structure)

### 1.1 Asset & vehicle management
| Capability | Uhub status | Notes |
|------------|-------------|--------|
| Vehicle CRUD | ✅ | `fleet_vehicles` table, `fleetService` (getVehicles, createVehicle, updateVehicle, deleteVehicle), FleetManagement.jsx |
| Vehicle details (make, model, year, VIN, mileage, license, status) | ✅ | VehicleModal has VIN (17-char), mileage, purchase_date, insurance_expiry, registration_expiry, next_service_date |
| Department/location | ✅ | `department_id`, departments table |
| Driver assignment | ✅ | `assigned_driver_id`, fleet_drivers table, assignDriver(), getDriverAssignments() |
| Vehicle lifecycle (onboard/offboard) | ⚠️ Partial | FleetOnboarding: real API (fleet_onboarding_overview, checklists). FleetOffboarding: **mock data / TODO** only |

### 1.2 Maintenance
| Capability | Uhub status | Notes |
|------------|-------------|--------|
| Maintenance records | ✅ | `fleet_maintenance`, getMaintenanceRecords, create/update/delete, type/status/date filters |
| Maintenance tickets (work orders) | ✅ | `fleet_maintenance_tickets`, full CRUD, status flow, convert to maintenance record on complete |
| Service history per vehicle | ✅ | Via getMaintenanceRecords(vehicleId) |
| Upcoming maintenance alerts | ✅ | getUpcomingMaintenance() (next_service_date within 30 days) |
| Maintenance stats | ✅ | getMaintenanceStatistics(), getTicketStatistics() |
| FleetMaintenanceRecord page | ✅ | Records + tickets tabs, modals, filters |

### 1.3 Fuel & incidents
| Capability | Uhub status | Notes |
|------------|-------------|--------|
| Fuel logs per vehicle | ✅ | `fleet_fuel_logs`, getFuelLogs(vehicleId), createFuelLog() |
| Incidents per vehicle | ✅ | `fleet_incidents`, getIncidents(), createIncident() |

### 1.4 Documents & compliance
| Capability | Uhub status | Notes |
|------------|-------------|--------|
| Insurance/registration expiry | ✅ | On vehicle (insurance_expiry, registration_expiry), getExpiringDocuments() |
| Document expiry alerts | ✅ | Vehicles with expiry within 30 days |

### 1.5 Delivery & operations
| Capability | Uhub status | Notes |
|------------|-------------|--------|
| Delivery orders / checklists | ✅ | deliveryService, fleet_delivery_checklists, fleet_rental_agreements |
| Vehicle inspection (delivery) | ✅ | Checklist item `vehicle_inspection_completed` in delivery flow |
| Delivery tracking/routes | ✅ | DeliveryTracking, DeliveryRoutes, DeliveryManagement pages |

### 1.6 Reporting & dashboards
| Capability | Uhub status | Notes |
|------------|-------------|--------|
| Fleet statistics | ✅ | getFleetStatistics() RPC, FleetManagement stats (total/active/maintenance/out of service, mileage, fuel efficiency) |
| Fleet overview | ✅ | fleet_overview (view) |
| Maintenance stats | ✅ | By status, type, cost, monthly trend |

---

## 2. What’s Missing vs Fleetio

### 2.1 High impact (core Fleetio features)

| Feature | Fleetio | Uhub gap | Can current structure be used? |
|--------|---------|----------|----------------------------------|
| **VIN decoding** | Auto-fill specs & maintenance schedules from VIN | No API or integration | ✅ Yes – add a service that calls NHTSA or similar API; keep storing result in existing `fleet_vehicles` (and related) fields. |
| **Preventive maintenance (PM) scheduling** | Recurring PM schedules, predictive reminders | Only “next service date” on vehicle; no recurring rules or PM templates | ✅ Yes – add tables e.g. `fleet_pm_schedules` / `fleet_pm_templates`, and a job or cron that creates reminders/tickets; reuse existing maintenance/ticket and notification flow. |
| **Electronic vehicle inspections (DVIR-style)** | Formal inspection forms, compliance, “no pencil whipping” | Only a single delivery checklist “vehicle inspection” flag | ⚠️ Partial – add inspection template + results (new table or extend checklist), link to vehicle/driver; reuse fleet + driver data. |
| **Work orders (full lifecycle)** | Plan, schedule, track tasks and costs | Tickets exist and convert to maintenance records; no formal “work order” scheduling board or labor/parts breakdown | ✅ Yes – extend `fleet_maintenance_tickets` (or add work_order table) with scheduling, labor, parts; reuse maintenance records and costs. |
| **Parts & inventory** | Parts tracking, low-stock alerts | None | ❌ New – need `fleet_parts` / `fleet_parts_inventory`, link to maintenance/tickets; new UI and alerts. |
| **Purchase orders** | POs for parts/supplies | None | ❌ New – need PO table and workflow; can reuse departments/users. |
| **Cost per mile / TCO** | From acquisition to disposal | Only basic maintenance cost stats; no lifecycle cost or cost-per-mile | ✅ Yes – add computed fields or views from existing fleet_vehicles, fleet_maintenance, fleet_fuel_logs, purchase_price; add dashboard widgets. |
| **Fleet dashboards (real-time)** | Real-time productivity and exception view | Statistics exist but not “live” exception dashboard (e.g. overdue PM, expiring docs, open tickets) | ✅ Yes – single “Fleet dashboard” page that aggregates getUpcomingMaintenance, getExpiringDocuments, getMaintenanceTickets (open), getFleetStatistics; reuse existing APIs. |
| **Driver assignment calendar** | Calendar view of who drives which vehicle when | Driver assigned to vehicle (current), no calendar view | ✅ Yes – add a calendar view (e.g. by date) over `fleet_drivers` (and any future assignment tables); reuse existing driver/vehicle data. |
| **Vehicle location history** | Location by time/activity | None (no telematics) | ⚠️ Integration – needs GPS/telematics integration; structure can store “last known” or history in a new table if you add an integration later. |

### 2.2 Medium impact

| Feature | Fleetio | Uhub gap | Can current structure be used? |
|--------|---------|----------|----------------------------------|
| **Tire management** | Track tire location and condition per vehicle | None | ❌ New – new tables (e.g. tires, tire_positions), link to vehicle; new UI. |
| **Fuel management (trends, anomalies)** | Fuel trends, inefficiencies, allocation | Only fuel log entry; no analytics or alerts | ✅ Yes – add analytics from `fleet_fuel_logs` (e.g. by vehicle, period); optional alerts on thresholds. |
| **Recall alerts** | Safety recall notifications | None | ⚠️ New – need recall data source (e.g. NHTSA) + table and alerts; VIN required (you have it). |
| **Warranty management (fleet)** | Track warranty, alerts for warranty-covered service | Only on IT Assets; vehicles have dates but no warranty-specific workflow | ✅ Yes – add warranty fields to vehicle (or reuse dates), add “warranty covered” on maintenance/tickets; reuse existing maintenance and notifications. |
| **Vehicle lifecycle / replacement policy** | Replacement policies, cycle planning | No policy or replacement workflow | ✅ Yes – add policy table or rules (e.g. age/mileage), dashboard “candidates for replacement” from existing vehicle + maintenance data. |
| **Fleet offboarding (full)** | Structured offboard process | FleetOffboarding page is **mock/TODO** | ✅ Yes – implement real API and checklist (similar to onboarding); reuse fleet_vehicles status and history. |
| **Contact management** | Vendors, mechanics, etc. | Only employees/drivers | ⚠️ Partial – add contacts/vendors table and link to maintenance (e.g. service_provider); reuse maintenance records. |
| **Custom reporting & automation** | Reports and workflow automations | No report builder or workflow engine | ⚠️ Larger – reporting can start with fixed reports from existing tables; automations need a small workflow/rule engine. |

### 2.3 Integrations & platform

| Feature | Fleetio | Uhub gap | Can current structure be used? |
|--------|---------|----------|----------------------------------|
| **GPS / telematics** | Odometer, DTC, location | None | New integration; structure can store odometer/DTC/location if you add a provider. |
| **Fuel card integration** | Fuel transactions, odometer validation | None | New integration; fuel log could be extended for imported transactions. |
| **Mobile app** | Fleetio Go | Web only | New – PWA or native; can reuse same APIs. |
| **Developer API / webhooks** | Public API, webhooks | Supabase as backend; no dedicated fleet API or webhooks | ✅ Yes – add Edge Functions or small BFF that expose fleet operations and emit webhooks from existing DB events. |

---

## 3. Can the Current Structure Be Used as a Fleetio Alternative?

**Yes.** The current structure is a good base and can be extended toward a Fleetio-like product without a full rewrite.

### 3.1 What to reuse as-is
- **Vehicle management**: `fleet_vehicles`, FleetManagement, VehicleModal (VIN, mileage, dates).
- **Maintenance**: `fleet_maintenance`, `fleet_maintenance_tickets`, FleetMaintenanceRecord, maintenance stats.
- **Fuel & incidents**: `fleet_fuel_logs`, `fleet_incidents`.
- **Drivers**: `fleet_drivers`, assignDriver, getDriverAssignments.
- **Onboarding**: FleetOnboarding, fleet_onboarding_overview, checklists.
- **Delivery**: deliveryService, delivery checklists, vehicle inspection flag.
- **Stats**: getFleetStatistics, getMaintenanceStatistics, getExpiringDocuments, getUpcomingMaintenance.

### 3.2 What to add on top of current structure (recommended order)

1. **Fleet offboarding (real)**  
   Replace mock data in FleetOffboarding with real tables and API (e.g. offboarding records + checklist), similar to onboarding.

2. **Preventive maintenance (PM) scheduling**  
   Add PM templates/schedules and a process that creates reminders or tickets; reuse existing maintenance/ticket and notifications.

3. **Fleet dashboard**  
   One page that combines: overdue/upcoming PM, expiring documents, open tickets, fleet stats; all from existing APIs.

4. **Cost per mile / TCO**  
   Views or computed fields from vehicles + maintenance + fuel + purchase; expose on dashboard and reports.

5. **VIN decoding**  
   One-off or on-vehicle-save call to NHTSA (or similar) and map response into `fleet_vehicles` (and PM if needed).

6. **Driver assignment calendar**  
   Calendar UI over `fleet_drivers` (and assignments); optional “planned” assignments table if needed.

7. **Electronic vehicle inspections (DVIR)**  
   Inspection template + result records linked to vehicle/driver; optional link to maintenance/tickets.

8. **Parts inventory (then POs)**  
   New parts/inventory tables and UI; then PO workflow; link to maintenance/tickets.

9. **Tire management**  
   New tables and UI; link to vehicle.

10. **Integrations**  
    Telematics, fuel cards, etc., when needed; store in new or extended tables and keep using current fleet/maintenance model.

### 3.3 What is genuinely new (not reuse)
- Parts & inventory (tables + UI).
- Purchase orders (tables + workflow).
- Tire management (tables + UI).
- Recall alerts (data source + storage + alerts).
- Optional: workflow/automation engine and report builder (can start simple with fixed reports).

---

## 4. Summary Table

| Fleetio area | Uhub today | Verdict |
|--------------|------------|--------|
| Asset management | Strong (vehicles, drivers, departments) | ✅ Reuse; add lifecycle/PM. |
| Maintenance | Strong (records, tickets, stats) | ✅ Reuse; add PM scheduling, work order detail. |
| Fuel | Basic logs | ✅ Reuse; add analytics/alerts. |
| Inspections | Delivery checklist only | ⚠️ Extend for DVIR-style inspections. |
| Parts & inventory | None | ❌ New. |
| Purchase orders | None | ❌ New. |
| Tire management | None | ❌ New. |
| VIN decoding | VIN stored only | ✅ Add external API. |
| PM scheduling | Next service date only | ✅ Add schedules + reminders. |
| Dashboards & reports | Stats exist | ✅ Add fleet dashboard + TCO/cost-per-mile. |
| Offboarding | Mock | ✅ Implement like onboarding. |
| Integrations (GPS, fuel card) | None | New when needed. |

**Conclusion:** The current Uhub fleet structure (fleet_vehicles, fleet_maintenance, fleet_maintenance_tickets, fleet_fuel_logs, fleet_drivers, fleet_incidents, onboarding, delivery) can be used as the core of a Fleetio alternative. The main missing pieces are: **real offboarding**, **PM scheduling**, **fleet dashboard**, **cost/TCO**, **VIN decoding**, **parts/inventory**, **purchase orders**, and **tire management**. Everything except parts, POs, and tires can be built by extending existing tables and services.
