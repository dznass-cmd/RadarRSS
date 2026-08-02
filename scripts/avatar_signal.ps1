param(
    [string]$mood = "idle",
    [string]$speech = "",
    [int]$duration = 200
)

$stateFile = "C:\Users\Dznas\Documents\Default Project\avatar_state.json"

$validMoods = @("idle", "happy", "sad", "thinking", "working", "error", "celebrating", "dance", "typing", "sleepy", "wave")

if ($validMoods -notcontains $mood) {
    Write-Error "Mood inválido. Use um desses: $($validMoods -join ', ')"
    exit 1
}

$state = @{
    mood = $mood
    speech = $speech
    duration = $duration
    timestamp = (Get-Date -Format "HH:mm:ss")
}

$state | ConvertTo-Json | Set-Content $stateFile -Encoding UTF8
Write-Output "Avatar -> $mood`:$speech"
