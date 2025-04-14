import React from "react";
import {
  FaLeaf,
  FaInfoCircle,
  FaArrowsAlt,
  FaExclamationTriangle,
  FaQuestion,
  FaChartLine,
} from "react-icons/fa";

const ControlPanel = ({
  gridSizes,
  selectedGridSize,
  onGridSizeChange,
  showStressedAreas,
  onToggleStressedAreas,
  pointCount = 0,
  hotspotCount = 0,
  avgStress = "0.0",
}) => {
  return (
    <div className="control-panel">
      <h3>
        <FaArrowsAlt style={{ marginRight: "8px" }} /> Visualization Controls
      </h3>

      <div className="control-item">
        <label>
          Grid Resolution (cm)
          <span className="tooltip">
            <FaQuestion size={12} />
            <span className="tooltip-text">
              Controls the detail level of the heatmap visualization
            </span>
          </span>
        </label>
        <div className="grid-size-selector">
          {gridSizes.map((size) => (
            <button
              key={size}
              className={`grid-size-option ${
                selectedGridSize === size ? "selected" : ""
              }`}
              onClick={() => onGridSizeChange(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="control-item">
        <div className="toggle-container">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={showStressedAreas}
              onChange={onToggleStressedAreas}
            />
            <span className="slider"></span>
          </label>
          <span>
            <FaExclamationTriangle
              style={{ color: "#ff6e40", marginRight: "8px" }}
            />{" "}
            Highlight Stress Hotspots
            <span className="tooltip">
              <FaQuestion size={12} />
              <span className="tooltip-text">
                Shows areas with stress levels above 70%
              </span>
            </span>
          </span>
        </div>
      </div>

      <div className="control-item">
        <label>
          <FaInfoCircle style={{ marginRight: "8px" }} /> Color Legend
        </label>
        <div className="color-legend">
          <div className="gradient-bar"></div>
          <div className="legend-labels">
            <span>High Stress</span>
            <span>Low Stress</span>
          </div>
        </div>
      </div>

      <div className="control-item">
        <div className="data-summary">
          <div className="summary-header">
            <FaChartLine style={{ marginRight: "8px", color: "#43a047" }} />
            <span>Data Analysis</span>
          </div>
          <div className="summary-content">
            <div className="data-row">
              <span>Total Points:</span>
              <span className="data-value">{pointCount}</span>
            </div>
            <div className="data-row">
              <span>Hotspots:</span>
              <span className="data-value">{hotspotCount}</span>
            </div>
            <div className="data-row">
              <span>Avg. Stress:</span>
              <span className="data-value">{avgStress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="control-item footer" style={{ marginTop: "30px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <FaLeaf style={{ color: "#43a047", marginRight: "8px" }} />
          <div>
            <strong>Field Analysis Tool</strong>
            <br />
            <small>Using Cloud Optimized GeoTIFFs</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
