# deploy_fix.ps1
git checkout main
git pull origin main
git merge fix-deployment
git push origin main
Write-Host "Deployment forced."
