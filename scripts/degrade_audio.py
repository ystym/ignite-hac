"""Degrade the clean SAPI lecture into a realistic noisy phone recording.

Requires only the Python standard library.
    python scripts/degrade_audio.py
"""
import array
import math
import random
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "samples" / "lecture-kinematics.wav"

with wave.open(str(SRC), "rb") as w:
    channels = w.getnchannels()
    width = w.getsampwidth()
    rate = w.getframerate()
    raw = w.readframes(w.getnframes())

assert channels == 1 and width == 2, "Expected mono 16-bit source"
samples = array.array("h")
samples.frombytes(raw)

target_rate = 16000
ratio = rate / target_rate
new_len = int(len(samples) / ratio)
resampled = []
for i in range(new_len):
    pos = i * ratio
    lo = int(pos)
    hi = min(lo + 1, len(samples) - 1)
    frac = pos - lo
    resampled.append(samples[lo] * (1 - frac) + samples[hi] * frac)

# Low-pass (3-tap moving average), lower level, hum + hiss, and soft clipping.
out = array.array("h")
hum_phase = 0.0
for i, s in enumerate(resampled):
    if i >= 2:
        s = (resampled[i - 2] + resampled[i - 1] + s) / 3
    # Quieter recording (phone held far from the speaker).
    s *= 0.46
    # Mains hum and microphone hiss.
    hum_phase += 2 * math.pi * 50 / target_rate
    s += 260 * math.sin(hum_phase) + random.gauss(0, 210)
    # A little soft clipping from the recorder.
    s = max(-32768, min(32767, s))
    out.append(int(s))

with wave.open(str(SRC), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(target_rate)
    w.writeframes(out.tobytes())

print("wrote", SRC, SRC.stat().st_size, "bytes")
