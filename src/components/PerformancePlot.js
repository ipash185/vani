import React from 'react';
import { motion } from 'framer-motion';
import './PerformancePlot.css';

const PerformancePlot = ({ accuracy, clarity }) => {
  // Errors are the inverse of the score (e.g., 90% accuracy -> 10% error)
  const accuracyError = 100 - accuracy;
  const clarityError = 100 - (clarity * 100);

  // Define the plot dimensions
  const plotSize = 200;
  const center = plotSize / 2;
  const maxRadius = plotSize / 2 - 10; // Leave some padding
  const targetRadius = maxRadius * 0.2; // Target is < 20% error

  // Calculate the total error magnitude (distance from center)
  // We use the hypotenuse of the two errors. Max possible error is sqrt(100^2 + 100^2) ~= 141.4
  const errorMagnitude = Math.sqrt(Math.pow(accuracyError, 2) + Math.pow(clarityError, 2));
  const maxPossibleError = Math.sqrt(2 * Math.pow(100, 2));
  
  // Map the error magnitude to the plot's radius
  const r = (errorMagnitude / maxPossibleError) * maxRadius;

  // Calculate the angle based on the ratio of the two errors
  const angle = Math.atan2(clarityError, accuracyError);

  // Convert polar coordinates (r, angle) to Cartesian coordinates (x, y)
  const x = center + r * Math.cos(angle);
  const y = center - r * Math.sin(angle); // Subtract for y because SVG y-axis is inverted

  const isInTarget = errorMagnitude <= (0.2 * maxPossibleError);

  return (
    <div className="performance-plot-container">
      <h4>Performance Plot</h4>
      <div className="plot-area">
        <svg width={plotSize} height={plotSize} viewBox={`0 0 ${plotSize} ${plotSize}`}>
          {/* Concentric background circles */}
          <circle cx={center} cy={center} r={maxRadius * 1.0} className="grid-circle" />
          <circle cx={center} cy={center} r={maxRadius * 0.75} className="grid-circle" />
          <circle cx={center} cy={center} r={maxRadius * 0.5} className="grid-circle" />
          <circle cx={center} cy={center} r={maxRadius * 0.25} className="grid-circle" />

          {/* Target Region */}
          <motion.circle
            cx={center}
            cy={center}
            r={targetRadius}
            className="target-region"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />

          {/* Axes */}
          <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} className="axis-line" />
          <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} className="axis-line" />

          {/* Labels */}
          <text x={center + maxRadius - 15} y={center + 15} className="axis-label">Accuracy</text>
          <text x={center - 15} y={center - maxRadius + 10} className="axis-label">Clarity</text>

          {/* User's Performance Point */}
          <motion.circle
            cx={x}
            cy={y}
            r={6}
            className={`performance-dot ${isInTarget ? 'in-target' : 'out-of-target'}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
          />
        </svg>
      </div>
      <div className="plot-legend">
        <div className="legend-item">
          <div className="legend-color target-region-legend"></div>
          <span>Target Zone</span>
        </div>
        <div className="legend-item">
          <div className={`legend-color performance-dot ${isInTarget ? 'in-target' : 'out-of-target'}`}></div>
          <span>Your Score</span>
        </div>
      </div>
    </div>
  );
};

export default PerformancePlot;
