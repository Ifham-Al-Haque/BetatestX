# Operation Panel Revamp — Implementation Guide

## What was implemented (Phase 0–1)

### Unified sidebar: **Operation**
Replaces separate **Driver Management** and **Operation Panel** entries.

| Nav item | Route | Notes |
|----------|--------|--------|
| Fleet Record | `/operation/fleet-records` | Vehicle list; click view → profile |
| Fleet Record profile | `/operation/fleet-records/:id` | Full vehicle hub (details, maintenance, fuel, incidents) |
| Onboarding & Offboarding | `/operation/fleet-lifecycle?tab=onboarding\|offboarding` | Tabbed lifecycle |
| UDrive Fleetio | `/operation/fleetio` | Hub linking to dashboard, maintenance, inspections, calendar |
| Driver & Team Records | `/operation/drivers` | Same as `/drivers` |
| Schedule & Roster | `/operation/roster` | Placeholder; links to drivers & assignment calendar |
| Breakdowns | `/operation/breakdowns` | Existing page (stub data) |

### Legacy URL redirects
Old paths (`/fleet`, `/fleet-onboarding`, `/driver-operations`, etc.) redirect to the new Operation routes.

### RBAC
- New features: `udrive_fleetio`, `fleet_lifecycle`, `operation_roster`, `fleet_dashboard`
- Roles updated: `admin`, `operation_management`, `driver_management`, `data_operator`, `hr_manager`, `manager`, `subscribe_now`
- `canSeePanel('operation')` also returns true if the role still has legacy `driver_management` or `operation_panel` in config

---

## What to do next (Phase 2+)

### Phase 2 — Fleetio shell polish
- [ ] Breadcrumb nav inside Fleetio sub-routes back to `/operation/fleetio`
- [ ] Link maintenance/ticket rows to `/operation/fleet-records/:vehicleId`
- [ ] Embed Fleet Dashboard as default landing (`/operation/fleetio` → auto-redirect to dashboard)

### Phase 3 — Breakdowns & Fleet Record
- [ ] Wire Breakdowns to `fleet_incidents` or new `fleet_breakdowns` table
- [ ] Show onboarding/offboarding history on Fleet Record profile tab
- [ ] Remove duplicate headers on Fleet Lifecycle tabs (optional `embedded` mode)

### Phase 4 — Operation Team Management
- [ ] DB: run **PART D** in `operation_revamp_verify_and_migrate.sql` (`operation_teams`, `operation_team_members`, `operation_shifts`, `operation_roster_entries`)
- [ ] Replace roster placeholder with week/month calendar UI
- [ ] Team management UI (create teams, assign drivers)

### Phase 5 — Fleetio parity (see `docs/FLEETIO_GAP_ANALYSIS.md`)
- [ ] PM scheduling automation
- [ ] Parts inventory, DVIR inspections, cost-per-mile reports

---

## Database script
- `operation_revamp_verify_and_migrate.sql` — verification (PART A), optional fixes (B), vehicle sync (C), roster tables (D)
- `remove_fleet_sample_data.sql` — preview and delete FLEET-/FL- sample rows
- `create_fleet_vehicle_media_schema.sql` — `fleet_image_url` + `fleet_vehicle_documents` + storage bucket `fleet-assets`

### Fleet photo & documents (app)
1. Run `create_fleet_vehicle_media_schema.sql` in Supabase.
2. Create a **public** Storage bucket named `fleet-assets`.
3. Open **Operation → Fleet Record** → vehicle profile → **Fleet & Documents** tab.
4. Run `remove_fleet_sample_data.sql` (preview, then uncomment delete) to drop seed data.

## Key files changed
- `src/components/Sidebar.jsx`
- `src/components/RoleBasedRoute.jsx`
- `src/components/WidgetNavigation.jsx`
- `src/App.js`
- `src/pages/FleetManagement.jsx`
- `src/components/fleet/VehicleDetailsModal.jsx` (`variant="page"`)
- `src/pages/operation/*` (new pages)

## Testing checklist
1. Log in as `operation_management` → sidebar shows **Operation** with all items
2. Open **Fleet Record** → add/view vehicle → profile page loads
3. **Onboarding & Offboarding** → switch tabs
4. **UDrive Fleetio** → open each module card
5. Visit old `/fleet` URL → redirects to Fleet Record
6. Log in as `driver_management` → no lifecycle tab if role lacks `fleet_lifecycle`
