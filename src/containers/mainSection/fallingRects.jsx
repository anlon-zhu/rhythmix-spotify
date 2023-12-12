import React, { useState, useEffect, useRef } from "react";
import "./fallingRects.css"; // Import your CSS file

const FallingRectangles = ({ segments, isPlaying, currentPlaybackTime }) => {
  /* * * * * * * */
  /*   STATES    */
  /* * * * * * * */
  const [activeRectangles, setActiveRectangles] = useState({});
  const [score, setScore] = useState(0);
  const rectangleRefs = useRef({});
  const numberOfLanes = 8;
  const [laneFeedback, setLaneFeedback] = useState(
    Array(numberOfLanes).fill({ message: null, color: null })
  );

  /* * * * * * * */
  /*   CONSTS    */
  /* * * * * * * */
  const timersRef = useRef([]); // To handle timers
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

  /* * * * * * * */
  /*   score     */
  /* * * * * * * */

  const maxScorePerSegment = 1000000 / segments.length; // Max score per segment

  // Score computed such that perfect score is 1000000
  const calculateScore = (distanceFromLine) => {
    const maxDistanceForScore = 20; // Adjust as needed
    if (distanceFromLine > maxDistanceForScore) return 0;

    return Math.round(
      maxScorePerSegment * (1 - distanceFromLine / maxDistanceForScore)
    );
  };

  const perfectThreshold = 10; // Window in pixels to count as a perfect hit
  const goodThreshold = 30; // Window in pixels to count as a good hit
  const hitThreshold = 50; // Window in pixels to count as a hit
  const linePositionFromBottom = 40; // Assuming the line is at the bottom
  const checkRectanglePosition = (lane) => {
    Object.entries(rectangleRefs.current).forEach(
      ([rectangleId, rectElement]) => {
        if (rectElement && activeRectangles[rectangleId].lane === lane) {
          const rectBottom = rectElement.getBoundingClientRect().bottom;
          console.log("rect", rectBottom);
          const containerBottom =
            rectElement.parentElement.getBoundingClientRect().bottom;
          console.log("cont", containerBottom);
          const distanceFromLine = Math.abs(
            containerBottom - rectBottom - linePositionFromBottom
          );
          console.log(distanceFromLine);

          var feedbackMessage;

          if (distanceFromLine <= hitThreshold) {
            // Calculate and update score
            const segmentScore = calculateScore(Math.abs(distanceFromLine));
            setScore((prevScore) => prevScore + segmentScore);

            // Inside checkRectanglePosition, after determining hit accuracy
            if (distanceFromLine <= perfectThreshold) {
              feedbackMessage = { message: "Perfect!", color: "green" };
              console.log("perfect");
            } else if (distanceFromLine <= goodThreshold) {
              feedbackMessage = { message: "Good!", color: "yellow" };
              console.log("good");
            } else {
              feedbackMessage = { message: "Missed!", color: "gray" };
            }

            // Remove the rectangle
            setActiveRectangles((prev) => {
              const updatedRects = { ...prev };
              delete updatedRects[rectangleId];
              return updatedRects;
            });
          } else {
            // Provide feedback but don't remove
            feedbackMessage = { message: "Missed!", color: "gray" };
          }

          setLaneFeedback((prevFeedback) => {
            const newFeedback = [...prevFeedback];
            newFeedback[lane] = feedbackMessage;
            return newFeedback;
          });

          setTimeout(() => {
            setLaneFeedback((prevFeedback) => {
              const newFeedback = [...prevFeedback];
              newFeedback[lane] = { message: null, color: null };
              return newFeedback;
            });
          }, 1000); // Match this duration with the CSS animation
        }
      }
    );
  };

  /* * * * * * * */
  /*   EFFECTS   */
  /* * * * * * * */

  /* * * * * * * */
  /*   display   */
  /* * * * * * * */
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
        const height = 30; // Scale duration to height
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
          }, startTimeInMilliseconds + 6000)
        );
      });

    // Clear timers on unmount
    return () => clearTimers();
  }, [segments, isPlaying]);

  /* * * * * * * */
  /*  keypress   */
  /* * * * * * * */
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
      {laneFeedback.map((feedback, index) => (
        <div
          key={`${index}-${feedback.message}`}
          className={`lane-feedback ${feedback.message ? "visible" : ""}`}
          style={{
            left: `${index * (100 / numberOfLanes)}%`,
            color: feedback.message ? `${feedback.color}` : "none",
          }}
        >
          {feedback.message}
        </div>
      ))}
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
