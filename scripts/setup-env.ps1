# Environment Setup Script for Kapda Co. (PowerShell)
# This script helps set up environment variables for development

Write-Host "🚀 Kapda Co. - Environment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env files already exist
if (Test-Path "backend\.env") {
    Write-Host "⚠️  backend\.env already exists. Skipping..." -ForegroundColor Yellow
} else {
    if (Test-Path "backend\env.example") {
        Copy-Item "backend\env.example" "backend\.env"
        Write-Host "✅ Created backend\.env from env.example" -ForegroundColor Green
    } else {
        Write-Host "❌ backend\env.example not found" -ForegroundColor Red
    }
}

if (Test-Path ".env") {
    Write-Host "⚠️  .env already exists. Skipping..." -ForegroundColor Yellow
} else {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "✅ Created .env from env.example" -ForegroundColor Green
    } else {
        Write-Host "❌ env.example not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend\.env and add your MongoDB URI, JWT_SECRET, etc."
Write-Host "2. Edit .env and set VITE_API_BASE_URL if needed"
Write-Host "3. Generate JWT_SECRET: openssl rand -base64 32"
Write-Host "4. Run: cd backend; npm run validate-env"
Write-Host ""

