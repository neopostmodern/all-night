import React from "react";
import ClassNames from "classnames"

import moment from 'moment';
import "moment-duration-format";

import FestivalAnalyser from "../venue-analyser";
import Utilities from "../util";
import ColorOnDemand from "../colors-on-demand"

// todo: remove & replace by CSS
const MAX_ARTIST_LENGTH = 22;

const FESTIVAL_ICONS = {
  'fusion': 'images/festivals/fusion.png',
  'kater': 'images/festivals/katerblau.png',
  'aboutblank': 'images/festivals/aboutblank.png',
  'feel': 'images/festivals/feel.png',
  '3000-grad': 'images/festivals/3000.png',
  'ploetzlich': 'images/festivals/ploetzlich.png',
  'burning-man': 'images/festivals/burning-man.png',
  'dimensions': 'images/festivals/dimensions.png'
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
      <div key={track.id + '-action'}className="action" onClick={props.onPlay}>play</div>
    ];
  }

  let classes = ClassNames("track", { 'active': props.isPlaying });

  let popularityOrProgress = <div className="popularity" title={track.playback_count + " plays"}>
    <div className="bar" style={{width: Math.max(Math.log10(track.playback_count) - 2, 0) + 'rem'}}></div>
  </div>;
  if (props.isPlaying) {
    let formattedProgress = formatDuration(moment.duration(props.audio.currentTime * 1000));
    popularityOrProgress = <div className="progress">
      {formattedProgress} /
    </div>;
  }

  let userRelation;
  if (track.liked) {
    userRelation = <i className="material-icons" style={{color: 'darkred'}}>favorite</i>;
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
        <img src="/images/sc/logo.png" />
      </a>
    </div>
  </div>;
};

export default Track;