# Sprite Upload Feature Setup

## Overview
Users can now upload custom PNG/JPG sprites for their player characters and enemies!

## Supabase Storage Setup

### 1. Create Storage Bucket

In your Supabase dashboard, create a new storage bucket:

```sql
-- Go to Storage → Create bucket
-- Name: game-sprites
-- Public: YES (sprites need to be accessible by games)
```

Or via SQL:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-sprites', 'game-sprites', true);
```

### 2. Set Storage Policies

Allow authenticated users to upload their own sprites:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload their own sprites"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'game-sprites' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access (so games can load sprites)
CREATE POLICY "Anyone can view sprites"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game-sprites');

-- Allow users to delete their own sprites
CREATE POLICY "Users can delete their own sprites"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'game-sprites' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## How It Works

### User Flow:
1. **Upload** - User uploads PNG/JPG for player/enemy in `/lab` form
2. **Preview** - Thumbnail preview shown with delete option
3. **Build** - Sprites uploaded to Supabase Storage (`game-sprites` bucket)
4. **Generate** - AI receives sprite URLs and generates code to load them
5. **Play** - Game loads sprites from URLs using `urllib` and `pygame`

### Technical Details:

**File Upload:**
- Files stored as: `{user_id}/player-{timestamp}.png`
- Public URLs generated automatically
- Supports PNG, JPG, JPEG formats

**AI Integration:**
- Sprite URLs passed to `buildGameGenerationPrompt()`
- AI generates Python code to fetch and load sprites:
  ```python
  import urllib.request
  import io
  response = urllib.request.urlopen("SPRITE_URL")
  player_img = pygame.image.load(io.BytesIO(response.read()))
  player_img = pygame.transform.scale(player_img, (32, 32))
  ```

**Fallback:**
- If no sprite uploaded → AI draws characters with shapes
- Graceful degradation for better UX

## Features

✅ Custom player sprites  
✅ Custom enemy sprites  
✅ Image preview with thumbnails  
✅ Delete uploaded sprites  
✅ Automatic upload to Supabase  
✅ Public URL generation  
✅ AI code generation with sprite loading  
✅ Fallback to drawn art if no sprites  

## File Locations

- **UI Component:** `landing-page/app/lab/page.tsx` (lines 80-83, 161-183, 558-618)
- **Upload Logic:** `landing-page/app/lab/page.tsx` (lines 273-311)
- **AI Prompt:** `landing-page/lib/game-generator.ts` (lines 14-15, 199-222)

## Testing

1. Go to `/lab`
2. Scroll to "Custom Sprites (Optional)" section
3. Upload a player sprite (PNG/JPG, ~32x32 to 128x128 recommended)
4. Upload an enemy sprite
5. Click "Build & Publish Game"
6. Game should load and display your custom sprites!

## Notes

- Sprites are scaled to 32x32 by default in generated games
- For best results, use transparent PNGs
- Recommended size: 32x32 to 64x64 pixels
- Max file size: 5MB (Supabase default)

