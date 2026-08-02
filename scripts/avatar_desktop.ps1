Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$stateFile = "C:\Users\Dznas\Documents\Default Project\avatar_state.json"
$script:isDragging = $false
$script:offsetX = 0
$script:offsetY = 0
$script:blinkCounter = 0
$script:isBlinking = $false
$script:frame = 0
$script:mood = "idle"
$script:speechText = ""
$script:speechTimer = 0
$script:moodTimer = 0
$script:bounceY = 0
$script:earWiggle = 0

$form = New-Object System.Windows.Forms.Form
$form.Text = "Avatar"
$form.Size = New-Object System.Drawing.Size(220, 240)
$form.StartPosition = "Manual"
$form.Location = New-Object System.Drawing.Point(
    ([System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Width - 220),
    ([System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Height - 260)
)
$form.FormBorderStyle = "None"
$form.BackColor = "Magenta"
$form.TransparencyKey = "Magenta"
$form.TopMost = $true
$form.ShowInTaskbar = $false

$form.Add_MouseDown({
    if ($_.Button -eq "Left") {
        $script:isDragging = $true
        $script:offsetX = $_.X
        $script:offsetY = $_.Y
    } elseif ($_.Button -eq "Right") {
        $cm = New-Object System.Windows.Forms.ContextMenuStrip
        $cm.Items.Add("Feliz").Add_Click({ $script:mood = "happy"; SetMood "happy" })
        $cm.Items.Add("Triste").Add_Click({ $script:mood = "sad"; SetMood "sad" })
        $cm.Items.Add("Pensando").Add_Click({ $script:mood = "thinking"; SetMood "thinking" })
        $cm.Items.Add("Trabalhando").Add_Click({ $script:mood = "working"; SetMood "working" })
        $cm.Items.Add("Dançando").Add_Click({ $script:mood = "dance"; SetMood "dance" })
        $cm.Items.Add("-")
        $cm.Items.Add("Fechar").Add_Click({ $form.Close() })
        $cm.Show($form, $_.Location)
    }
})

$form.Add_MouseMove({
    if ($script:isDragging) {
        $x = $form.Location.X + ($_.X - $script:offsetX)
        $y = $form.Location.Y + ($_.Y - $script:offsetY)
        $form.Location = New-Object System.Drawing.Point($x, $y)
    }
})

$form.Add_MouseUp({
    $script:isDragging = $false
})

$form.Add_KeyDown({
    if ($_.KeyCode -eq "Escape") { $form.Close() }
})

function SetMood($newMood) {
    $script:mood = $newMood
    $script:moodTimer = 0
}

function ReadState {
    if (Test-Path $stateFile) {
        try {
            $json = Get-Content $stateFile -Raw -ErrorAction Stop
            $data = $json | ConvertFrom-Json -ErrorAction Stop
            if ($data.mood -and $data.mood -ne $script:mood) {
                SetMood $data.mood
            }
            if ($data.speech) {
                $script:speechText = $data.speech
                $script:speechTimer = 80
            }
            if ($data.duration) {
                $script:moodTimer = -$data.duration
            }
        } catch {}
    }
}

$img = New-Object System.Drawing.Bitmap 220, 240
$gfx = [System.Drawing.Graphics]::FromImage($img)
$gfx.SmoothingMode = "HighQuality"
$gfx.InterpolationMode = "HighQualityBicubic"

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 80
$timer.Add_Tick({
    $script:frame++
    $script:moodTimer++
    $script:blinkCounter++
    if ($script:speechTimer -gt 0) { $script:speechTimer-- }

    $w = 220; $h = 240
    $cx = 110; $cy = 120
    $gfx.Clear("Magenta")
    
    $bodyColor = "#6C63FF"
    $headColor = "#8B83FF"
    $mood = $script:mood
    $t = $script:moodTimer
    
    # Mood transitions
    if ($mood -eq "happy" -or $mood -eq "celebrating" -or $mood -eq "dance") {
        $script:bounceY = [Math]::Sin($script:frame * 0.25) * 6
        $script:earWiggle = [Math]::Sin($script:frame * 0.3) * 0.12
    } elseif ($mood -eq "thinking" -or $mood -eq "working") {
        $script:bounceY = [Math]::Sin($script:frame * 0.08) * 2
        $script:earWiggle = 0
    } elseif ($mood -eq "sad" -or $mood -eq "error") {
        $script:bounceY = 0
        $script:earWiggle = 0
    } else {
        $script:bounceY = [Math]::Sin($script:frame * 0.1) * 2
        $script:earWiggle = 0
    }

    $by = $script:bounceY
    $ew = $script:earWiggle

    # Auto-revert idle after 20 seconds
    if ($t -gt 250 -and $mood -ne "idle") {
        $script:mood = "idle"
    }

    # --- DRAW ---
    
    # Body
    $bodyBrush = New-Object System.Drawing.SolidBrush $bodyColor
    $gfx.FillEllipse($bodyBrush, 40, 70 + $by, 130, 120)
    
    # Tail
    $tailSway = [Math]::Sin($script:frame * 0.15) * 10
    $tailBrush = New-Object System.Drawing.SolidBrush "#5A52E0"
    $gfx.FillEllipse($tailBrush, 25 + $tailSway * 0.3, 95 + $by + [Math]::Sin($script:frame * 0.1) * 5, 22, 16)
    
    # Feet
    $gfx.FillEllipse($bodyBrush, 50, 178 + $by, 40, 28)
    $gfx.FillEllipse($bodyBrush, 120, 178 + $by, 40, 28)
    
    # Head
    $headBrush = New-Object System.Drawing.SolidBrush $headColor
    $gfx.FillEllipse($headBrush, 50, 20 + $by, 110, 90)

    # Ears
    $earBrush = New-Object System.Drawing.SolidBrush $bodyColor
    $innerEarBrush = New-Object System.Drawing.SolidBrush "#FFB3D9"
    
    $gfx.TranslateTransform(85, 35 + $by)
    $gfx.RotateTransform(-15 + $ew * 30)
    $gfx.FillEllipse($earBrush, -15, -15, 30, 35)
    $gfx.FillEllipse($innerEarBrush, -8, -8, 18, 22)
    $gfx.ResetTransform()
    
    $gfx.TranslateTransform(135, 35 + $by)
    $gfx.RotateTransform(15 - $ew * 30)
    $gfx.FillEllipse($earBrush, -15, -15, 30, 35)
    $gfx.FillEllipse($innerEarBrush, -8, -8, 18, 22)
    $gfx.ResetTransform()
    
    # Eyes
    $whiteEye = New-Object System.Drawing.SolidBrush "White"
    $pupilBrush = New-Object System.Drawing.SolidBrush "#2D2D2D"
    $shineBrush = New-Object System.Drawing.SolidBrush "White"
    
    $blinkNow = $script:blinkCounter % 60 -eq 0
    if ($blinkNow -and $mood -ne "error") { $script:isBlinking = $true }
    if ($script:blinkCounter % 60 -gt 3) { $script:isBlinking = $false }
    
    if ($mood -eq "sad") {
        # Sad eyes - half closed, teary
        $gfx.FillEllipse($whiteEye, 63, 48 + $by, 26, 18)
        $gfx.FillEllipse($whiteEye, 120, 48 + $by, 26, 18)
        $gfx.FillEllipse($pupilBrush, 70, 52 + $by, 10, 10)
        $gfx.FillEllipse($pupilBrush, 127, 52 + $by, 10, 10)
        # Tear
        $tear = New-Object System.Drawing.SolidBrush "#7EC8E3"
        $gfx.FillEllipse($tear, 75, 62 + $by, 6, 10)
        $gfx.FillEllipse($tear, 132, 62 + $by, 6, 10)
    } elseif ($mood -eq "error") {
        # X eyes
        $exPen = New-Object System.Drawing.Pen "#FF4444", 3
        $gfx.DrawLine($exPen, 68, 45 + $by, 86, 63 + $by)
        $gfx.DrawLine($exPen, 86, 45 + $by, 68, 63 + $by)
        $gfx.DrawLine($exPen, 125, 45 + $by, 143, 63 + $by)
        $gfx.DrawLine($exPen, 143, 45 + $by, 125, 63 + $by)
    } elseif ($mood -eq "thinking") {
        # Looking up - one eye squinted
        $gfx.FillEllipse($whiteEye, 63, 48 + $by, 26, 24)
        $gfx.FillEllipse($whiteEye, 120, 48 + $by, 26, 24)
        $gfx.FillEllipse($pupilBrush, 72, 50 + $by, 8, 10)
        $gfx.FillEllipse($pupilBrush, 129, 50 + $by, 8, 10)
        # Squint right eye
        $gfx.FillEllipse($whiteEye, 120, 48 + $by, 26, 14)
        $gfx.FillEllipse($pupilBrush, 129, 50 + $by, 8, 8)
    } elseif ($mood -eq "happy" -or $mood -eq "celebrating" -or $mood -eq "dance") {
        # Happy ^ ^ eyes
        $gfx.FillEllipse($whiteEye, 63, 48 + $by, 26, 24)
        $gfx.FillEllipse($whiteEye, 120, 48 + $by, 26, 24)
        $gfx.FillEllipse($pupilBrush, 72, 54 + $by, 8, 10)
        $gfx.FillEllipse($pupilBrush, 129, 54 + $by, 8, 10)
    } elseif ($script:isBlinking) {
        $gfx.FillEllipse($whiteEye, 63, 50 + $by, 26, 5)
        $gfx.FillEllipse($whiteEye, 120, 50 + $by, 26, 5)
    } else {
        $gfx.FillEllipse($whiteEye, 63, 48 + $by, 26, 24)
        $gfx.FillEllipse($whiteEye, 120, 48 + $by, 26, 24)
        $gfx.FillEllipse($pupilBrush, 72, 54 + $by, 8, 11)
        $gfx.FillEllipse($pupilBrush, 129, 54 + $by, 8, 11)
    }
    
    # Shine
    if ($mood -ne "error" -and $mood -ne "sad") {
        $gfx.FillEllipse($shineBrush, 75, 56 + $by, 3, 4)
        $gfx.FillEllipse($shineBrush, 132, 56 + $by, 3, 4)
    }
    
    # Cheeks
    $blushColor = if ($mood -eq "happy" -or $mood -eq "celebrating" -or $mood -eq "dance") { "#FF6B9D" } else { "#FF9EB5" }
    $blush = New-Object System.Drawing.SolidBrush $blushColor
    $gfx.FillEllipse($blush, 56, 82 + $by, 22, 14)
    $gfx.FillEllipse($blush, 130, 82 + $by, 22, 14)
    
    # Mouth
    $mouthPen = New-Object System.Drawing.Pen "#2D2D2D", 2.5
    
    if ($mood -eq "happy" -or $mood -eq "celebrating" -or $mood -eq "dance") {
        # Big smile
        $gfx.DrawArc($mouthPen, 78, 78 + $by, 50, 28, 10, 160)
        # Tongue
        $tongue = New-Object System.Drawing.SolidBrush "#FF8888"
        $gfx.FillEllipse($tongue, 95, 98 + $by, 16, 12)
    } elseif ($mood -eq "sad") {
        # Frown
        $gfx.DrawArc($mouthPen, 82, 88 + $by, 42, 20, 190, 150)
    } elseif ($mood -eq "thinking") {
        # Pout/Triangle mouth
        $gfx.DrawArc($mouthPen, 90, 82 + $by, 28, 18, 15, 150)
    } elseif ($mood -eq "error") {
        # Shocked O
        $gfx.DrawEllipse($mouthPen, 92, 82 + $by, 24, 22)
    } elseif ($mood -eq "working") {
        # Small determined line
        $gfx.DrawLine($mouthPen, 90, 92 + $by, 116, 92 + $by)
    } else {
        # Neutral smile
        $gfx.DrawArc($mouthPen, 88, 85 + $by, 32, 14, 12, 150)
    }
    
    # Eyebrows
    $browPen = New-Object System.Drawing.Pen "#2D2D2D", 2
    if ($mood -eq "sad" -or $mood -eq "thinking") {
        $gfx.DrawLine($browPen, 62, 42 + $by, 80, 38 + $by)
        $gfx.DrawLine($browPen, 128, 42 + $by, 146, 38 + $by)
    } elseif ($mood -eq "error") {
        $gfx.DrawLine($browPen, 60, 38 + $by, 82, 42 + $by)
        $gfx.DrawLine($browPen, 126, 38 + $by, 148, 42 + $by)
    } elseif ($mood -eq "working") {
        $gfx.DrawLine($browPen, 62, 40 + $by, 82, 44 + $by)
        $gfx.DrawLine($browPen, 126, 40 + $by, 146, 44 + $by)
    } else {
        $gfx.DrawArc($browPen, 62, 40 + $by, 26, 8, 10, 160)
        $gfx.DrawArc($browPen, 120, 40 + $by, 26, 8, 10, 160)
    }
    
    # Special effects per mood
    if ($mood -eq "celebrating" -or $mood -eq "happy") {
        $starBrush = New-Object System.Drawing.SolidBrush "#FFD700"
        $sx = 30 + [Math]::Sin($script:frame * 0.2) * 8
        $sy = 25 + [Math]::Cos($script:frame * 0.15 + 1) * 6
        $gfx.FillEllipse($starBrush, $sx, $sy, 10, 10)
        $gfx.FillEllipse($starBrush, $sx - 15, $sy + 20, 8, 8)
        $gfx.FillEllipse($starBrush, 175 + [Math]::Sin($script:frame * 0.18 + 2) * 6, 30 + [Math]::Cos($script:frame * 0.12) * 6, 10, 10)
    }
    
    if ($mood -eq "dance") {
        $noteBrush = New-Object System.Drawing.SolidBrush "#FF69B4"
        $ny = 15 + [Math]::Sin($script:frame * 0.3) * 10
        $gfx.FillEllipse($noteBrush, 180, $ny, 8, 8)
        $gfx.FillEllipse($noteBrush, 170, $ny - 15, 8, 8)
    }
    
    if ($mood -eq "working") {
        $gearPen = New-Object System.Drawing.Pen "#FFB347", 2
        $gfx.DrawEllipse($gearPen, 10, 15, 18, 18)
        $gfx.DrawLine($gearPen, 14, 19, 24, 29)
        $gfx.DrawLine($gearPen, 24, 19, 14, 29)
    }
    
    if ($mood -eq "thinking") {
        $bulb = New-Object System.Drawing.SolidBrush "#FFD700"
        $gfx.FillEllipse($bulb, 170, 10, 20, 25)
        $gfx.FillEllipse($bulb, 175, 30, 10, 8)
        $glowBrush = New-Object System.Drawing.SolidBrush "#FFF3B0"
        $gfx.FillEllipse($glowBrush, 173, 13, 14, 18)
    }
    
    # Speech bubble
    if ($script:speechText -and $script:speechTimer -gt 0) {
        $sbBrush = New-Object System.Drawing.SolidBrush "White"
        $sbPen = New-Object System.Drawing.Pen "#CCCCCC", 1.5
        $sbFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
        $sbFormat = New-Object System.Drawing.StringFormat
        $sbFormat.Alignment = "Center"
        $sbFormat.LineAlignment = "Middle"
        
        $bw = 160; $bh = 50
        $bx = ($w - $bw) / 2
        $by2 = 65 + $by - 5
        if ($by2 -lt 0) { $by2 = 3 }
        
        $gfx.FillRectangle($sbBrush, $bx, $by2 - $bh - 5, $bw, $bh)
        $gfx.DrawRectangle($sbPen, $bx, $by2 - $bh - 5, $bw, $bh)
        # Speech triangle
        $gfx.FillPolygon($sbBrush, @(
            (New-Object System.Drawing.Point($cx - 8, $by2 - 5)),
            (New-Object System.Drawing.Point($cx + 8, $by2 - 5)),
            (New-Object System.Drawing.Point($cx, $by2 + 8))
        ))
        $gfx.DrawPolygon($sbPen, @(
            (New-Object System.Drawing.Point($cx - 8, $by2 - 5)),
            (New-Object System.Drawing.Point($cx + 8, $by2 - 5)),
            (New-Object System.Drawing.Point($cx, $by2 + 8))
        ))
        
        $text = $script:speechText
        if ($text.Length -gt 24) { $text = $text.Substring(0, 22) + ".." }
        $textColor = New-Object System.Drawing.SolidBrush "#333333"
        $gfx.DrawString($text, $sbFont, $textColor, $bx + $bw/2, $by2 - $bh/2 - 5, $sbFormat)
    }
    
    # Mood indicator text at bottom
    $moodLabels = @{
        "idle" = @("~ o ~", "#999999")
        "happy" = @("^^ feliz ^^", "#FF6B9D")
        "sad" = @("( ;-; )", "#7EC8E3")
        "thinking" = @("( °-°)", "#FFB347")
        "working" = @("⚡ trabalhando ⚡", "#6C63FF")
        "error" = @("(×_×) erro!", "#FF4444")
        "celebrating" = @("🎉🎉🎉", "#FFD700")
        "dance" = @("♪ dançando ♪", "#FF69B4")
        "typing" = @("✎ digitando...", "#7ED321")
        "sleepy" = @("(ᴗ˳ᴗ) zzz", "#B0B0B0")
        "wave" = @("👋 oi!", "#8B83FF")
    }
    
    if ($moodLabels.ContainsKey($mood)) {
        $ml = $moodLabels[$mood]
        $moodFont = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
        $mc = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, [System.Drawing.ColorTranslator]::FromHtml($ml[1])))
        $gfx.DrawString($ml[0], $moodFont, $mc, $cx, 200 + $by, [System.Drawing.StringFormat]::GenericDefault)
    }
    
    $form.BackgroundImage = $img

    ReadState
})

$timer.Start()

$form.Add_FormClosed({
    $timer.Stop()
    $gfx.Dispose()
    $img.Dispose()
})

[void]$form.ShowDialog()
