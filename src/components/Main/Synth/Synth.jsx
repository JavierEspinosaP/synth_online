import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import '../../../styles/components/__synth.scss'
import scalesData from '../../../assets/scales.json';


const generateScaleNotes = (rootNote, scaleType, numSteps) => {

  const scalePattern = scalesData.scales[scaleType];
  const rootNoteIndex = scalesData.notes.indexOf(rootNote);
  let scaleNotes = [];
  let octaveOffset = 0;
  console.log(numSteps);

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

const Synthesizer = () => {

  const [oscillatorType, setOscillatorType] = useState('sine');
  const [envelope, setEnvelope] = useState({ attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 });
  const [gainValue, setGainValue] = useState(0.5);
  const [delayTime, setDelayTime] = useState(0);
  const [delayFeedback, setDelayFeedback] = useState(0);
  const [reverbLevel, setReverbLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(200);
  const [part, setPart] = useState(null);
  const [reverbDecay, setReverbDecay] = useState(1.5);
  const events = useRef([]);
  const [rootNote, setRootNote] = useState('C5');
  const [scale, setScale] = useState('major');
  const [numSteps, setNumSteps] = useState(8);
  const [arpeggiatorNotes, setArpeggiatorNotes] = useState(() => {
    const { scaleNotes, nextOctave } = generateScaleNotes('C5', 'major', 8);
    return { scaleNotes, nextOctave };
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [stepRange, setStepRange] = useState({ start: 0, end: 7 });
  const [currentPageNotes, setCurrentPageNotes] = useState([]);


  const synth = useRef(null);
  const gain = useRef(null);
  const delay = useRef(null);
  const reverb = useRef(null);

  const createSynth = async () => {
    synth.current = new Tone.Synth({
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
  };

  useEffect(() => {
    createSynth();
  }, []);


  useEffect(() => {
    const { scaleNotes, nextOctave } = generateScaleNotes(rootNote, scale, numSteps);
    setArpeggiatorNotes({ scaleNotes, nextOctave });
  }, [rootNote, scale, numSteps]);


  const stopArpeggiator = () => {
    if (part) {
      part.stop();
      part.dispose();
      setPart(null);
    }
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  const handleButtonClick = () => {
    if (isPlaying) {
      stopArpeggiator();
    } else {
      playArpeggiator();
    }
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
  
    // Asignar el nuevo array de eventos a la referencia events
    events.current = newEvents;
  
    // Actualizar el loopDuration de la parte si es necesario
    if (part) {
      const loopDuration = newEvents.length * (60 / bpmRef.current);
      part.loopEnd = loopDuration;
    }
  };
  


  const arpeggiatorNotesRef = useRef(arpeggiatorNotes);

  const bpmRef = useRef(bpm);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    bpmRef.current = bpm; // Actualiza el valor de bpmRef.current
  }, [bpm]);

  useEffect(() => {
    arpeggiatorNotesRef.current = arpeggiatorNotes.scaleNotes;
  }, [arpeggiatorNotes]);

  const playArpeggiator = async () => {
    stopArpeggiator(); // Detener cualquier bucle existente antes de crear uno nuevo

    await Tone.start();

    const scaleNotes = arpeggiatorNotes.scaleNotes;
    let arpeggiatorNotesList = [];
    const repeats = numSteps / scaleNotes.length;


    for (let i = 0; i < repeats; i++) {
      arpeggiatorNotesList = arpeggiatorNotesList.concat(scaleNotes);
    }

    arpeggiatorNotesRef.current = arpeggiatorNotesList;

    updateArpeggioEvents();

    const events = arpeggiatorNotesRef.current.map((_, idx) => {
      const timeBetweenNotes = 60 / bpmRef.current;
      return {
        time: idx * timeBetweenNotes,
        note: () => arpeggiatorNotesRef.current[idx],
      };
    });

    const loopDuration = events.length * (60 / bpmRef.current);

    const arpeggioPart = new Tone.Part((time, event) => {
      console.log("Step actual:", events.findIndex(e => e.time === event.time));
      synth.current.triggerAttackRelease(event.note(), Tone.Time("1n"), time);
    }, events);

    arpeggioPart.loop = true;
    arpeggioPart.loopEnd = loopDuration;
    arpeggioPart.start(0);

    Tone.Transport.start();
    setIsPlaying(true);
    setPart(arpeggioPart);
  };

  useEffect(() => {
    // Detener el arpegiador si está reproduciéndose
    if (isPlaying) {
      stopArpeggiator(); // Detén el arpegiador
      playArpeggiator(); // Inicia el arpegiador con los nuevos eventos
    }
  }, [numSteps]);

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
  };

  useEffect(() => {
    if (synth.current && gain.current && delay.current && reverb.current) {
      synth.current.set({
        oscillator: { type: oscillatorType },
        envelope: { attack: envelope.attack, decay: envelope.decay, sustain: envelope.sustain, release: envelope.release },

      });

      gain.current.gain.value = gainValue;
      delay.current.delayTime.set({ value: delayTime });
      delay.current.feedback.set({ value: delayFeedback });

    }
  }, [oscillatorType, envelope, gainValue, delayTime, delayFeedback, reverbLevel, reverbDecay]);

  useEffect(() => {
    if (reverb.current) {
      if (reverb.current.roomSize) {
        const now = Tone.context.currentTime;
        reverb.current.roomSize.cancelScheduledValues(now);
        reverb.current.roomSize.setValueAtTime(reverbLevel, now + 0.1);
      }
      reverb.current.decay = reverbDecay;
    }
  }, [reverbLevel, reverbDecay]);

  const handlePageChange = (event) => {
    setCurrentPage(parseInt(event.target.value, 10));
  };

  useEffect(() => {
    const pageStart = currentPage * 8;
    const pageEnd = pageStart + 8;
    const currentNotes = arpeggiatorNotes.scaleNotes.slice(pageStart, pageEnd);
    while (currentNotes.length < 8) {
      currentNotes.push(null);
    }
    setCurrentPageNotes(currentNotes);
  }, [rootNote, scale, numSteps, currentPage, arpeggiatorNotes.scaleNotes]);


  useEffect(() => {
    if (isPlaying) {
      updateArpeggioEvents(numSteps);
  
      const loopDuration = events.current.length * (60 / bpmRef.current);
      if (part) {
        part.loopEnd = loopDuration;
      }
    }
  }, [numSteps]);
  
  
  return (
    <div className="synthesizer">
      <h2 className="synthesizer__title">Synthesizer</h2>

      <div className="synthesizer__control-group">
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="oscillatorType">Oscillator</label>
          <select id="oscillatorType" onChange={(e) => setOscillatorType(e.target.value)}>
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
          </select>
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="bpm">BPM</label>
          <input
            type="range"
            id="bpm"
            min="40"
            max="999"
            step="1"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
          />
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="attack">Attack (ms)</label>
          <input
            type="range"
            id="attack"
            min="0"
            max="1"
            step="0.001"
            value={(Math.log(envelope.attack) - Math.log(0.001)) / (Math.log(10) - Math.log(0.001))}
            onChange={(e) => setEnvelope({ ...envelope, attack: parseFloat(Math.exp(e.target.value * (Math.log(10) - Math.log(0.001)) + Math.log(0.001))) })}
          />

        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="decay">Decay (ms)</label>
          <input
            type="range"
            id="decay"
            min="0"
            max="2000"
            step="1"
            value={envelope.decay * 1000}
            onChange={(e) => setEnvelope({ ...envelope, decay: parseFloat(e.target.value) / 1000 })}
          />
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="sustain">Sustain</label>
          <input
            type="range"
            id="sustain"
            min="0"
            max="1"
            step="0.01"
            value={envelope.sustain}
            onChange={(e) => setEnvelope({ ...envelope, sustain: parseFloat(e.target.value) })}
          />
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="release">Release (ms)</label>
          <input
            type="range"
            id="release"
            min="0"
            max="5000"
            step="1"
            value={envelope.release * 1000}
            onChange={(e) => setEnvelope({ ...envelope, release: parseFloat(e.target.value) / 1000 })}
          />
        </div>

        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="gainValue">Gain</label>
          <input type="range" id="gainValue" min="0" max="1" step="0.01" value={gainValue} onChange={(e) => setGainValue(parseFloat(e.target.value))} />
        </div>

        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="delayTime">Delay Time</label>
          <input type="range" id="delayTime" min="0" max="1" step="0.2" value={delayTime} onChange={(e) => setDelayTime(parseFloat(e.target.value))} />
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="delayFeedback">Delay Feedback</label>
          <input type="range" id="delayFeedback" min="0" max="1" step="0.2" value={delayFeedback} onChange={(e) => setDelayFeedback(parseFloat(e.target.value))} />
        </div>

        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="reverbLevel">Reverb Level</label>
          <input type="range" id="reverbLevel" min="0" max="1" step="0.2" value={reverbLevel} onChange={(e) => setReverbLevel(parseFloat(e.target.value))} />
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="reverbDecay">Reverb Decay</label>
          <input
            type="range"
            id="reverbDecay"
            min="0.01"
            max="10"
            step="2"
            value={reverbDecay}
            onChange={(e) => setReverbDecay(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <select
        id="root-note"
        value={rootNote}
        onChange={(e) => {
          setRootNote(e.target.value);
          setArpeggiatorNotes(generateScaleNotes(e.target.value, scale));
        }}
      >
        {scalesData.notes.slice(0, 12).map((note, index) => (
          <option key={index} value={note}>
            {note}
          </option>
        ))}
      </select>

      <select
        id="scale"
        value={scale}
        onChange={(e) => {
          setScale(e.target.value);
          setArpeggiatorNotes(generateScaleNotes(rootNote, e.target.value));
        }}
      >
        {Object.keys(scalesData.scales).map((scaleName, index) => (
          <option key={index} value={scaleName}>
            {scaleName.charAt(0).toUpperCase() + scaleName.slice(1)}
          </option>
        ))}
      </select>

      <div className="synthesizer__control">
        <label className="synthesizer__control-label" htmlFor="numSteps">Number of Steps</label>
        <select id="numSteps" value={numSteps} onChange={handleNumStepsChange}>
          <option value="8">8</option>
          <option value="16">16</option>
          <option value="32">32</option>
          <option value="64">64</option>
        </select>
      </div>

      <label htmlFor="current-page">Page</label>
      <select id="current-page" value={currentPage} onChange={handlePageChange}>
        {Array.from({ length: Math.ceil(numSteps / 8) }, (_, index) => (
          <option key={index} value={index}>
            {(index + 1)}
          </option>
        ))}
      </select>

      <div className="synthesizer__arpeggiator">
        <h3 className="synthesizer__arpeggiator-title">Arpeggiator</h3>
        <div className="synthesizer__arpeggiator-notes">
          {currentPageNotes.map((note, index) => (
            <div key={index} className="synthesizer__note-selector">
              <select
                value={note}
                onChange={(e) => handleNoteChange(index + stepRange.start, e)}
              >
                {scalesData.notes.map((noteOption, idx) => (
                  <option key={idx} value={noteOption}>
                    {noteOption}
                  </option>
                ))}
              </select>
            </div>
          ))}

        </div>
      </div>

      <div className="synthesizer__play-control">
        <button className="synthesizer__play-button" onClick={handleButtonClick}>{isPlaying ? 'Stop Arpeggiator' : 'Play Arpeggiator'}</button>
      </div>
    </div>
  );
}

export default Synthesizer;