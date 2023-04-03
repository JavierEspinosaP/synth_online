import React, { useState, useRef, useEffect } from 'react';
import knobImg from '../../../../assets/knob.png';

const Knob = ({ onChange, initialValue = 40 }) => {

  const valueToRotation = (value) => {
    return (value * (315 - 45)) + 45;
  };
   
    
  const [rotation, setRotation] = useState(valueToRotation(initialValue));
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
            // Envuelve la llamada a onChange dentro de requestAnimationFrame
            requestAnimationFrame(() => {
              onChange && onChange((newRotation - 45) / (315 - 45));
            });
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
  
  
