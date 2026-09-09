CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('FARMER', 'OFFICER', 'ADMIN');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'FARMER',
  phone TEXT,
  address TEXT,
  division TEXT,
  district TEXT,
  upazila TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  division TEXT,
  district TEXT,
  upazila TEXT,
  union_name TEXT,
  total_land_bigha NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  area_bigha NUMERIC(10, 2) NOT NULL DEFAULT 0,
  soil_type TEXT,
  irrigation_source TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID REFERENCES lands(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variety TEXT,
  season TEXT,
  planting_date DATE,
  expected_harvest_date DATE,
  status TEXT NOT NULL DEFAULT 'GROWING',
  care_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soil_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID REFERENCES lands(id) ON DELETE CASCADE,
  tested_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ph NUMERIC(4, 2),
  nitrogen NUMERIC(6, 2),
  phosphorus NUMERIC(6, 2),
  potassium NUMERIC(6, 2),
  organic_matter NUMERIC(6, 2),
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weather_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division TEXT NOT NULL,
  district TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  condition TEXT,
  temperature_c NUMERIC(5, 1),
  humidity INTEGER,
  wind_kph NUMERIC(6, 2),
  rainfall_mm NUMERIC(6, 2),
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disease_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  land_id UUID REFERENCES lands(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  disease_name TEXT NOT NULL,
  pest_name TEXT,
  severity TEXT NOT NULL DEFAULT 'LOW',
  symptoms TEXT,
  treatment TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  district TEXT,
  unit TEXT NOT NULL DEFAULT 'kg',
  price NUMERIC(12, 2) NOT NULL,
  price_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crop_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  land_id UUID REFERENCES lands(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  area_bigha NUMERIC(10, 2),
  total_quantity_kg NUMERIC(12, 2) NOT NULL,
  yield_per_bigha_kg NUMERIC(12, 2),
  cost_taka NUMERIC(14, 2) NOT NULL DEFAULT 0,
  revenue_taka NUMERIC(14, 2) NOT NULL DEFAULT 0,
  harvested_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disease images (multiple photos per disease log for AI detection)
CREATE TABLE IF NOT EXISTS disease_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_log_id UUID NOT NULL REFERENCES disease_logs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ai_detected_disease TEXT,
  ai_confidence NUMERIC(5, 2),
  ai_model_version TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI-generated crop recommendations per land
CREATE TABLE IF NOT EXISTS crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  recommended_crop TEXT NOT NULL,
  confidence NUMERIC(5, 2),
  reason TEXT,
  season TEXT,
  soil_ph NUMERIC(4, 2),
  soil_nitrogen NUMERIC(6, 2),
  soil_phosphorus NUMERIC(6, 2),
  soil_potassium NUMERIC(6, 2),
  weather_condition TEXT,
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI/ML prediction log (stores all model predictions for audit)
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  prediction JSONB NOT NULL,
  confidence NUMERIC(5, 2),
  model_version TEXT,
  input_features JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historical training data for ML models
CREATE TABLE IF NOT EXISTS yield_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  variety TEXT,
  season TEXT,
  land_id UUID REFERENCES lands(id) ON DELETE SET NULL,
  division TEXT,
  district TEXT,
  area_bigha NUMERIC(10, 2),
  actual_yield_kg NUMERIC(12, 2) NOT NULL,
  yield_per_bigha_kg NUMERIC(12, 2),
  soil_ph NUMERIC(4, 2),
  soil_nitrogen NUMERIC(6, 2),
  soil_phosphorus NUMERIC(6, 2),
  soil_potassium NUMERIC(6, 2),
  soil_organic_matter NUMERIC(6, 2),
  avg_temperature_c NUMERIC(5, 1),
  total_rainfall_mm NUMERIC(8, 2),
  avg_humidity INTEGER,
  cost_taka NUMERIC(14, 2),
  revenue_taka NUMERIC(14, 2),
  planting_date DATE,
  harvest_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disease training data for image classification
CREATE TABLE IF NOT EXISTS disease_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  disease_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  verified_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_lands_farmer_id ON lands(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crops_land_id ON crops(land_id);
CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_soil_land_id ON soil_tests(land_id);
CREATE INDEX IF NOT EXISTS idx_weather_division ON weather_records(division);
CREATE INDEX IF NOT EXISTS idx_disease_crop_id ON disease_logs(crop_id);
CREATE INDEX IF NOT EXISTS idx_disease_farmer_id ON disease_logs(farmer_id);
CREATE INDEX IF NOT EXISTS idx_market_crop ON market_prices(crop_name);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_production_farmer_id ON crop_production(farmer_id);
CREATE INDEX IF NOT EXISTS idx_disease_images_log_id ON disease_images(disease_log_id);
CREATE INDEX IF NOT EXISTS idx_crop_rec_land_id ON crop_recommendations(land_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_model ON ai_predictions(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_entity ON ai_predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_yield_training_crop ON yield_training_data(crop_name);
CREATE INDEX IF NOT EXISTS idx_disease_training_crop ON disease_training_data(crop_name, disease_name);
