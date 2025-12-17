-- Add new action types to the enum
ALTER TYPE admin_action_type ADD VALUE IF NOT EXISTS 'id_card_approved';
ALTER TYPE admin_action_type ADD VALUE IF NOT EXISTS 'id_card_rejected';