-- Fix for the calculate_onboarding_progress function parameter name issue
-- Run this if you encountered the error: "cannot change name of input parameter"

-- Drop the existing function with any parameter name variations
DROP FUNCTION IF EXISTS calculate_onboarding_progress(uuid);
DROP FUNCTION IF EXISTS calculate_onboarding_progress(record_id uuid);
DROP FUNCTION IF EXISTS calculate_onboarding_progress(vehicle_uuid uuid);

-- Recreate the function with the correct parameter name
CREATE OR REPLACE FUNCTION calculate_onboarding_progress(vehicle_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_items INTEGER := 7; -- Total checklist items
    completed_items INTEGER := 0;
    progress_percentage INTEGER;
BEGIN
    SELECT 
        (CASE WHEN car_registration THEN 1 ELSE 0 END) +
        (CASE WHEN passing_certificate THEN 1 ELSE 0 END) +
        (CASE WHEN iot_device_installation THEN 1 ELSE 0 END) +
        (CASE WHEN device_configuration THEN 1 ELSE 0 END) +
        (CASE WHEN branding_completed THEN 1 ELSE 0 END) +
        (CASE WHEN salik_tag_installed THEN 1 ELSE 0 END) +
        (CASE WHEN vip_chip_installed THEN 1 ELSE 0 END)
    INTO completed_items
    FROM fleet_onboarding_checklists
    WHERE vehicle_id = vehicle_uuid;
    
    IF completed_items IS NULL THEN
        completed_items := 0;
    END IF;
    
    progress_percentage := ROUND((completed_items::DECIMAL / total_items::DECIMAL) * 100);
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger function as well (in case it needs to be updated)
CREATE OR REPLACE FUNCTION update_vehicle_onboarding_status()
RETURNS TRIGGER AS $$
DECLARE
    progress_pct INTEGER;
    new_status VARCHAR(20);
BEGIN
    -- Calculate progress percentage
    progress_pct := calculate_onboarding_progress(NEW.vehicle_id);
    
    -- Determine status based on progress
    IF progress_pct = 0 THEN
        new_status := 'Not Started';
    ELSIF progress_pct = 100 THEN
        new_status := 'Completed';
    ELSE
        new_status := 'In Progress';
    END IF;
    
    -- Update the vehicle record
    UPDATE fleet_vehicles_enhanced 
    SET 
        onboarding_progress = progress_pct,
        onboarding_status = new_status,
        status = CASE WHEN progress_pct = 100 THEN 'Active' ELSE status END,
        updated_at = NOW()
    WHERE id = NEW.vehicle_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_onboarding_progress ON fleet_onboarding_checklists;

CREATE TRIGGER trigger_update_onboarding_progress
    AFTER INSERT OR UPDATE ON fleet_onboarding_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_onboarding_status();

-- Test the function (optional - uncomment to test)
-- SELECT calculate_onboarding_progress('00000000-0000-0000-0000-000000000000'::UUID);

COMMENT ON FUNCTION calculate_onboarding_progress(UUID) IS 'Calculates the onboarding progress percentage for a vehicle based on completed checklist items';
