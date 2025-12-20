-- Fix incorrect is_match values: set is_match to false for all 'pass' actions
UPDATE matches SET is_match = false WHERE action = 'pass' AND is_match = true;