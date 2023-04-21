import { useState, useCallback } from 'react';
import * as Tone from 'tone';

const useArpeggiatorPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [part, setPart] = useState(null);

  const stopArpeggiator = useCallback(() => {
    if (part) {
      part.stop();
      part.dispose();
      setPart(null);
    }
    Tone.Transport.stop();
    setIsPlaying(false);
  }, [part]);

  const playArpeggiator = useCallback(
    async ({
      arpeggiatorNotes,
      numSteps,
      bpm,
      synth,
      synth2,
      updateArpeggioEvents,
    }) => {
      stopArpeggiator();

      await Tone.start();

      let arpeggiatorNotesList = [];
      const repeats = numSteps / arpeggiatorNotes.length;

      for (let i = 0; i < repeats; i++) {
        arpeggiatorNotesList = arpeggiatorNotesList.concat(arpeggiatorNotes);
      }

      updateArpeggioEvents();

      const events = arpeggiatorNotesList.map((_, idx) => {
        const timeBetweenNotes = 60 / bpm;
        return {
          time: idx * timeBetweenNotes,
          note: () => arpeggiatorNotesList[idx],
        };
      });

      const loopDuration = events.length * (60 / bpm);

      const arpeggioPart = new Tone.Part((time, event) => {
        synth.current.triggerAttackRelease(event.note(), Tone.Time('1n'), time);
        synth2.current.triggerAttackRelease(event.note(), Tone.Time('1n'), time);
      }, events);

      arpeggioPart.loop = true;
      arpeggioPart.loopEnd = loopDuration;
      arpeggioPart.start(0);

      Tone.Transport.start();
      setIsPlaying(true);
      setPart(arpeggioPart);
    },
    [stopArpeggiator]
  );

  const toggleArpeggiatorPlayback = useCallback(
    (params) => {
      if (isPlaying) {
        stopArpeggiator();
      } else {
        playArpeggiator(params);
      }
    },
    [isPlaying, playArpeggiator, stopArpeggiator]
  );

  return {
    isPlaying,
    setIsPlaying,
    toggleArpeggiatorPlayback,
  };
};

export default useArpeggiatorPlayback;
