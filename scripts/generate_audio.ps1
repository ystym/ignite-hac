$out = "C:\Users\student\Documents\Default Project\public\samples\lecture-kinematics.wav"
$text = @'
Okay, settle down everyone. Today we are finishing Chapter three: motion in a straight line. Last class we defined distance as total path length, and displacement as the straight line vector from start to end. Remember, displacement can be zero even when distance is not zero. That is a favourite exam trap.

Now, speed equals distance divided by time. Velocity equals displacement divided by time, and it has direction. When velocity changes at a constant rate we call it uniform acceleration. The three equations of motion apply only when acceleration is constant. First, v equals u plus a t. Second, s equals u t plus one half a t squared. Third, v squared equals u squared plus two a s.

Look at the velocity time graph on the board. The slope is acceleration and the area under the line is displacement. If the graph is curved, acceleration is not constant, so do not simply use the three equations.

For relative velocity, if two objects move in the same direction, subtract the velocities. For river boat problems, resolve the boat velocity and the river velocity as perpendicular vectors.

One more thing. The exponent on the second equation is sometimes misread in the notes. It is t squared, not t cubed. Please check the correction on the board before you copy it.

Your practice questions are on the portal. Focus on graph interpretation and relative velocity. Next class we start projectile motion. Thank you.
'@
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice("Microsoft David Desktop")
$s.Rate = -1
$s.Volume = 100
$s.SetOutputToWaveFile($out)
$s.Speak($text)
$s.Dispose()
Write-Output ("Wrote " + (Get-Item $out).Length + " bytes")
