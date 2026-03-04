# Supabase migrations

Run the SQL files in the Supabase SQL Editor (Dashboard → SQL Editor) if you need the tables.

- **20250303_fleet_offboarding_pm.sql** – Creates:
  - `fleet_offboarding_records` – offboarding process per vehicle
  - `fleet_offboarding_checklist_items` – checklist items per record
  - `fleet_pm_templates` – PM templates (e.g. Oil Change every 5000 km)
  - `fleet_pm_schedules` – vehicle × template with next due date/mileage

Required for:
- Fleet Offboarding page (real data)
- Fleet Dashboard “PM Due Soon”
- PM scheduling (fleetPmService)
