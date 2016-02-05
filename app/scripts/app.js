//import 'babel/polyfill';
import React from 'react'
import ReactDOM from 'react-dom'
import ReactUpdate from 'react-addons-update'

import SoundCloudAudio from 'soundcloud-audio';
import moment from 'moment';
import "moment-duration-format";

import AnalyseTrack from './track-analyser';
import Track from './components/track';
import ProCommands from './components/pro-commands';

const MS_20MIN = 20 * 60 * 1000;

const TRACKS_REQUEST_URL = '/me/activities';

class App extends React.Component {
  constructor() {
    super();

    this.state = {
      user: null,
      tracks: [],
      playing: null
    };

    this.podcastColorMap = {
      _length: 0
    };

    this._nextTracksUrl = TRACKS_REQUEST_URL;
    this._trackIds = [];

    this._debugging = {
      getTrackNames: () => {
        console.log(this.state.tracks.map((track) => track.title).join("\n"));
      }
    }
  }

  // hint: tokens and redirect will be replaced automatically with production version by gulp
  componentWillMount() {
    SC.initialize({
      client_id: "59c61d3d6e2555d2b2c7235c1c0c344c",
      redirect_uri: "http://localhost:9000/callback.html"
    });

    this.Player = new SoundCloudAudio('59c61d3d6e2555d2b2c7235c1c0c344c');

    window.onkeydown = (event) => {
      let keyCaught = true;

      switch (event.code) {
        case "Space":
          this.togglePlay();
          break;
        case "ArrowRight":
          if (event.shiftKey) {
            this.jumpRelative(moment.duration({ minutes: 5 }));
          } else if (event.altKey) {
            this.jumpRelative(moment.duration({ minutes: 1 }));
          } else if (event.ctrlKey) {
            this.playNext();
          }
          break;

        case "ArrowLeft":
          if (event.shiftKey) {
            this.jumpRelative(moment.duration({ minutes: -5 }));
          } else if (event.altKey) {
            this.jumpRelative(moment.duration({ minutes: -1 }));
          } else if (event.ctrlKey) {
            this.playPrevious();
          }
          break;

        case "KeyR":
          this.fetchSongs(TRACKS_REQUEST_URL, true);
          break;

        default:
          keyCaught = false;
      }

      if (keyCaught) {
        event.preventDefault();
      }
    };
  }

  _requestLogin() {
    SC.connect(() =>
      this.fetchEverything()
    )
  }

  fetchEverything() {
    this.fetchUserInformation();
    this.fetchUserLikes();
    this.fetchSongs();
  }

  fetchUserInformation() {
    SC.get('/me', (user) => this.setState({ user: user }));
  }

  fetchUserLikes() {
    SC.get('/me/favorites', (favorites) => this.setState({ likes: favorites.map((track) => track.id) }));
  }

  _markLikes() {
    let updates = {};
    this.state.tracks.forEach((track, trackIndex) => {
      // skip if likes unavailable or track already marked
      if (!this.state.likes || track.liked !== undefined) {
        return track;
      }

      let liked = this.state.likes.includes(track.id);
      updates[trackIndex] = { liked: { $set: liked }};
    });

    this.setState({ tracks: ReactUpdate(this.state.tracks, updates) });
  }

  fetchSongs(url = null, prepend = false) {
    this.setState({ isFetchingSongs: true });

    return new Promise((resolve, reject) => {
      SC.get(url || this._nextTracksUrl, {limit: 50}, (activities) => {
        let fetchedTracks = activities.collection
          .filter((activity) => activity.type === 'track' || activity.type === 'track-repost')
          .map((activity) => activity.origin)
          .filter((track) => !!track) // get rid of weird 'null' tracks (error in SC API?)
          .filter((track) => track.duration > MS_20MIN)
          .filter((track) => { // skip duplicate tracks
            if (this._trackIds.indexOf(track.id) === -1) {
              this._trackIds.push(track.id);
              return true;
            } else {
              return false;
            }
          }).map((track) => {
            track.meta = AnalyseTrack(track);
            return track;
          });

        let tracks = prepend ? fetchedTracks.concat(this.state.tracks) : this.state.tracks.concat(fetchedTracks);

        this.setState({
          isFetchingSongs: false,
          tracks: tracks
        });
        this._markLikes();

        // only update next tracks URL if no URL was passed manually
        if (!url) {
          this._nextTracksUrl = activities.next_href;
        }

        if (this.state.tracks.length < 20) {
          this.fetchSongs().then(() => resolve());
        } else {
          resolve();
        }
      });
    });
  }

