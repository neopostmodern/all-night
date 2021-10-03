import React from 'react'

import Icons from './icons'

const COMMANDS = [
  [
    {
      keys: ['Space'],
      explanation: 'Play/Pause',
    },
    {
      keys: ['R'],
      explanation: 'Check for new tracks',
    },
    {
      keys: ['Ctrl', Icons.ArrowRight],
      explanation: 'Skip to next track',
    },
    {
      keys: ['Ctrl', Icons.ArrowLeft],
      explanation: 'Skip to previous track',
    },
  ],
  [
    {
      keys: ['Shift', Icons.ArrowRight],
      explanation: 'Skip 5 minutes ahead',
    },
    {
      keys: ['Shift', Icons.ArrowLeft],
      explanation: 'Skip 5 minutes back',
    },
    {
      keys: ['Alt', Icons.ArrowRight],
      explanation: 'Skip 1 minutes ahead',
    },
    {
      keys: ['Alt', Icons.ArrowLeft],
      explanation: 'Skip 1 minutes back',
    },
  ],
]

export default class ProCommands extends React.Component {
  render() {
    return (
      <div id='pro-tips'>
        <b>Keyboard commands for pro users</b>
        <div className='container'>
          {COMMANDS.map((commandGroup, commandGroupIndex) => (
            <div className='command-group' key={commandGroupIndex}>
              {commandGroup.map((command, commandIndex) => (
                <div className='command' key={commandIndex}>
                  <div className='keys'>
                    {command.keys.map((key, keyIndex) => (
                      <div className='key' key={keyIndex}>
                        {key}
                      </div>
                    ))}
                  </div>
                  {command.explanation}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
}
