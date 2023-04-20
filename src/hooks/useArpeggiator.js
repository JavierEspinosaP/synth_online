import { useState, useEffect } from 'react';
import scalesData from '../assets/scales.json';

const useArpeggiator = (initialRootNote, initialScaleType, initialNumSteps) => {
    const generateScaleNotes = (rootNote, scaleType, numSteps) => {

        const scalePattern = scalesData.scales[scaleType];
        const rootNoteIndex = scalesData.notes.indexOf(rootNote);
        let scaleNotes = [];
        let octaveOffset = 0;

        while (scaleNotes.length < numSteps) {
            for (const interval of scalePattern) {
                const noteIndex = rootNoteIndex + interval + octaveOffset;
                if (noteIndex < scalesData.notes.length) {
                    scaleNotes.push(scalesData.notes[noteIndex]);
                } else {
                    octaveOffset += 12;
                }
                if (scaleNotes.length === numSteps) {
                    break;
                }
            }
        }
        return { scaleNotes, nextOctave: octaveOffset };
    };

    const [rootNote, setRootNote] = useState(initialRootNote);
    const [scale, setScale] = useState(initialScaleType);
    const [numSteps, setNumSteps] = useState(initialNumSteps);

    const [arpeggiatorNotes, setArpeggiatorNotes] = useState(() => {
        const { scaleNotes, nextOctave } = generateScaleNotes(initialRootNote, initialScaleType, initialNumSteps);
        return { scaleNotes, nextOctave };
    });

    useEffect(() => {
        const { scaleNotes, nextOctave } = generateScaleNotes(rootNote, scale, numSteps);
        setArpeggiatorNotes({ scaleNotes, nextOctave });
      }, [rootNote, scale, numSteps]);

      return {
        rootNote,
        setRootNote,
        scale,
        setScale,
        numSteps,
        setNumSteps,
        arpeggiatorNotes,
        setArpeggiatorNotes,
        generateScaleNotes
      };
};

export default useArpeggiator;