  play(trackId) {
    this.Player.play({
      streamUrl: "https://api.soundcloud.com/tracks/" + trackId + "/stream"
    });
    this.setState({
      playingSongId: trackId
    });

    this.Player.on('ended', this.playNext.bind(this, null));

    this.Player.on('play', this.forceUpdate.bind(this, null));
    this.Player.on('pause', this.forceUpdate.bind(this, null));
    this.Player.on('waiting', this.forceUpdate.bind(this, null));
    this.Player.on('suspend', this.forceUpdate.bind(this, null));
    this.Player.on('stalled', this.forceUpdate.bind(this, null));
    this.Player.audio.addEventListener("timeupdate", this.forceUpdate.bind(this, null));
  }

  pause() {
    this.Player.audio.pause();
  }

  resume() {
    this.Player.audio.play();
  }

  togglePlay() {
    if (this.state.playingSongId) {
      if (this.Player.audio.paused) {
        this.resume();
      } else {
        this.pause();
      }
    } else {
      if (this.state.tracks && this.state.tracks.length) {
        this.play(this.state.tracks[0].id);
      }
    }
  }

  _getCurrentTrackIndex() {
    return this.state.tracks.findIndex((track) => track.id === this.state.playingSongId);
  }

  playNext() {
    let currentTrackIndex = this._getCurrentTrackIndex();

    if (currentTrackIndex < this.state.tracks.length - 1) {
      this.play(this.state.tracks[currentTrackIndex + 1].id);
    } else {
      this.fetchSongs().then(() => this.playNext());
    }
  }

  playPrevious() {
    let currentTrackIndex = this._getCurrentTrackIndex();

    if (currentTrackIndex > 0) {
      this.play(this.state.tracks[currentTrackIndex - 1].id);
    }
  }

  playPreviousOrRestart() {
    if (this.state.playingSongId) {
      if (this.Player.audio.currentTime > 5) {
        this.playPrevious();
      } else {
        this.restartTrack();
      }
    }
  }

  restartTrack() {
    this.Player.audio.currentTime = 0;
  }

  /**
   * Jump within track by a given amount relative to current position.
   * @param {moment.duration} difference The amount of time
   */
  jumpRelative(difference) {
    if (!moment.isDuration(difference)) {
      console.error("App.jumpRelative called with non-duration argument: ", difference);
      return;
    }

    this.Player.audio.currentTime += difference.asSeconds();
  }

  render() {
    let content;

    if (this.state.user) {
      content = [];

      content.push(
        <button id="show-pro-tips"
                key="show-pro-tips"
                onClick={() => this.setState({showProCommands: !this.state.showProCommands})}>
          {this.state.showProCommands ? 'hide' : 'show' } pro cmds
        </button>
      );
      if (this.state.showProCommands) {
        content.push(<ProCommands key="pro-commands" />);
      }

      content = content.concat(this.state.tracks.map((track) =>
        <Track track={track}
               isPlaying={track.id === this.state.playingSongId}
               audio={this.Player.audio}

               onPlay={this.play.bind(this, track.id)}
               onResume={this.resume.bind(this)}
               onPause={this.pause.bind(this)}

               key={track.id}
               onDoubleClick={this.play.bind(this, track.id)} />
      ));

      if (this.state.isFetchingSongs) {
        content.push(<div key="loading">Loading...</div>);
      } else {
        content.push(<button type="button" onClick={() => this.fetchSongs()} key="load-more">Load more</button>);
      }
    } else { // not logged in
      content = <div id="login-outer-wrapper">
        <div id="login-inner-wrapper">
          <button type="button" onClick={this._requestLogin.bind(this)}>Log in with SoundCloud</button>
        </div>
      </div>;
    }

    return <div style={{position: 'relative'}}>
      {content}
    </div>;
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
