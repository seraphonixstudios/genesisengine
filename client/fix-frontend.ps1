# Fix Script - Run this in PowerShell

$srcPath = "C:\Users\User\Desktop\capital\AI Image Generator\client\src"

# Remove old .js files
Remove-Item -Path "$srcPath\contexts\GenerationContext.js" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$srcPath\components\*.js" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$srcPath\services\*.js" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$srcPath\*.js" -Force -ErrorAction SilentlyContinue

# Remove old folders
Remove-Item -Path "$srcPath\contexts" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$srcPath\services" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cleanup complete!"
