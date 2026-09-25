# Restart local Next.js — do NOT set OPENAI_API_KEY here (it overrides .env.local)
Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
npm run dev

# Google OAuth redirect (example): https://<YOUR_DOMAIN>/api/auth/callback/google
# Set NEXT_PUBLIC_APP_URL / AUTH_URL in Vercel to match that domain.
