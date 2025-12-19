-- Update existing settings
UPDATE affiliate_settings 
SET 
  base_commission_rate = 5.0,
  level1_rate = 50.0,  -- 50% от комиссии TravelHub
  level2_rate = 20.0,  -- 20% от комиссии TravelHub
  level3_rate = 10.0   -- 10% от комиссии TravelHub
WHERE id = 'default';
