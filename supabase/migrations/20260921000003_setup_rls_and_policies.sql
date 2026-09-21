-- ====================================================================
-- MIGRATION 003: Row Level Security (RLS) & Role-Based Access Control
-- System: Niphon Farm AI Veterinary Management System
-- Standard: PRD.md Section 43, 66 (RLS, Multi-tenant, Vet Authorization)
-- ====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pens ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinary_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_events ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions for claims & auth
CREATE OR REPLACE FUNCTION current_user_farm_id()
RETURNS UUID AS $$
  SELECT farm_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Farms Policies
CREATE POLICY "Farms viewable by members" ON farms
    FOR SELECT USING (id = current_user_farm_id());

-- 4. Barns Policies
CREATE POLICY "Barns viewable by farm members" ON barns
    FOR SELECT USING (farm_id = current_user_farm_id());

CREATE POLICY "Barns manageable by manager and owner" ON barns
    FOR ALL USING (
        farm_id = current_user_farm_id() AND
        current_user_role() IN ('owner', 'manager')
    );

-- 5. Animals Policies
CREATE POLICY "Animals viewable by farm members" ON animals
    FOR SELECT USING (farm_id = current_user_farm_id());

CREATE POLICY "Animals modifiable by staff, manager, owner, vet" ON animals
    FOR ALL USING (farm_id = current_user_farm_id());

-- 6. Health Cases Policies
CREATE POLICY "Health cases viewable by farm members" ON health_cases
    FOR SELECT USING (farm_id = current_user_farm_id());

CREATE POLICY "Health cases insertable by any farm member" ON health_cases
    FOR INSERT WITH CHECK (farm_id = current_user_farm_id());

CREATE POLICY "Health cases updatable by farm staff and vet" ON health_cases
    FOR UPDATE USING (farm_id = current_user_farm_id());

-- 7. Veterinary Reviews Policies (Strictly restricted to licensed veterinarians)
CREATE POLICY "Vet reviews viewable by farm members" ON veterinary_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM health_cases 
            WHERE health_cases.id = veterinary_reviews.case_id 
            AND health_cases.farm_id = current_user_farm_id()
        )
    );

CREATE POLICY "Vet reviews insertable ONLY by licensed veterinarians" ON veterinary_reviews
    FOR INSERT WITH CHECK (
        current_user_role() = 'veterinarian'
    );

-- 8. Farm Tasks Policies
CREATE POLICY "Tasks viewable by farm members" ON farm_tasks
    FOR SELECT USING (farm_id = current_user_farm_id());

CREATE POLICY "Tasks modifiable by farm members" ON farm_tasks
    FOR ALL USING (farm_id = current_user_farm_id());

-- 9. Treatment Records Policies
CREATE POLICY "Treatments viewable by farm members" ON treatment_records
    FOR SELECT USING (farm_id = current_user_farm_id());

CREATE POLICY "Treatments prescribed ONLY by veterinarian" ON treatment_records
    FOR INSERT WITH CHECK (
        current_user_role() = 'veterinarian'
    );

CREATE POLICY "Treatment followups updateable by staff and vet" ON treatment_records
    FOR UPDATE USING (farm_id = current_user_farm_id());

-- 10. AI Audit Events (Read-only to users, insertable by server)
CREATE POLICY "Audit events viewable by owner, manager, vet" ON ai_audit_events
    FOR SELECT USING (
        farm_id = current_user_farm_id() AND
        current_user_role() IN ('owner', 'manager', 'veterinarian')
    );
