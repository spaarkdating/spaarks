-- Add soft delete columns to messages table
ALTER TABLE public.messages 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL,
ADD COLUMN deleted_for_everyone boolean DEFAULT false,
ADD COLUMN deleted_by uuid DEFAULT NULL;

-- Add policy to allow users to update their own messages for deletion
-- (Already exists: "Users can update own sent messages")

-- Create index for faster queries on non-deleted messages
CREATE INDEX idx_messages_deleted_at ON public.messages (deleted_at) WHERE deleted_at IS NULL;