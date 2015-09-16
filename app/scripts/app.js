//import 'babel/polyfill';
import React from 'react/addons';
import classNames from 'classnames';
import _ from 'lodash';
import moment from 'moment';
import "moment-duration-format";

const MS_20MIN = 20 * 60 * 1000;

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

  AnalyseTrackTitle: function (track, maxLength) {
    let title = track.title;
    let analysis = {};

    title = title.replace(/free ((download)|(dl))/gi, '');
    title = title.replace(/download/gi, '');

    // remove the artist name
    title = title.replace(new RegExp(track.user.username.replace(/\*/gi, ''), 'gi'), '');

    //// strip artist name in front
    //if (title.toLowerCase().startsWith(track.user.username.toLowerCase())) {
    //  title = title.substring(track.user.username.length)
    //}

    // strip leading symbols caused by above reduction
    title = Utilities.Trim(title, ['-', ':'], 1);

    let originalLength = title.length;

    // anything after '@' should be the location (without the @ itself)
    if (title.includes('@')) {
      let atIndex = title.indexOf('@');
      analysis.location = title.substring(atIndex + 1, title.length);

      title = title.substring(0, atIndex);
    }

    let podcast = title.match(/(-\s*)?[^\s]+cast\s?#?\d+(\s*-)?/gi);
    if (podcast) {
      podcast = podcast[0];
      title = title.replace(podcast, '');

      podcast = Utilities.Trim(podcast, ['-', ':']);
      analysis.podcast = podcast;
    }

    // strip leading symbols caused by above reduction
    title = Utilities.Trim(title, ['-', ':']);

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
  }

  componentDidMount() {
    SC.initialize({
      client_id: "59c61d3d6e2555d2b2c7235c1c0c344c",
      redirect_uri: "http://localhost:9000/callback.html"
    });


    // todo: fetch grid from server etc.
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
          this.fetchSongs();
        }
      }
    );
  }

  play(trackId) {
    SC.stream("/tracks/" + trackId, (sound) => {
      sound.play(); // todo: onfinish to kick of next track
      window.x = sound;
      this.setState({
        sound: sound,
        playingSongId: trackId
      });
    });
  }

  render() {
    const MAX_TITLE_LENGTH = 63;
    const MAX_ARTIST_LENGTH = 22;

    let content;

    if (this.state.user) {
      // console.dir(this.state.tracks[0]);


      content = this.state.tracks.map((track) => {
        let duration = moment.duration(track.duration);
        let length = duration.asHours() > 0 ? duration.format('H:mm:ss') : duration.format('m:ss');

        let date = moment(track.created_at.substr(0, 10), "YYYY/MM/DD");

        let title = Utilities.AnalyseTrackTitle(track, MAX_TITLE_LENGTH);

        let artist = Utilities.CropString(track.user.username, MAX_ARTIST_LENGTH);


        return <div className="track" key={track.id} onClick={this.play.bind(this, track.id)}>
          <div className="date" title={date.format('YYYY-MM-DD')}>
            {date.format('D-MMM')}
          </div>
          <div className="title" title={track.title}>
            {title.name}
            <span className="location">{title.location}</span>
            <span className="podcast">{title.podcast}</span>
          </div>
          <div className="artist">
            <a href={track.user.permalink_url} target="_blank" title={artist + "'s profile on SoundCloud"}>
              {artist}
            </a>
          </div>
          <div className="popularity" title={track.playback_count + " plays"}>
            <div className="bar" style={{width: Math.max(Math.log10(track.playback_count) - 2, 0) + 'rem'}}></div>
          </div>
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
