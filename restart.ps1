Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force .next; npm run dev
