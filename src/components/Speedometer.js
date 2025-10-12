import React from 'react';
import { motion } from 'framer-motion';
import './Speedometer.css';

const Speedometer = ({ speed }) => {
  // Clamp speed between 0 and 2 for rotation calculation
  const clampedSpeed = Math.max(0, Math.min(2, speed));
  
  // Map speed (0-2) to rotation (-90 to 90 degrees)
  const rotation = (clampedSpeed - 1) * 90;

  let speedLabel;
  if (clampedSpeed < 0.8) {
    speedLabel = 'Too Slow';
  } else if (clampedSpeed > 1.2) {
    speedLabel = 'Too Fast';
  } else {
    speedLabel = 'Perfect';
  }

  return (
    <div className="speedometer-container">
      <h4>Speaking Speed</h4>
      <div className="gauge-area">
        <div className="gauge">
          <div className="gauge-background"></div>
          <motion.div
            className="gauge-needle"
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          ></motion.div>
          <div className="gauge-center-dot"></div>
        </div>
      </div>
      <div className="speed-labels">
        <span>Slow</span>
        <span>Normal</span>
        <span>Fast</span>
      </div>
      <div className="current-speed-value">
        {speed.toFixed(1)}x
        <div className={`speed-indicator ${speedLabel.toLowerCase().replace(' ', '-')}`}>{speedLabel}</div>
      </div>
    </div>
  );
};

export default Speedometer;
