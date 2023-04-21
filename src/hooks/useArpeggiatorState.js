import { useState, useEffect, useRef } from "react";

export const useArpeggiatorState = (rootNote, scale, numSteps, setNumSteps, arpeggiatorNotes, setArpeggiatorNotes, generateScaleNotes, currentPage, setCurrentPageNotes, setCurrentPage, bpmRef, 
  events, part, synth, synth2) => {
  const arpeggiatorNotesRef = useRef(arpeggiatorNotes);

  useEffect(() => {
    arpeggiatorNotesRef.current = arpeggiatorNotes.scaleNotes;
  }, [arpeggiatorNotes]);

  const handleNumStepsChange = (event) => {
    const newNumSteps = parseInt(event.target.value, 10);
    setNumSteps(newNumSteps);
    console.log(numSteps);
    const { scaleNotes, nextOctave } = generateScaleNotes(
      rootNote,
      scale,
      newNumSteps
    );
    setArpeggiatorNotes({ scaleNotes, nextOctave });
    console.log(scaleNotes);
    arpeggiatorNotesRef.current = scaleNotes;
  };
  
  const handleNoteChange = (index, event) => {

    const newNotes = [...arpeggiatorNotes.scaleNotes];
    const pageIndex = currentPage * 8;
    newNotes[pageIndex + index] = event.target.value;
    setArpeggiatorNotes({ scaleNotes: newNotes, nextOctave: arpeggiatorNotes.nextOctave });
    setCurrentPageNotes(newNotes.slice(pageIndex, pageIndex + 8));
    playNote(event.target.value);
  };

  const handlePageChange = (event) => {

    setCurrentPage(parseInt(event.target.value, 10));
  };

  const updateArpeggioEvents = (newNumSteps = numSteps) => {
    const newEvents = arpeggiatorNotesRef.current
      .slice(0, newNumSteps)
      .map((note, idx) => {
        const timeBetweenNotes = 60 / bpmRef.current;

        return {
          time: idx * timeBetweenNotes,
          note: note,
        };
      });
    events.current = newEvents;

    if (part) {
      const loopDuration = newEvents.length * (60 / bpmRef.current);
      part.loopEnd = loopDuration;
    }
  };

  const playNote = (note) => {
    synth.current.triggerAttackRelease(note, "8n");
    synth2.current.triggerAttackRelease(note, "8n");
  };

  return {
    arpeggiatorNotes,
    setArpeggiatorNotes,
    arpeggiatorNotesRef,
    handleNumStepsChange,
    handleNoteChange,
    handlePageChange,
    updateArpeggioEvents,
    playNote,
  };
};

export default useArpeggiatorState