-- Add unique constraint for filename per user
-- This ensures each user can only have one upload with a specific filename
ALTER TABLE uploads ADD CONSTRAINT uploads_user_filename_unique UNIQUE (user_id, filename);
