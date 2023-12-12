import React, { useState, useEffect, useRef } from "react";
import "./fallingRects.css"; // Import your CSS file

const FallingRectangles = ({ segments, isPlaying, currentPlaybackTime }) => {
  const [activeRectangles, setActiveRectangles] = useState({});
  const [score, setScore] = useState(0);
  const rectangleRefs = useRef({});

  const timersRef = useRef([]); // To handle timers
  const numberOfLanes = 8;
  const laneColors = [
    "#FFB3BA",
    "#FFDFBA",
    "#FFFFBA",
    "#BAFFC9",
    "#BAE1FF",
    "#FAB3FF",
    "#FFB3DE",
    "#B3FFD9",
  ]; // Pastel color palette

  const clearTimers = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  };

  const keyMappings = {
    a: 0,
    s: 1,
    d: 2,
    f: 3,
    j: 4,
    k: 5,
    l: 6,
    ";": 7,
  };

  const mapKeyToLane = (key) => {
    let lane = keyMappings[key];
    return Number.isInteger(lane) ? lane : null;
  };

  const maxScorePerSegment = 1000000 / segments.length; // Max score per segment

  // Score computed such that perfect score is 1000000
  const calculateScore = (distanceFromLine) => {
    const maxDistanceForScore = 20; // Adjust as needed
    if (distanceFromLine > maxDistanceForScore) return 0;

    return Math.round(
      maxScorePerSegment * (1 - distanceFromLine / maxDistanceForScore)
    );
  };

  const hitThreshold = 20; // Window in pixels to count as a hit

  const linePositionFromBottom = 30; // Assuming the line is at the bottom
  const checkRectanglePosition = (lane) => {
    let hit = false;

    Object.entries(rectangleRefs.current).forEach(
      ([rectangleId, rectElement]) => {
        if (rectElement && activeRectangles[rectangleId].lane === lane) {
          const rectBottom = rectElement.getBoundingClientRect().bottom;
          const containerBottom =
            rectElement.parentElement.getBoundingClientRect().bottom;
          const distanceFromLine =
            containerBottom - rectBottom - linePositionFromBottom;

          if (Math.abs(distanceFromLine) <= hitThreshold) {
            hit = true;
            // Calculate and update score
            const segmentScore = calculateScore(Math.abs(distanceFromLine));
            setScore((prevScore) => prevScore + segmentScore);

            // Remove the rectangle
            setActiveRectangles((prev) => {
              const updatedRects = { ...prev };
              delete updatedRects[rectangleId];
              return updatedRects;
            });
          }
        }
      }
    );

    if (!hit) {
      console.log("Missed!");
    }
  };

  useEffect(() => {
    // Clear existing timers when music is paused
    if (!isPlaying) {
      clearTimers();
      return;
    }

    // Set timers only when music is playing
    segments
      .filter((segment) => segment.confidence >= 0.5 && segment.duration > 0.1)
      .forEach((segment, index) => {
        // Block falls for 5000ms but we add 1000ms as arbitrary time due to lag
        const startTimeInMilliseconds = segment.start * 1000 - 6000;
        const rectangleId = `rect-${index}`;
        const height = segment.duration * 100; // Scale duration to height
        const lane = Math.floor(Math.random() * numberOfLanes); // Random lane assignment 1-8
        const color = laneColors[lane]; // Assign color based on lane

        // Start timer to add rectangle
        timersRef.current.push(
          setTimeout(() => {
            setActiveRectangles((prev) => ({
              ...prev,
              [rectangleId]: {
                height,
                lane,
                color,
                startTime: startTimeInMilliseconds,
              },
            }));
          }, startTimeInMilliseconds)
        );

        // End timer to remove rectangle after 5 faconds = fall + height
        timersRef.current.push(
          setTimeout(() => {
            setActiveRectangles((prev) => {
              const updatedRects = { ...prev };
              delete updatedRects[rectangleId];
              return updatedRects;
            });
          }, startTimeInMilliseconds + 5000)
        );
      });

    // Clear timers on unmount
    return () => clearTimers();
  }, [segments, isPlaying]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Determine which key was pressed and map it to a lane
      const lane = mapKeyToLane(event.key);
      if (lane !== null) {
        // Check the rectangles in this lane
        checkRectanglePosition(lane);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [activeRectangles]);

  const laneWidthPercent = 100 / Object.keys(keyMappings).length; // Width of each lane in percent

  return (
    <div className="falling-rectangles-container">
      <p>Score: {score}</p>
      {Object.entries(activeRectangles).map(
        ([rectangleId, { height, lane, color, startTime }]) => (
          <div
            ref={(el) => (rectangleRefs.current[rectangleId] = el)}
            key={rectangleId}
            className={`falling-rectangle ${isPlaying ? "" : "paused"}`}
            style={{
              height: `${height}px`,
              left: `${lane * (100 / numberOfLanes)}%`,
              backgroundColor: color,
            }}
          ></div>
        )
      )}
      <div className="key-labels-container">
        {Object.keys(keyMappings).map((key) => (
          <div
            className="key-label"
            style={{
              left: `calc(${keyMappings[key] * laneWidthPercent}% + ${
                laneWidthPercent / 2
              }% - 10px)`,
            }}
          >
            {key.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FallingRectangles;
