# PowerShell script to get your current IP address for MongoDB Atlas whitelisting

Write-Host "`n🌐 Getting your current IP address...`n" -ForegroundColor Cyan

try {
    $ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
    Write-Host "✅ Your current IP address is: " -NoNewline -ForegroundColor Green
    Write-Host "$ip" -ForegroundColor Yellow
    Write-Host "`n📋 Copy this IP address and add it to MongoDB Atlas Network Access`n" -ForegroundColor Cyan
    
    Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
    Write-Host "   MongoDB Atlas: https://cloud.mongodb.com/" -ForegroundColor White
    Write-Host "   Network Access: https://cloud.mongodb.com/v2#/security/network/whitelist" -ForegroundColor White
    Write-Host "`n💡 Tip: For development, you can use 'Allow Access from Anywhere' (0.0.0.0/0)`n" -ForegroundColor Yellow
    
    # Copy to clipboard
    $ip | Set-Clipboard
    Write-Host "📋 IP address copied to clipboard!`n" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to get IP address. Error: $_" -ForegroundColor Red
    Write-Host "`n💡 You can manually check your IP at: https://www.whatismyip.com/`n" -ForegroundColor Yellow
}

