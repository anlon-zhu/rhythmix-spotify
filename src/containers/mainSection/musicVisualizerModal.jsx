import React from "react";
import FallingRectangles from "./fallingRects";
import "./musicVisualizerModal.css"; // Import your modal CSS styles
import withPlayer from "../../hoc/playerHoc";

const MusicVisualizerModal = ({ segments, status, trackPosition }) => {
  const isPlaying = status ? !status.paused : false;

  if (!isPlaying) return null; // Only show the modal when the music is playing

  return (
    <div className="music-visualizer-modal">
      {segments ? (
        <FallingRectangles
          segments={segments}
          isPlaying={isPlaying}
          currentPlaybackTime={trackPosition ? trackPosition : 0}
        />
      ) : null}
    </div>
  );
};

export default withPlayer(MusicVisualizerModal);
