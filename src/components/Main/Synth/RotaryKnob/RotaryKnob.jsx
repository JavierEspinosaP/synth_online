import React, { useState, useRef, useEffect } from 'react';
import knobImg from '../../../../assets/knob.png';

const Knob = ({ onChange }) => {
    const [rotation, setRotation] = useState(90);
    const dragging = useRef(false);
    const prevY = useRef(0);
    const knobRef = useRef(null);
  
    const handlePointerDown = (e) => {
      e.preventDefault();
      dragging.current = true;
      prevY.current = e.clientY;
      knobRef.current.setPointerCapture(e.pointerId);
    };
  
    const handlePointerMove = (e) => {
      if (dragging.current) {
        const deltaY = prevY.current - e.clientY;
        prevY.current = e.clientY;
        setRotation((currentRotation) => {
          const newRotation = currentRotation + deltaY;
          if (newRotation >= 45 && newRotation <= 315) {
            onChange && onChange(newRotation);
            return newRotation;
          }
          return currentRotation;
        });
      }
    };
  
    const handlePointerUp = () => {
      dragging.current = false;
    };
  
    const knobStyle = {
      width: '70px',
      height: '70px',
      transform: `rotate(${rotation}deg)`,
      userSelect: 'none',
    //   transformOrigin: '40px 40px'
    };
  
    return (
      <div className="knob-container">
        <img
          ref={knobRef}
          src={knobImg}
          alt="knob"
          className="knob"
          style={knobStyle}
          draggable="false"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    );
  };
  
  export default Knob;
  
  
