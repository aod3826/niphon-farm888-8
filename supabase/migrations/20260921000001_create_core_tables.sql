-- ====================================================================
-- MIGRATION 001: Core Farm Structure & Multi-Tenant Foundations
-- System: Niphon Farm AI Veterinary Management System
-- Standard: PRD.md Sections 17-19 (Farm, Barn, Pen, Animals)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Farms (Tenant Isolation)
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    province VARCHAR(100) NOT NULL DEFAULT 'พัทลุง',
    district VARCHAR(100) DEFAULT 'ควนขนุน',
    location TEXT,
    owner_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    capacity_total INT NOT NULL DEFAULT 1500,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'quarantine', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Profiles / Farm Users (RBAC)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'veterinarian')),
    license_number VARCHAR(64), -- Required for licensed veterinarians
    phone VARCHAR(32),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Barns (โรงเรือน)
CREATE TABLE IF NOT EXISTS barns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    barn_code VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(64) NOT NULL CHECK (type IN ('breeding_sow', 'finishing', 'nursery', 'quarantine', 'boar_stud')),
    capacity INT NOT NULL CHECK (capacity > 0),
    current_count INT NOT NULL DEFAULT 0 CHECK (current_count >= 0),
    temperature_c NUMERIC(4, 1) DEFAULT 28.5,
    humidity_pct NUMERIC(4, 1) DEFAULT 72.0,
    ventilation_status VARCHAR(32) DEFAULT 'normal' CHECK (ventilation_status IN ('normal', 'needs_check', 'fault')),
    status VARCHAR(32) NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'alert')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_farm_barn_code UNIQUE (farm_id, barn_code)
);

-- 4. Pens (คอก)
CREATE TABLE IF NOT EXISTS pens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barn_id UUID NOT NULL REFERENCES barns(id) ON DELETE CASCADE,
    pen_code VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    current_count INT NOT NULL DEFAULT 0 CHECK (current_count >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'sick_isolated', 'attention', 'empty')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_barn_pen_code UNIQUE (barn_id, pen_code)
);

-- 5. Animals (สัตว์รายตัว / ฝูงสุกร)
CREATE TABLE IF NOT EXISTS animals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    barn_id UUID NOT NULL REFERENCES barns(id) ON DELETE RESTRICT,
    pen_id UUID NOT NULL REFERENCES pens(id) ON DELETE RESTRICT,
    animal_code VARCHAR(64) NOT NULL,
    rfid_tag VARCHAR(64),
    species VARCHAR(32) NOT NULL DEFAULT 'pig',
    type VARCHAR(32) NOT NULL CHECK (type IN ('sow', 'gilt', 'boar', 'finisher', 'piglet')),
    sex VARCHAR(16) NOT NULL CHECK (sex IN ('female', 'male', 'castrated')),
    breed VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    weight_kg NUMERIC(6, 2),
    parity INT DEFAULT 0 CHECK (parity >= 0),
    farrowing_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'monitoring', 'sick', 'isolated', 'treated', 'culled', 'deceased')),
    health_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_farm_animal_code UNIQUE (farm_id, animal_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_animals_farm_id ON animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_animals_barn_pen ON animals(barn_id, pen_id);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_pens_barn_id ON pens(barn_id);
CREATE INDEX IF NOT EXISTS idx_barns_farm_id ON barns(farm_id);
