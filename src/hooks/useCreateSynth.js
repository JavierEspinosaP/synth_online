import { useState, useRef, useEffect } from "react";
import * as Tone from 'tone';

export const useCreateSynth = (config) => {
  const { oscillatorType, oscillatorType2, envelope, gainValue, delayTime, delayFeedback, reverbLevel, reverbDecay } = config;
  const synth = useRef(null);
  const synth2 = useRef(null);
  const gain = useRef(null);
  const delay = useRef(null);
  const reverb = useRef(null);



  const createSynth = async () => {
    synth.current = new Tone.Synth({
      oscillator: { type: oscillatorType },
      envelope: { attack: envelope.attack, decay: envelope.decay, sustain: envelope.sustain, release: envelope.release },
    });

    synth2.current = new Tone.Synth({
      oscillator: { type: oscillatorType },
      envelope: { attack: envelope.attack, decay: envelope.decay, sustain: envelope.sustain, release: envelope.release },
    });

    gain.current = new Tone.Gain(gainValue).toDestination();
    delay.current = new Tone.FeedbackDelay(delayTime, delayFeedback).connect(gain.current);
    reverb.current = new Tone.Reverb(reverbDecay).connect(gain.current);

    await reverb.current.generate();
    if (reverb.current.roomSize) {
      reverb.current.roomSize.value = reverbLevel;
    }
    synth.current.connect(delay.current);
    synth.current.connect(reverb.current);
    synth2.current.connect(delay.current);
    synth2.current.connect(reverb.current);
  };

  useEffect(() => {
    createSynth();
  }, []);

  useEffect(() => {
    if (synth.current && synth2.current && gain.current && delay.current && reverb.current) {
      const synthConfig1 = {
        oscillator: { type: oscillatorType },
        envelope: { attack: envelope.attack, decay: envelope.decay, sustain: envelope.sustain, release: envelope.release },
      };

      const synthConfig2 = {
        oscillator: { type: oscillatorType2 },
        envelope: { attack: envelope.attack, decay: envelope.decay, sustain: envelope.sustain, release: envelope.release },
      };

      synth.current.set(synthConfig1);
      synth2.current.set(synthConfig2);

      gain.current.gain.value = gainValue;
      delay.current.delayTime.set({ value: delayTime });
      delay.current.feedback.set({ value: delayFeedback });
    }
  }, [oscillatorType, oscillatorType2, envelope, gainValue, delayTime, delayFeedback, reverbLevel, reverbDecay]);

  return { synth, synth2, gain, delay, reverb };
};
