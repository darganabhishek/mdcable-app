@echo off
echo Starting M.D. Cable Networks Application...

start cmd /k "cd backend && npm install && node server.js"
start cmd /k "cd frontend && npm install && npm run dev"

echo Backend and Frontend are starting in separate windows.
