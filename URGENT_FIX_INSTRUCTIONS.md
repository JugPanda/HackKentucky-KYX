# 🚨 URGENT: Fix JavaScript Games Not Working

## The Problem
JavaScript games are being built with Pygbag (Python compiler) and instructions show "Wait for Python loading" even when JavaScript is selected.

## Root Cause
The `language` column doesn't exist in your database yet! The migration hasn't been run.

---

## ✅ **STEP-BY-STEP FIX:**

### Step 1: Run Database Migration (CRITICAL!)

Go to your **Supabase Dashboard** → SQL Editor → New Query

Copy and paste this SQL:

```sql
-- Add language column to games table
ALTER TABLE games
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'python';

-- Add comment
COMMENT ON COLUMN games.language IS 'Programming language used for the game (python, javascript, etc.)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_games_language ON games(language);

-- Set existing games to python (backwards compatibility)
UPDATE games
SET language = 'python'
WHERE language IS NULL OR language = '';
```

Click **Run** (or press F5)

You should see: `Success. No rows returned`

---

### Step 2: Redeploy Fly.io Build Service

In your terminal (from the project root):

```bash
cd build-service
fly deploy
```

Wait for deployment to complete.

---

### Step 3: Wait for Vercel Deploy

Vercel should auto-deploy the fix I just pushed (commit: `f24217f`).

Check: https://vercel.com/your-project/deployments

Wait until the latest deployment shows ✅ **Ready**

---

### Step 4: Delete Your Test Game

The existing game was created **before** the migration, so it doesn't have a language field.

1. Go to your Dashboard
2. Find the test game
3. Click the trash icon to delete it

---

### Step 5: Create a NEW JavaScript Game

1. Go to `/lab` (Create Game)
2. Fill in the form:
   - Hero: "Spaceship"
   - Enemy: "Asteroids"  
   - Goal: "Destroy all asteroids"
   - Genre: **Adventure**
3. **IMPORTANT:** Select **⚡ JavaScript (HTML5 Canvas)**
4. Click "Generate My Game"

---

### Step 6: Verify It Works

✅ **You should see:**
- Instructions say: "Game loads instantly - no wait required! ⚡"
- Badge shows: "HTML5 Game ⚡"
- Console shows **NO** Pygbag/Python loading messages
- Game loads **immediately** (no 10-second wait)
- Black screen should be replaced with the actual game

❌ **If you still see:**
- "Wait for Python loading..."
- Pygbag console messages
- Black screen after loading

→ The migration didn't run correctly OR Vercel hasn't deployed yet.

---

## 🧪 **Testing Checklist**

After completing all steps above:

### Test JavaScript Game:
- [ ] Create new JavaScript game
- [ ] Instructions show "loads instantly" ✅
- [ ] Badge shows "HTML5 Game" ✅  
- [ ] NO Pygbag console messages ✅
- [ ] Game loads in under 2 seconds ✅
- [ ] Can see and play the game ✅

### Test Python Game (for comparison):
- [ ] Create new Python game
- [ ] Instructions show "Wait for Python loading" ✅
- [ ] Shows Pygbag console messages ✅
- [ ] Takes ~10 seconds to load ✅
- [ ] Game works after loading ✅

---

## 🔍 **Troubleshooting**

### "Column already exists" error when running migration
✅ **Good!** This means the migration ran successfully before. Skip Step 1.

### JavaScript game still uses Pygbag
🔴 **Check:**
1. Did Vercel finish deploying? (Check Vercel dashboard)
2. Did you create a **NEW** game after the migration?
3. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)

### Instructions still show Python loading
🔴 **Check:**
1. Inspect the game in browser DevTools
2. Check the `language` attribute on the game object
3. If it's `null` or `undefined`, the migration didn't work

### Game is completely blank/black
🔴 **Check:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. If you see "failed to fetch", the HTML file wasn't uploaded correctly
4. Try rebuilding the game from your dashboard

---

## 📞 **If Still Not Working**

Run this query in Supabase SQL Editor to check the migration:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'games' 
AND column_name = 'language';
```

**Expected result:**
| column_name | data_type | column_default |
|-------------|-----------|----------------|
| language    | text      | 'python'::text |

If you get **"No rows returned"**, the migration didn't run!

---

## ✨ **Expected Behavior After Fix**

### Python Game:
- Compiles with Pygbag (~10 seconds)
- Shows Pygbag console messages
- Loads into WebAssembly
- Instructions mention "Wait for Python loading"

### JavaScript Game:
- NO compilation (uploads HTML directly)
- NO Pygbag messages in console
- Loads INSTANTLY (under 2 seconds)
- Instructions say "loads instantly" with ⚡ badge
- Pure HTML5 Canvas game

---

**Summary:** Run the SQL migration, redeploy Fly.io, wait for Vercel, delete old games, create NEW games. JavaScript games will then work correctly! 🎉

