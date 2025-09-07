# Backup Instructions

## Current State Backup
To save current progress:

### Option 1: Git Repository
```bash
cd d:\pickle-frontend
git init
git add .
git commit -m "MVP: Complete sideout scoring system"
git branch -M main
```

### Option 2: Manual Backup
1. Copy entire `d:\pickle-frontend` folder
2. Rename to `pickle-frontend-v1.0.0-backup`
3. Store in safe location

### Option 3: Cloud Backup
- Upload to GitHub/GitLab
- Sync with OneDrive/Google Drive
- Create ZIP archive

## Key Files to Preserve
- `/sources/` - All application code
- `/docs/` - Complete documentation
- `/.amazonq/rules/` - Development rules
- `VERSION.md` - Progress tracking

## Restore Instructions
1. Copy backup folder to desired location
2. Open `sources/index.html` in browser
3. Test with auth code: `REF2024`
4. Load demo match: `MATCH-002`