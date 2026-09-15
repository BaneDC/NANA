// Generative ambient audio for the immersive questionnaire. Everything is
// synthesized with the Web Audio API — no files, no loop seam, nothing to license.
// A low drone breathes underneath, soft pentatonic tones bloom and fade on a slow
// random timer, and a whisper of band-passed noise fills the air between them.

// A pentatonic — no semitone clashes, so any two overlapping notes stay consonant.
const NOTES = [220.0, 246.94, 277.18, 329.63, 369.99, 440.0];

// Off until the client confirms they want it. The generator below is untouched;
// flip this to bring back the music and its mute button in both immersive screens.
export const AMBIENT_AUDIO = false;

export function createZenAudio() {
  let ctx = null;
  let master = null;
  let voiceTimer = null;
  let muted = false;

  const VOLUME = 0.14;

  function start() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // master -> gentle lowpass so nothing is ever bright or sharp
    master = ctx.createGain();
    master.gain.value = 0;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1400;
    master.connect(lowpass);
    lowpass.connect(ctx.destination);
    master.gain.setTargetAtTime(VOLUME, now, 2.5); // slow fade in

    // drone: two barely detuned sines beat against each other, ~7s swell cycle
    [110, 110.35].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.045;
      osc.connect(g);
      g.connect(master);
      osc.start();
    });

    // air: looped noise squeezed through a soft bandpass, almost subliminal
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 520;
    band.Q.value = 0.4;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.012;
    noise.connect(band);
    band.connect(airGain);
    airGain.connect(master);
    noise.start();

    // tones: one note at a time, blooming over ~2s and fading over ~3s,
    // scheduled loosely so they overlap like slow bells
    const playVoice = () => {
      if (!ctx) return;
      const octaveUp = Math.random() < 0.3 ? 2 : 1;
      const freq = NOTES[Math.floor(Math.random() * NOTES.length)] * octaveUp;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.setTargetAtTime(0.05, t, 2.0);
      g.gain.setTargetAtTime(0, t + 4.5, 3.0);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      osc.connect(g);
      if (pan) {
        pan.pan.value = (Math.random() * 2 - 1) * 0.6;
        g.connect(pan);
        pan.connect(master);
      } else {
        g.connect(master);
      }
      osc.start(t);
      osc.stop(t + 18);

      voiceTimer = setTimeout(playVoice, 3800 + Math.random() * 4200);
    };
    playVoice();
  }

  function stop() {
    if (!ctx) return;
    clearTimeout(voiceTimer);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    const dying = ctx;
    setTimeout(() => dying.close().catch(() => {}), 1600);
    ctx = null;
    master = null;
  }

  function setMuted(next) {
    muted = next;
    if (ctx && master) {
      master.gain.setTargetAtTime(muted ? 0 : VOLUME, ctx.currentTime, 0.4);
    }
  }

  return {
    start,
    stop,
    setMuted,
    get muted() {
      return muted;
    },
  };
}
