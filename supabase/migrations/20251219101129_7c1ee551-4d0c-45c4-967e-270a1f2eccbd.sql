-- Update storage bucket to allow audio/webm and audio/ogg mime types
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'
]::text[]
WHERE id = 'chat-media';