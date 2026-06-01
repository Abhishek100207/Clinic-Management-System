$TaskName = "GAClinicReminders"
$ScriptPath = "c:\Users\Abhishek\Clinic-Management-System\run_reminders.bat"
$Time = "08:00"

# Check if task already exists and delete it to recreate
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task."
}

# Create a new scheduled task trigger
$Action = New-ScheduledTaskAction -Execute $ScriptPath
$Trigger = New-ScheduledTaskTrigger -Daily -At $Time
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

# Register the scheduled task
Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName $TaskName -Settings $Settings -Description "Sends automated email reminders for GA Clinic appointments."

Write-Host "Successfully registered scheduled task '$TaskName' to run daily at $Time."
