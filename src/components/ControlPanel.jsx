import React from "react";

const ControlPanel = ({
  gridSizes,
  selectedGridSize,
  onGridSizeChange,
  showStressedAreas,
  onToggleStressedAreas,
}) => {
  return (
    <div className="control-panel">
      <h3>Spinach Field Stress Visualization</h3>

      <div className="control-item">
        <label>Grid Size:</label>
        <select
          value={selectedGridSize}
          onChange={(e) => onGridSizeChange(Number(e.target.value))}
        >
          {gridSizes.map((size) => (
            <option key={size} value={size}>
              {size}cm
            </option>
          ))}
        </select>
      </div>

      <div className="control-item">
        <label>
          <input
            type="checkbox"
            checked={showStressedAreas}
            onChange={() => onToggleStressedAreas()}
          />
          Highlight Stressed Areas
        </label>
      </div>

      <div className="legend">
        <h4>Stress Level</h4>
        <div className="legend-gradient"></div>
        <div className="legend-labels">
          <span>High Stress</span>
          <span>Low Stress</span>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
