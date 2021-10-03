import React from 'react'

import SoundCloud from 'soundcloud'
import SoundCloudAudio from 'soundcloud-audio'

import moment from 'moment'
import 'moment-duration-format'

import History from './util/history'
import Track from './components/track'
import ProCommands from './components/pro-commands'

const MS_20MIN = 20 * 60 * 1000

const TRACKS_REQUEST_URL = '/me/activities'

class App extends React.Component {
  constructor() {
    super()

    this.state = {
      user: null,
      tracks: [],
      playing: null,
    }

    this.podcastColorMap = {
      _length: 0,
    }

    this._nextTracksCursor = null
    this._trackIds = []

    this._debugging = {
      getTrackNames: () => {
        console.log(this.state.tracks.map((track) => track.title).join('\n'))
      },
    }
  }

  // hint: tokens and redirect will be replaced automatically with production version by gulp
  componentWillMount() {
    SoundCloud.initialize({
      client_id: process.env.REACT_APP_SOUNDCLOUD_ID,
      redirect_uri: process.env.REACT_APP_SOUNDCLOUD_REDIRECT,
      oauth_token:
        localStorage.getItem('soundCloudOAuthToken') ||
        process.env.REACT_APP_SOUNDCOULD_OAUTH_TOKEN,
    })

    this.Player = new SoundCloudAudio()

    // inefficient if not logged in, but falls back gracefully
    this.fetchEverything()

    window.onkeydown = (event) => {
      let keyCaught = true

      switch (event.code) {
        case 'Space':
          this.togglePlay()
          break
        case 'ArrowRight':
          if (event.shiftKey) {
            this.jumpRelative(moment.duration({ minutes: 5 }))
          } else if (event.altKey) {
            this.jumpRelative(moment.duration({ minutes: 1 }))
          } else if (event.ctrlKey) {
            this.playNext()
          }
          break

        case 'ArrowLeft':
          if (event.shiftKey) {
            this.jumpRelative(moment.duration({ minutes: -5 }))
          } else if (event.altKey) {
            this.jumpRelative(moment.duration({ minutes: -1 }))
          } else if (event.ctrlKey) {
            this.playPrevious()
          }
          break

        case 'KeyR':
          this.fetchSongs(true)
          break

        default:
          keyCaught = false
      }

      if (keyCaught) {
        event.preventDefault()
      }
    }
  }

  _soundCloudErrorHandler(action, error) {
    console.error('SoundCloud error within: ' + action, error)
  }

  _requestLogin() {
    SoundCloud.connect()
      .then(() => this.fetchEverything())
      .catch(this._soundCloudErrorHandler.bind(this, 'Connect'))
  }

  fetchEverything() {
    this.fetchUserInformation().then(this.loadHistory.bind(this, null))
    this.fetchUserLikes()
    this.fetchSongs()
  }

  loadHistory() {
    this.history = new History('plays-' + this.state.user.id)
  }

  fetchUserInformation() {
    return SoundCloud.get('/me')
      .then((user) => this.setState({ user: user }))
      .catch(this._soundCloudErrorHandler.bind(this, 'Fetch user'))
  }

  fetchUserLikes() {
    return SoundCloud.get('/me/favorites')
      .then((favorites) =>
        this.setState({ likes: favorites.map((track) => track.id) }),
      )
      .catch(this._soundCloudErrorHandler.bind(this, 'Fetch favorites'))
  }

  _markLikes() {
    const tracks = [...this.state.tracks]
    this.state.tracks.forEach((track, trackIndex) => {
      // skip if likes unavailable or track already marked
      if (!this.state.likes || track.liked !== undefined) {
        return track
      }

      let liked = this.state.likes.includes(track.id)
      if (liked !== track.liked) {
        tracks[trackIndex] = { ...tracks[trackIndex], liked }
      }
    })

    this.setState({ tracks })
  }

  fetchSongs(loadNewer = false) {
    this.setState({ isFetchingSongs: true })

    let options = { limit: 50 }
    if (!loadNewer && this._nextTracksCursor) {
      options.cursor = this._nextTracksCursor
    }

    return SC.get(TRACKS_REQUEST_URL, options)
      .then((activities) => {
        let fetchedTracks = activities.collection
          .filter(
            (activity) =>
              activity.type === 'track' || activity.type === 'track-repost',
          )
          .map((activity) => activity.origin)
          .filter((track) => !!track) // get rid of weird 'null' tracks (error in SC API?)
          .filter((track) => track.duration > MS_20MIN)
          .filter((track) => {
            // skip duplicate tracks
            if (this._trackIds.indexOf(track.id) === -1) {
              this._trackIds.push(track.id)
              return true
            } else {
              return false
            }
          })

        let tracks = loadNewer
          ? fetchedTracks.concat(this.state.tracks)
          : this.state.tracks.concat(fetchedTracks)

        this.setState({
          isFetchingSongs: false,
          tracks: tracks,
        })
        this._markLikes()

        // only update next tracks URL if no URL was passed manually
        if (!loadNewer) {
          let cursor = activities.next_href
          cursor = cursor.substr(cursor.indexOf('cursor=') + 'cursor='.length)
          this._nextTracksCursor = cursor
        }

        if (this.state.tracks.length < 20) {
          return this.fetchSongs()
        } else {
          return fetchedTracks
        }
      })
      .catch(this._soundCloudErrorHandler.bind(this, 'Fetch tracks'))
  }

