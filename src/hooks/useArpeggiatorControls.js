import { useState, useCallback } from 'react';
import _ from 'lodash';

const useArpeggiatorControls = (initialBpm, initialGain, initialEnvelope) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [gainValue, setGainValue] = useState(initialGain);
  const [envelope, setEnvelope] = useState(initialEnvelope);
  const [delayTime, setDelayTime] = useState(0);
  const [delayFeedback, setDelayFeedback] = useState(0);
  const [reverbLevel, setReverbLevel] = useState(0);
  const [reverbDecay, setReverbDecay] = useState(1.5);

  const bpmToRotation = (bpmValue) => {
    return ((bpmValue - 150) / (300 - 0)) + 0;
  };

  const handleBpmKnobChange = (rotationRatio) => {
    const newBpm = rotationRatio * (300 - 0) + 150;
    setBpm(newBpm);
  };

  const gainToRotation = (gainValue) => {
    return gainValue * 2.1;
  };

  const handleGainKnobChange = (rotation) => {
    setGainValue(rotation / 2.1);
  };

  const attackToRotation = (attackValue) => {
    const attackMs = attackValue / 8; // Convertir el valor de attack a milisegundos
    return (Math.log(attackMs) - Math.log(0.001)) / (Math.log(10) - Math.log(0.001));
  };

  const handleAttackKnobChange = (value) => {
    setEnvelope({ ...envelope, attack: value });
  };

  const handleDecayKnobChange = (value) => {
    setEnvelope({ ...envelope, decay: value });
  };

  const handleSustainKnobChange = (value) => {
    setEnvelope({ ...envelope, sustain: value });
  };

  const handleDelayTimeKnobChange = _.debounce((value) => {
    setDelayTime(value);
  }, 200)

  const handleDelayFeedbackKnobChange = _.debounce((value) => {
    setDelayFeedback(value);
  }, 200)

  return {
    bpm,
    gainValue,
    envelope,
    delayTime,
    delayFeedback,
    reverbLevel,
    reverbDecay,
    setBpm,
    setGainValue,
    setEnvelope,
    setDelayTime,
    setDelayFeedback,
    setReverbLevel,
    setReverbDecay,
    bpmToRotation,
    gainToRotation,
    attackToRotation,
    handleBpmKnobChange,
    handleGainKnobChange,
    handleAttackKnobChange,
    handleDecayKnobChange,
    handleSustainKnobChange,
    handleDelayTimeKnobChange,
    handleDelayFeedbackKnobChange

  };
};

export default useArpeggiatorControls