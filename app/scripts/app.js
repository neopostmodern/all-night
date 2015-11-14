//import 'babel/polyfill';
import React from 'react/addons';
import SoundCloudAudio from 'soundcloud-audio';
import classNames from 'classnames';
import _ from 'lodash';
import moment from 'moment';
import "moment-duration-format";

const MS_20MIN = 20 * 60 * 1000;
// all .lighten-3 from http://materializecss.com/color.html
const COLORS = [
  '#ef9a9a',
  '#b39ddb',
  '#ffcc80',
  '#c5e1a5',
  '#90caf9',
  '#fff59d',
  '#80deea',
  '#f48fb1',
  '#a5d6a7',
  '#9fa8da',
  '#e6ee9c',
  '#81d4fa',
  '#ffe082',
  '#80cbc4',
  '#ce93d8',
  '#ffab91'
];

const Utilities = {
  CropString: function (string, maximumLength) {
    if (string.length > maximumLength) {
      return string.substring(0, maximumLength - 3) + "...";
    }

    return string;
  },

  Trim: function (string, characters, type = 0, trimBeforeAndAfter = true) {
    if (trimBeforeAndAfter) {
      string = string.trim();
    }

    characters.forEach((character) => {
      if (string.startsWith(character) && type != 2) {
        string = string.substring(1);
      }
      if (string.endsWith(character) && type != 1) {
        string = string.substring(0, string.length - 1);
      }
    });

    if (trimBeforeAndAfter) {
      string = string.trim();
    }

    return string;
  },

  AnalyseTrackTitle: function (track) {
    let title = track.title;
    let analysis = {};

    if (title.includes('Montagssorbet')) {
      let number = parseInt(title.match(/#\d+/gi)[0].substring(1));
      title = title.replace(/Montagssorbet mit Laut & Luise - #\d+:/, "");

      analysis.podcast = {
        name: "Montagssorbet",
        number: number
      };
    } else if (title.includes('Das Haett Es Frueher Nicht Gegeben')) {
      let number = parseInt(title.match(/#\d+/i)[0].substring(1));
      title = title.replace(/Das Haett Es Frueher Nicht Gegeben #\d+/, "");
      analysis.podcast = {
        name: "'Das Haett Es Fruher Nicht Gegeben' Podcast",
        number: number
      };
    } else if (title.includes('Seasidetrip')) {
      let number = parseInt(title.match(/Seasidetrip \d+/i)[0].substring(12));
      title = title.replace(/Seasidetrip \d+ by/i, "");
      analysis.podcast = {
        name: 'Seasidetrip',
        number: number
      };
    } else if (title.includes('Jakarta Radio')) {
      let number = parseInt(title.match(/Jakarta Radio \d+/i)[0].substring(14));
      title = title.replace(/Jakarta Radio \d+:/i, "");
      analysis.podcast = {
        name: 'Jakarta Radio',
        number: number
      };
    } else if (title.includes('Radio Juicy Vol')) {
      let number = parseInt(title.match(/Radio Juicy Vol\. \d+/i)[0].substring(17));
      title = title.replace(/Radio Juicy Vol\. \d+/i, "");
      analysis.podcast = {
        name: 'Radio Juicy',
        number: number
      };
    }

    title = title.replace(/free ((download)|(dl))/gi, '');
    title = title.replace(/download/gi, '');
    title = title.replace(/tracklist( available)?/gi, '');

    // remove the artist name, with some creativity
    let artist_name_regex = track.user.username
      .replace(/\*/gi, '')
      .replace(/[\s_-]/g, '[\\s_-]?');

    title = title.replace(new RegExp(artist_name_regex, 'gi'), '');

    // strip leading symbols caused by above reduction
    title = Utilities.Trim(title, ['-', ':'], 1);

    // anything after '@' should be the location (without the @ itself)
    if (title.includes('@')) {
      let atIndex = title.indexOf('@');
      let location = title.substring(atIndex + 1, title.length);
      location = Utilities.Trim(location, ['-', ':']);
      analysis.location = location;

      title = title.substring(0, atIndex);
    }

    let podcast = title.match(/(-\s*)?[^-]+cast\s?#?\d+(\s*(-|(by)))?/gi);
    if (podcast) {
      podcast = podcast[0];
      title = title.replace(podcast, '');

      let name = podcast.match(/[^-]+cast/gi)[0].trim();
      if (name.toLowerCase() == 'podcast') {
        name = track.user.username + " Podcast";
      }

      let number = parseInt(podcast.match(/#?\d+/)[0].replace('#', ''));

      analysis.podcast = {
        name: name,
        number: number
      };
    }

    // remove empty brackets, braces etc.
    title = title.replace(/[(\(\))|(\[\])]/g, '');
    // strip leading symbols caused by above reductions
    title = Utilities.Trim(title, ['-', ':', '|']);

    // if only the word 'live' remains, remove
    if (title.toLowerCase() === 'live' || title.toLowerCase() === 'liveset') {
      title = '';
    }

    if (analysis.location) {
      analysis.location = Utilities.CropString(analysis.location, title.length > 30 ? 20 : 40);
    }

    title = Utilities.CropString(title, analysis.location ? 60 - analysis.location.length : 60);

    analysis.name = title.length > 0 ? title : <span className="untitled">&lt;untitled&gt;</span>;

    return analysis;
  }
};

class App extends React.Component {
  constructor() {
    super();

    this.state = {
      user: null,
      tracks: [],
      nextTracksUrl: '/me/activities',
      playing: null
    };

    this.podcastColorMap = {
      _length: 0
    };
  }

  // hint: tokens and redirect will be replaced automatically with production version by gulp
  componentWillMount() {
    SC.initialize({
      client_id: "59c61d3d6e2555d2b2c7235c1c0c344c",
      redirect_uri: "http://localhost:9000/callback.html"
    });

    this.Player = new SoundCloudAudio('59c61d3d6e2555d2b2c7235c1c0c344c');

    window.onkeydown = (event) => {
      event.preventDefault();

      if (event.code === "Space") {
        this.togglePlay();
        return;
      }

      switch (event.code) {
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
    this.fetchSongs();
  }

  fetchUserInformation() {
    SC.get('/me', (user) => this.setState({ user: user }));
  }

  fetchSongs() {
    this.setState({ isFetchingSongs: true });

    return new Promise((resolve, reject) => {
      SC.get(this.state.nextTracksUrl, {limit: 50}, (activities) => {
          let tracks = this.state.tracks.concat(
            activities.collection
              .filter((activity) => activity.type === 'track' || activity.type === 'track-repost')
              .map((activity) => activity.origin)
              .filter((track) => track.duration > MS_20MIN)
          );

          this.setState({
            isFetchingSongs: false,
            nextTracksUrl: activities.next_href,
            tracks: tracks
          });

          if (this.state.tracks.length < 20) {
            this.fetchSongs().then(() => resolve());
          } else {
            resolve();
          }
        }
      );

    });
  }

  play(trackId) {
    this.Player.play({
      streamUrl: "https://api.soundcloud.com/tracks/" + trackId + "/stream"
    });
    this.setState({
      playingSongId: trackId
    });

    this.Player.on('ended', function () {
      this.playNext();
    });

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
    const MAX_ARTIST_LENGTH = 22;
    let formatDuration = (duration) => {
      if (duration.hours() > 0) {
        return duration.format('H:mm:ss');
      } else {
        return duration.format('m:ss', {trim: false});
      }
    };

    let getColorForPodcast = ((podcastName) => {
      if (! this.podcastColorMap[podcastName]) {
        this.podcastColorMap[podcastName] = COLORS[this.podcastColorMap._length % COLORS.length];
        this.podcastColorMap._length += 1;
      }

      return this.podcastColorMap[podcastName];
    }).bind(this);

    let content;

    if (this.state.user) {
      // console.dir(this.state.tracks[0]);


      content = this.state.tracks.map((track) => {
        let isTrackPlaying = track.id === this.state.playingSongId;

        let duration = moment.duration(track.duration);
        let length = formatDuration(duration);

        let date = moment(track.created_at.substr(0, 10), "YYYY/MM/DD");

        let title = Utilities.AnalyseTrackTitle(track);
        let title_decorators = [];
        if (title.location) {
          title_decorators.push(<span className="location" key={track.id + '-loc'}>{title.location}</span>);
        }
        if (title.podcast) {
          title_decorators.push(
            <span className="podcast"
                  key={track.id + '-pod'}
                  title={title.podcast.name}
                  style={{backgroundColor: getColorForPodcast(title.podcast.name)}}>
              #{title.podcast.number}
            </span>
          );
        }

        let artist = Utilities.CropString(track.user.username, MAX_ARTIST_LENGTH);

        let leadingField;
        if (isTrackPlaying) {
          if (this.Player.audio.paused) {
            leadingField = <div className="action" onClick={this.resume.bind(this)}>play</div>;
          } else {
            if (false) { // todo: distinguish buffering/stuck and playing
              leadingField = <div className="action">... ({this.Player.audio.readyState})</div>;
            } else {
              leadingField = <div className="action" onClick={this.pause.bind(this)}>pause</div>;
            }
          }
        } else {
          leadingField = [
            <div key={track.id + '-date'} className="date" title={date.format('YYYY-MM-DD')}>{date.format('D-MMM')}</div>,
            <div key={track.id + '-action'}className="action" onClick={this.play.bind(this, track.id)}>play</div>
          ];
        }

        let classes = classNames("track", { 'active': isTrackPlaying });

        let popularityOrProgress = <div className="popularity" title={track.playback_count + " plays"}>
          <div className="bar" style={{width: Math.max(Math.log10(track.playback_count) - 2, 0) + 'rem'}}></div>
        </div>;
        if (isTrackPlaying) {
          let formattedProgress = formatDuration(moment.duration(this.Player.audio.currentTime * 1000));
          popularityOrProgress = <div className="progress">
            {formattedProgress} /
          </div>;
        }

        return <div className={classes} key={track.id} onDoubleClick={this.play.bind(this, track.id)}>
          {leadingField}
          <div className="title" title={track.title}>
            {title.name}
            {title_decorators}
          </div>
          <div className="artist">
            <a href={track.user.permalink_url} target="_blank" title={artist + "'s profile on SoundCloud"}>
              {artist}
            </a>
          </div>
          {popularityOrProgress}
          <div className="duration">{length}</div>
          <div className="origin">
            <a href={track.permalink_url} target="_blank" title="Go to track on SoundCloud">
              <img src="/images/sc/logo.png" />
            </a>
          </div>
        </div>
      });
      if (this.state.isFetchingSongs) {
        content.push(<div key="loading">Loading...</div>);
      } else {
        content.push(<button type="button" onClick={this.fetchSongs.bind(this)} key="load-more">Load more</button>);
      }
    } else { // not logged in
      content = <div id="login-outer-wrapper">
        <div id="login-inner-wrapper">
          <button type="button" onClick={this._requestLogin.bind(this)}>Log in with SoundCloud</button>
        </div>
      </div>;
    }

    return <div>{content}</div>;
  }
}

React.render(<App />, document.getElementById('app'));