  play(trackId) {
    SoundCloud.get('tracks/' + trackId + '/streams')
      .then((streams) => streams.http_mp3_128_url)
      .then((streamUrl) => {
        this.Player.play({
          streamUrl,
        })

        this.setState({
          playingSongId: trackId,
        })

        this.Player.on('ended', () => {
          // or should I use 'trackId' from local scope here?
          this.history.upgradeItem(this.state.playingSongId, 2)
          this.playNext()
        })

        this.Player.on('play', this.forceUpdate.bind(this, null))
        this.Player.on('pause', this.forceUpdate.bind(this, null))
        this.Player.on('waiting', this.forceUpdate.bind(this, null))
        this.Player.on('suspend', this.forceUpdate.bind(this, null))
        this.Player.on('stalled', this.forceUpdate.bind(this, null))
        this.Player.audio.addEventListener(
          'timeupdate',
          this.forceUpdate.bind(this, null),
        )

        this.history.upgradeItem(trackId, 1)
      })
      .catch((error) => console.error('Failed to play track', error))
  }

  pause() {
    this.Player.audio.pause()
  }

  resume() {
    this.Player.audio.play()
  }

  togglePlay() {
    if (this.state.playingSongId) {
      if (this.Player.audio.paused) {
        this.resume()
      } else {
        this.pause()
      }
    } else {
      if (this.state.tracks && this.state.tracks.length) {
        this.play(this.state.tracks[0].id)
      }
    }
  }

  _getCurrentTrackIndex() {
    return this.state.tracks.findIndex(
      (track) => track.id === this.state.playingSongId,
    )
  }

  playNext() {
    let currentTrackIndex = this._getCurrentTrackIndex()

    if (currentTrackIndex < this.state.tracks.length - 1) {
      this.play(this.state.tracks[currentTrackIndex + 1].id)
    } else {
      this.fetchSongs().then(() => this.playNext())
    }
  }

  playPrevious() {
    let currentTrackIndex = this._getCurrentTrackIndex()

    if (currentTrackIndex > 0) {
      this.play(this.state.tracks[currentTrackIndex - 1].id)
    }
  }

  playPreviousOrRestart() {
    if (this.state.playingSongId) {
      if (this.Player.audio.currentTime > 5) {
        this.playPrevious()
      } else {
        this.restartTrack()
      }
    }
  }

  restartTrack() {
    this.Player.audio.currentTime = 0
  }

  /**
   * Jump within track by a given amount relative to current position.
   * @param {moment.duration} difference The amount of time
   */
  jumpRelative(difference) {
    if (!moment.isDuration(difference)) {
      console.error(
        'App.jumpRelative called with non-duration argument: ',
        difference,
      )
      return
    }

    this.Player.audio.currentTime += difference.asSeconds()
  }

  render() {
    let content

    if (this.state.user) {
      content = []

      content.push(
        <button
          id='show-pro-tips'
          key='show-pro-tips'
          onClick={() =>
            this.setState({ showProCommands: !this.state.showProCommands })
          }
        >
          {this.state.showProCommands ? 'hide' : 'show'} pro cmds
        </button>,
      )
      if (this.state.showProCommands) {
        content.push(<ProCommands key='pro-commands' />)
      }

      content = content.concat(
        this.state.tracks.map((track) => (
          <Track
            track={track}
            isPlaying={track.id === this.state.playingSongId}
            history={this.history.getItem(track.id)}
            audio={this.Player.audio}
            onPlay={this.play.bind(this, track.id)}
            onResume={this.resume.bind(this)}
            onPause={this.pause.bind(this)}
            key={track.id}
            onDoubleClick={this.play.bind(this, track.id)}
          />
        )),
      )

      if (this.state.isFetchingSongs) {
        content.push(<div key='loading'>Loading...</div>)
      } else {
        content.push(
          <button
            id='load-more'
            type='button'
            onClick={() => this.fetchSongs()}
            key='load-more'
          >
            Load more
          </button>,
        )
      }
    } else {
      // not logged in
      content = (
        <div id='login-outer-wrapper'>
          <div id='login-inner-wrapper'>
            <button type='button' onClick={this._requestLogin.bind(this)}>
              Log in with SoundCloud
            </button>
          </div>
        </div>
      )
    }

    return <div style={{ position: 'relative' }}>{content}</div>
  }
}

export default App
