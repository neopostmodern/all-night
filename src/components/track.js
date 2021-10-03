import React from "react";
import ClassNames from "classnames"

import moment from 'moment';
import "moment-duration-format";

import FestivalAnalyser from "../util/venue-analyser";
import Utilities from "../util/util";
import ColorOnDemand from "../util/colors-on-demand"

import SoundCloudLogo from '../images/sc/logo.png'
import FusionIcon from '../images/festivals/fusion.png'
import KaterIcon from '../images/festivals/katerblau.png'
import AboutBlankIcon from '../images/festivals/aboutblank.png'
import FeelIcon from '../images/festivals/feel.png'
import ThreeThousandIcon from '../images/festivals/3000.png'
import PloetzlichIcon from '../images/festivals/ploetzlich.png'
import BurningManIcon from '../images/festivals/burning-man.png'
import DimensionsIcon from '../images/festivals/dimensions.png'

const FESTIVAL_ICONS = {
  'fusion': FusionIcon,
  'kater': KaterIcon,
  'aboutblank': AboutBlankIcon,
  'feel': FeelIcon,
  '3000-grad': ThreeThousandIcon,
  'ploetzlich': PloetzlichIcon,
  'burning-man': BurningManIcon,
  'dimensions': DimensionsIcon
};

function formatDuration(duration) {
  if (duration.hours() > 0) {
    return duration.format('H:mm:ss');
  } else {
    return duration.format('m:ss', {trim: false});
  }
}

var Track = (props) => {
  let track = props.track;
  let meta = track.meta;

  let duration = moment.duration(track.duration);
  let length = formatDuration(duration);

  let date = moment(track.created_at.substr(0, 10), "YYYY/MM/DD");

  let venue;
  if (meta.venue) {
    let venue_name = FestivalAnalyser.getName(meta.venue);
    let icon = FESTIVAL_ICONS[meta.venue];
    if (icon) {
      venue = <img className="venue" src={icon} alt={venue_name} title={venue_name} />
    } else {
      venue = <b className="venue">{venue_name}</b>;
    }
  }

  let context_information = [];
  if (meta.location) {
    context_information.push(<span className="location" key={track.id + '-loc'}>{meta.location}</span>);
  }
  if (meta.live) {
    context_information.push(
      <span className="podcast live" key="live">
              live
            </span>
    );
  }
  if (meta.date) {
    context_information.push(
      <span className="podcast title-date" key="date">
              {meta.date}
            </span>
    );
  }
  if (meta.podcast) {
    context_information.push(
      <span className="podcast"
            key={track.id + '-pod'}
            title={meta.podcast.name}
            style={{backgroundColor: ColorOnDemand(meta.podcast.name)}}>
              #{meta.podcast.number}
            </span>
    );
  }

  let leadingField;
  if (props.isPlaying) {
    if (props.audio.paused) {
      leadingField = <div className="action" onClick={props.onResume}>play</div>;
    } else {
      // todo: distinguish buffering/stuck and playing
      leadingField = <div className="action" onClick={props.onPause}>pause</div>;
    }
  } else {
    leadingField = [
      <div key={track.id + '-date'} className="date" title={date.format('YYYY-MM-DD')}>{date.format('D-MMM')}</div>,
      <div key={track.id + '-action'} className="action" onClick={props.onPlay}>play</div>
    ];
  }

  let classes = ClassNames("track", { 'active': props.isPlaying });

  let popularityOrProgress = <div className="popularity" title={track.playback_count + " plays"}>
    <div className="bar" style={{width: Math.max(Math.log10(track.playback_count) - 2, 0) + 'rem'}} />
  </div>;
  if (props.isPlaying) {
    let formattedProgress = formatDuration(moment.duration(props.audio.currentTime * 1000));
    popularityOrProgress = <div className="progress">
      {formattedProgress} /
    </div>;
  }

  let userRelation;
  if (props.history === 1) {
    userRelation = <i className="material-icons" style={{color: 'gray'}} title="You've heard part of this track">done</i>;
  } else if (props.history === 2) {
    userRelation = <i className="material-icons" style={{color: 'gray'}} title="You've heard this track">done_all</i>;
  }

  // allowed to override anything
  if (track.liked) {
    userRelation = <i className="material-icons" style={{color: 'darkred'}} title="You've favorited this track">favorite</i>;
  }

  return <div className={classes}>
    {venue}
    {leadingField}
    <div className="title" title={track.title}>
      {meta.name ? meta.name : <span className="untitled">&lt;untitled&gt;</span>}
    </div>
    {context_information}
    <div className="user-relation">
      {userRelation}
    </div>
    <div className="artist">
      <a href={track.user.permalink_url} target="_blank" title={track.user.username + "'s profile on SoundCloud"}>
        {track.user.username}
      </a>
    </div>
    {popularityOrProgress}
    <div className="duration">{length}</div>
    <div className="origin">
      <a href={track.permalink_url} target="_blank" title="Go to track on SoundCloud">
        <img src={SoundCloudLogo} alt='SoundCloud Logo' />
      </a>
    </div>
  </div>;
};

export default Track;