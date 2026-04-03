SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'appointments'
  AND column_name IN (
    'current_stress_level', 
    'sleep_quality', 
    'digestive_health', 
    'medications_supplements'
  );