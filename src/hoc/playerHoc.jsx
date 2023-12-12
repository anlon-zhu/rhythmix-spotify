import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {
  nextSong,
  previousSong,
  pauseSong,
  playSong,
  seekSong,
  shuffle,
  repeatContext,
  getSegments,
} from "../store/actions/playerActions";

import { containsCurrentSong } from "../store/actions/libraryActions";

export default function (ComposedComponent) {
  class PlayerHoc extends Component {
    shouldComponentUpdate(nextProps) {
      return nextProps.playing || (this.props.playing && !nextProps.playing);
    }

    componentDidUpdate(prevProps) {
      if (
        prevProps.currentSong.id !== this.props.currentSong.id ||
        (!prevProps.playing && this.props.playing)
      ) {
        const id = this.props.currentSong.id;
        const other = this.props.currentSong.linked_from
          ? this.props.currentSong.linked_from.id
          : null;
        this.props.containsCurrentSong(other ? `${id},${other}` : id);

        // Dispatch getSegments action when a new song is loaded
        if (id) {
          this.props.getSegments(id);
        }
      }
    }

    render = () => (
      <ComposedComponent
        {...this.props}
        playContext={(context, offset) => this.props.playSong(context, offset)}
        playSong={() => this.props.playSong()}
      />
    );
  }

  const mapStateToProps = (state) => {
    return {
      currentSong: state.playerReducer.status
        ? state.playerReducer.status.track_window.current_track
        : {},
      contains: state.libraryReducer.containsCurrent ? true : false,
      trackPosition: state.playerReducer.status
        ? state.playerReducer.status.position
        : 0,
      playing: state.playerReducer.status
        ? !state.playerReducer.status.paused
        : false,
      shuffleActive: state.playerReducer.status
        ? state.playerReducer.status.shuffle
        : false,
      repeatActive: state.playerReducer.status
        ? state.playerReducer.status.repeat_mode !== 0
        : false,
      segments: state.playerReducer.segments,
    };
  };

  const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
      {
        nextSong,
        previousSong,
        pauseSong,
        playSong,
        seekSong,
        shuffle,
        repeatContext,
        containsCurrentSong,
        getSegments,
      },
      dispatch
    );
  };

  return connect(mapStateToProps, mapDispatchToProps)(PlayerHoc);
}
