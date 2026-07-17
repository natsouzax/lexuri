-- Seed the LEARN coupon (14-day free Premium trial)
-- ON CONFLICT keeps existing row untouched if already present
INSERT INTO coupon_codes (code, description, grants_plan_key, grants_days, max_uses, active)
VALUES ('LEARN', '2 weeks of Premium', 'pro', 14, NULL, true)
ON CONFLICT (code) DO NOTHING;
