import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import '../../../styles/components/__synth.scss'
import { useCreateSynth } from '../../../hooks/useCreateSynth'; 
import useArpeggiator from '../../../hooks/useArpeggiator';
import useArpeggiatorControls from '../../../hooks/useArpeggiatorControls';
import useArpeggiatorState from '../../../hooks/useArpeggiatorState'
import scalesData from '../../../assets/scales.json';
import Knob from './RotaryKnob/RotaryKnob'
import _ from 'lodash';

const Synthesizer = () => {

  const [oscillatorType, setOscillatorType] = useState('sine');
  const [oscillatorType2, setOscillatorType2] = useState('sine');
  const [isPlaying, setIsPlaying] = useState(false);
  const [part, setPart] = useState(null);
  const [noteIndex, setNoteIndex] = useState(null)  

  const {
    bpm,
    bpmRef,
    gainValue,
    envelope,
    delayTime,
    delayFeedback,
    reverbLevel,
    reverbDecay,
    bpmToRotation,
    gainToRotation,
    attackToRotation,
    handleBpmKnobChange,
    handleGainKnobChange,
    handleAttackKnobChange,
    handleDecayKnobChange,
    handleSustainKnobChange,
    handleDelayTimeKnobChange,
    handleDelayFeedbackKnobChange,
    handleReverbLevelKnobChange,
    handleReverbDecayKnobChange
  } = useArpeggiatorControls(200, 0.1,{ attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 } )


  const {
    rootNote,
    setRootNote,
    scale,
    setScale,
    numSteps,
    setNumSteps,
    arpeggiatorNotes,
    setArpeggiatorNotes,
    generateScaleNotes,
    randomizeNotes
  } = useArpeggiator('C5', 'major', 8);

  

  const stopArpeggiator = () => {
    if (part) {
      part.stop();
      part.dispose();
      setPart(null);
    }
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  const playArpeggiator = async () => {
    stopArpeggiator(); 

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
      setNoteIndex(events.findIndex(e => e.time === event.time) + 1)
      synth.current.triggerAttackRelease(event.note(), Tone.Time("1n"), time);
      synth2.current.triggerAttackRelease(event.note(), Tone.Time("1n"), time);
    }, events);

    arpeggioPart.loop = true;
    arpeggioPart.loopEnd = loopDuration;
    arpeggioPart.start(0);

    Tone.Transport.start();
    setIsPlaying(true);
    setPart(arpeggioPart);
  };

  const events = useRef([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPageNotes, setCurrentPageNotes] = useState([]);

  const { synth, synth2, gain, delay, reverb } = useCreateSynth({
    oscillatorType,
    oscillatorType2,
    envelope,
    gainValue,
    delayTime,
    delayFeedback,
    reverbLevel,
    reverbDecay
  });


  const handleButtonClick = () => {
    if (isPlaying) {
      stopArpeggiator();
    } else {
      playArpeggiator();
    }
  };


  useEffect(() => {
    arpeggiatorNotesRef.current = arpeggiatorNotes.scaleNotes;
  }, [arpeggiatorNotes]);

  useEffect(() => {
    if (isPlaying) {
      stopArpeggiator(); 
      playArpeggiator(); 
    }
  }, [numSteps]);


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


  const {
    arpeggiatorNotesRef,
    handleNumStepsChange,
    handleNoteChange,
    handlePageChange,
    updateArpeggioEvents,
    playNote,
  } = useArpeggiatorState(rootNote, scale, numSteps, setNumSteps, arpeggiatorNotes, setArpeggiatorNotes, generateScaleNotes, currentPage, setCurrentPageNotes, setCurrentPage, bpmRef, 
    events, part, synth, synth2);


  useEffect(() => {
    const pageStart = currentPage * 8;
    const pageEnd = pageStart + 8;
    const currentNotes = arpeggiatorNotes.scaleNotes.slice(pageStart, pageEnd);
    console.log(currentNotes);
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
          <label className="synthesizer__control-label" htmlFor="oscillatorType2">Oscillator 2</label>
          <select id="oscillatorType2" onChange={(e) => setOscillatorType2(e.target.value)}>
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
          </select>
        </div>

        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="bpm">BPM</label>
          <Knob
            initialValue={bpmToRotation(bpm)}
            onChange={handleBpmKnobChange}
          />
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="attack">Attack (ms)</label>
          <Knob
            initialValue={attackToRotation(envelope.attack)}
            onChange={handleAttackKnobChange}
          />

        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="decay">
            Decay (ms)
          </label>
          <Knob
            initialValue={
              (Math.log(envelope.decay) - Math.log(0.001)) /
              (Math.log(2) - Math.log(0.001))
            }
            min={0}
            max={2000}
            step={1}
            onChange={handleDecayKnobChange}
          />
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="sustain">
            Sustain
          </label>
          <Knob
            initialValue={envelope.sustain}
            min={0}
            max={1}
            step={0.01}
            onChange={handleSustainKnobChange}
          />
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="gainValue">Gain</label>
          <Knob
            initialValue={gainToRotation(gainValue)}
            onChange={handleGainKnobChange} />
        </div>

        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="delayTime">Delay Time</label>
          <Knob
            initialValue={0}
            min={0}
            max={1}
            step={0.01}
            onChange={handleDelayTimeKnobChange}
          />
        </div>
        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="delayFeedback">Delay Feedback</label>
          <Knob
            initialValue={delayFeedback}
            min={0}
            max={1}
            step={0.01}
            onChange={handleDelayFeedbackKnobChange}
          />
        </div>

        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="reverbLevel">Reverb Level</label>
          <Knob
            initialValue={(reverbLevel - 0) / (1 - 0)}
            min={0}
            max={1}
            step={0.1}
            onChange={handleReverbLevelKnobChange}
          />
        </div>

        <div className="synthesizer__control">
          <label className="synthesizer__control-label" htmlFor="reverbDecay">Reverb Decay</label>
          <Knob
            initialValue={(reverbDecay - 0.01) / (10 - 0.01)}
            min={0}
            max={1}
            step={0.1}
            onChange={handleReverbDecayKnobChange}
          />
        </div>
      </div>
      <div className="synthesizer__control">
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


        <label className="synthesizer__control-label" htmlFor="numSteps">Number of Steps</label>
        <select id="numSteps" value={numSteps} onChange={handleNumStepsChange}>
          <option value="8">8</option>
          <option value="16">16</option>
          <option value="32">32</option>
          <option value="64">64</option>
        </select>


        <label htmlFor="current-page">Page</label>
        <select id="current-page" value={currentPage} onChange={handlePageChange}>
          {Array.from({ length: Math.ceil(numSteps / 8) }, (_, index) => (
            <option key={index} value={index}>
              {(index + 1)}
            </option>
          ))}
        </select>

        <div className="synthesizer__arpeggiator">
          <h3 className="synthesizer__arpeggiator-title">Sequencer</h3>
          <div className="synthesizer__arpeggiator-notes">
            {currentPageNotes.map((note, index) => (
              <div key={index} className="synthesizer__note-selector">
                <select
                  value={note}
                  onChange={(e) => handleNoteChange(index, e)}
                >
                  {scalesData.notes.map((noteOption, idx) => (
                    <option key={idx} value={noteOption}>
                      {noteOption}
                    </option>
                  ))}
                </select>
                <div className={noteIndex === (currentPage * 8 + index + 1) ? "active" : "circle"}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="synthesizer__play-control">
        <button className="synthesizer__play-button" onClick={handleButtonClick}>{isPlaying ? 'Stop Arpeggiator' : 'Play Arpeggiator'}</button>
      </div>
      <button className="synthesizer__play-button" onClick={randomizeNotes}>
        Randomize
      </button>
    </div>

  );
}

export default Synthesizer;