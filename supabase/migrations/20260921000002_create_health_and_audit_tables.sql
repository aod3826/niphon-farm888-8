-- ====================================================================
-- MIGRATION 002: Clinical Health Cases, Tasks, Treatments & AI Audit
-- System: Niphon Farm AI Veterinary Management System
-- Standard: PRD.md Sections 6-16, 23-25, 31-33, 43, 59-63
-- ====================================================================

-- 6. Health Cases (เคสแจ้งอาการป่วย - Immutability of origin)
CREATE TABLE IF NOT EXISTS health_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    case_number VARCHAR(64) UNIQUE NOT NULL,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    barn_id UUID NOT NULL REFERENCES barns(id),
    pen_id UUID NOT NULL REFERENCES pens(id),
    affected_count INT NOT NULL DEFAULT 1 CHECK (affected_count >= 1),
    reported_by UUID NOT NULL REFERENCES profiles(id),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    chief_complaint TEXT NOT NULL,
    symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    temperature_c NUMERIC(4, 1),
    respiratory_rate INT,
    feed_intake_status VARCHAR(32) NOT NULL DEFAULT 'normal' CHECK (feed_intake_status IN ('normal', 'reduced_slight', 'reduced_heavy', 'none')),
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    triage_level VARCHAR(16) NOT NULL DEFAULT 'YELLOW' CHECK (triage_level IN ('GREEN', 'YELLOW', 'ORANGE', 'RED')),
    status VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triage_completed', 'in_progress', 'vet_review', 'resolved', 'archived')),
    ai_triage JSONB,
    interview_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Veterinary Clinical Reviews (การตรวจรับรองโดยสัตวแพทย์ผู้มีใบอนุญาต)
CREATE TABLE IF NOT EXISTS veterinary_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES health_cases(id) ON DELETE RESTRICT,
    reviewed_by UUID NOT NULL REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_status VARCHAR(32) NOT NULL CHECK (review_status IN ('approved', 'modified', 'rejected', 'more_data_requested')),
    clinical_notes TEXT NOT NULL,
    confirmed_diagnosis TEXT NOT NULL,
    ai_feedback_diff JSONB, -- บันทึกส่วนที่สัตวแพทย์ปรับแก้จากที่ AI แนะนำ
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Farm Tasks (งานปฏิบัติการฟาร์ม)
CREATE TABLE IF NOT EXISTS farm_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    case_id UUID REFERENCES health_cases(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(16) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(64) NOT NULL CHECK (category IN ('clinical_check', 'treatment', 'quarantine', 'biosecurity', 'sanitation', 'vaccination')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_role VARCHAR(32) NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Treatment Records & Drug Withdrawal Tracking (การให้ยาและระยะหยุดยา)
CREATE TABLE IF NOT EXISTS treatment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES health_cases(id) ON DELETE RESTRICT,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    treatment_name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(64) NOT NULL CHECK (route IN ('IM', 'SC', 'oral', 'water', 'feed', 'topical')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    withdrawal_meat_days INT NOT NULL DEFAULT 0 CHECK (withdrawal_meat_days >= 0),
    withdrawal_clear_date DATE NOT NULL,
    prescribed_by UUID NOT NULL REFERENCES profiles(id), -- ต้องเป็นสัตวแพทย์
    administered_by UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),
    followups JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Knowledge Documents & Farm Protocols (มาตรฐานการปฏิบัติงาน SOP)
CREATE TABLE IF NOT EXISTS farm_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    authority_source VARCHAR(100) DEFAULT 'WOAH / กรมปศุสัตว์',
    version VARCHAR(32) DEFAULT '1.0',
    approved_by VARCHAR(100) DEFAULT 'น.สพ. ประจำฟาร์ม',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AI Audit Events (ประวัติการตัดสินใจและการทำงานของ AI ป้องกันการดัดแปลง)
CREATE TABLE IF NOT EXISTS ai_audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    case_id UUID REFERENCES health_cases(id) ON DELETE SET NULL,
    agent_name VARCHAR(64) NOT NULL,
    model_name VARCHAR(64) NOT NULL,
    prompt_version VARCHAR(32) NOT NULL,
    input_payload JSONB NOT NULL,
    context_used JSONB NOT NULL,
    raw_output JSONB NOT NULL,
    validated_output JSONB NOT NULL,
    safety_check_passed BOOLEAN NOT NULL DEFAULT true,
    safety_notes TEXT[],
    latency_ms INT NOT NULL,
    token_usage JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_cases_farm_status ON health_cases(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_triage_level ON health_cases(triage_level);
CREATE INDEX IF NOT EXISTS idx_tasks_farm_status ON farm_tasks(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_treatments_case_id ON treatment_records(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_case_id ON ai_audit_events(case_id);
