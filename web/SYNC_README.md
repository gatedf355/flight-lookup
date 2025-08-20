# 🚀 Localhost to Live Domain Sync

This setup automatically syncs your localhost development changes to the live `skynerd.io` domain.

## 🔄 Quick Sync Commands

### Manual Sync (One-time)
```bash
npm run sync
```

### Manual Sync (with script)
```bash
./deploy-sync.sh
```

## 🛠️ How It Works

1. **Local Development**: Make changes in your code
2. **Build**: Run `npm run build` to create production build
3. **Deploy**: Run `npm run sync` to deploy to Cloudflare Pages
4. **Live**: Changes appear on `skynerd.io` in 2-5 minutes

## 📁 Files Changed

- `.github/workflows/deploy.yml` - GitHub Actions auto-deploy
- `deploy-sync.sh` - Manual deployment script
- `package.json` - Added `sync` script
- `sync-dev.sh` - Development sync script

## 🚨 Important Notes

- **Build First**: Always run `npm run build` before syncing
- **Check Status**: Monitor deployment at Cloudflare Dashboard
- **API Changes**: Backend API changes need separate deployment
- **File Size**: Cloudflare Pages has 25MB file limit

## 🔧 Troubleshooting

If sync fails:
1. Check file sizes (remove `.next` folder)
2. Verify Cloudflare credentials
3. Check build output for errors
4. Try manual deployment with `./deploy-sync.sh`

## 📱 Live Domain

Your changes will appear at: **https://skynerd.io**
