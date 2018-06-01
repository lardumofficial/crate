/**
 * RavenJS logging
 */
const Raven = require('raven-js')
Raven.config('https://60c8644853c540649cfdf0fe4a30bfe4@sentry.io/287303', {
  whitelistUrls: [/widgetbot\.io/, /crate\.widgetbot\.io/, /localhost:3100/],
  includePaths: [/https?:\/\/crate.widgetbot\.io/]
}).install()

declare var window: any
import { Config } from './definitions/config'
import { Notifications } from './definitions/notifications'
import * as ReactDOM from 'react-dom'
import * as React from 'react'
const MatomoTracker = require('matomo-tracker')

import { Renderer } from './Renderer'
import DeepMerge from './components/DeepMerge'
import ParseConfig from './components/Config'
import log from './components/Log'
import { Icons } from './components/Icons'
import jss from './jss/App'

Raven.context(() => {
  // Crate sandbox
  let global = (window.globalCrate = {
    insertionPoint: /* :smirk: */ document.createElement('div'),
    sessions: 0,
    event: (
      state: any,
      data: {
        category: string
        action: string
        name?: string
        content?: {
          name: string
          path: string
        }
      }
    ) => {
      if (!state || state.config.analytics) {
        let req: any = {
          e_c: data.category,
          e_a: data.action
        }
        if (data.name) req.e_n = data.name
        if (data.content) {
          req.c_n = data.content.name
          req.c_p = data.content.path
        }
        global.track(req)
      }
    },
    track: (data: Object) => {
      global.matomo.track({
        url: window.location.href,
        rand: (
          Math.floor(Math.pow(10, 15) + Math.random() * 9 * Math.pow(10, 15)) +
          +new Date()
        ).toString(),
        ...data
      })
    },
    matomo: new MatomoTracker(2, 'https://analytics.widgetbot.io/php', true)
    // ReactGA: require('react-ga')
  })
  global.insertionPoint.setAttribute(
    'documentation',
    'https://docs.widgetbot.io'
  )
  global.insertionPoint.classList.add('crate')
  // Wait for the DOM to load before inserting
  if (document.body) {
    document.body.appendChild(global.insertionPoint)
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(global.insertionPoint)
    })
  }

  // Crate console message
  console.log(
    `%c+%chttps://crate.widgetbot.io\n%c\u2604\uFE0F Popup Discord chat widgets for your website.`,
    `font-size: 1px; margin-left: 40px; padding: 20px 20px; line-height: 50px;background: url("https://i.imgur.com/S7IIIbE.png"); background-repeat: no-repeat; background-size: 40px 40px; color: transparent;`,
    `padding-left: 2px; font-size: 14px; color: #7289DA; font-family: "Roboto", sans-serif`,
    `padding-left: 15px; font-size: 12px; font-family: "Roboto", sans-serif;`
  )

  /**
   * Due to React trying enforcing a "strict" state handler,
   * all states for Crate are manually handled in a class that
   * doesn't extend React.Component; This results in a speed
   * increase and the ability to recreate the live-state
   * to scripts outside the React Renderer class.
   */
  class StateHandler {
    state = {
      view: {
        opened: false,
        open: false,
        loading: true,
        modalOpen: false
      },
      modal: {},
      /**
       * Default configuration
       */
      config: {
        server: '299881420891881473',
        channel: '355719584830980096',
        options: '0002',
        beta: false,
        debug: false,
        analytics: true,

        logo: {
          url: Icons()
        },
        theme: 'material',
        colors: {
          toggle: '#7289DA'
        },

        notifications: {
          indicator: {
            enable: true
          },
          toasts: {
            enable: true,
            visibilityTime: 10,
            maxMessages: 5,
            maxHeight: 'calc(70% - 100px)'
          }
        },

        mobile: {
          maxWidth: 500,
          maxHeight: 500
        },

        position: {
          x: 'right',
          y: 'bottom'
        },

        delay: false,
        disable: []
      },
      notifications: {
        unread: 0,
        pinged: false,
        messages: []
      },
      // Patreon level
      l: null,
      classes: {},
      session: (
        Math.floor(Math.pow(10, 15) + Math.random() * 9 * Math.pow(10, 15)) +
        +new Date()
      ).toString(),
      iframe: null
    }
    react: any
    node: any
    transition: any
    visibilityTimer: any
    eventListeners = {}
    allEventListeners = []

    constructor(config) {
      if (!window.crate) {
        window.crate = this
      }
      ParseConfig(this.state, config, true)
        .then((config) => {
          this.setState({
            classes: jss(config),
            config: config
          })

          if (!config.delay) {
            setTimeout(() => {
              this.setState({
                view: {
                  ...this.state.view,
                  opened: true
                }
              })
            }, 3000)
          }

          // Mount DOM node
          this.node = document.createElement('div')
          this.node.classList.add(`crate-${global.sessions}`)
          global.insertionPoint.appendChild(this.node)
          global.sessions++
          ReactDOM.render(
            // @ts-ignore custom state handler
            <Renderer
              api={this}
              ref={(renderer) => {
                this.react = renderer
              }}
            />,
            this.node
          )

          // Analytics

          if (config.analytics) {
            let { track } = global
            track({
              _id: this.state.session,
              action_name: 'Crate instance initialized',
              cvar: JSON.stringify({
                '1': ['Discord server', config.server],
                '2': ['Discord channel', config.channel],
                '3': ['Widget URL', config.widgetURL]
              })
            })
          }

          // ReactGA.initialize('UA-107130316-3', { debug: config.debug })
          // ReactGA.pageview(window.location.origin)
          // ReactGA.set({
          //   server: config.server,
          //   channel: config.channel
          // })
        })
        .catch((error) => {
          log(
            'error',
            `Invalid configuration!\n${error}\n\nrefer to https://docs.widgetbot.io`
          )
        })
    }

    // Custom state handler
    setState(nextState: any) {
      Object.keys(nextState).forEach((state) => {
        // Force JSS re-render
        if (
          nextState &&
          nextState.config &&
          JSON.stringify(nextState.config) !== JSON.stringify(this.state.config)
        ) {
          this.config(nextState.config, true)
        }
        this.state[state] = nextState[state]
      })
      // Force re-render of the renderer
      if (this.react) this.react.forceUpdate()
    }

    // Deep merges the new config with the current config
    config(config: any, programmatic?: boolean) {
      ParseConfig(this.state, config)
        .then((config) => {
          this.setState({
            classes: jss(config),
            config: config
          })
        })
        .catch((error) => {
          log(
            'error',
            `Invalid configuration!\n${error}\n\nrefer to https://docs.widgetbot.io`
          )
        })

      if (!programmatic) {
        const { event } = global
        event(this.state, {
          category: 'API',
          action: 'Config update'
        })
      }
    }
  }

  /**
   * Group APIs under this class
   */
  class Crate extends StateHandler {

    toggle(open?: boolean) {
      open = typeof open === 'boolean' ? open : !this.state.view.open
      this.setState({
        view: {
          ...this.state.view,
          open: open,
          opened: true
        },
        notifications: {
          unread: 0,
          pinged: false,
          messages: []
        }
      })
      clearTimeout(this.transition)
      this.transition = setTimeout(() => {
        this.postMessage('transition', open ? 'fade-in' : 'fade-out')
      }, 100)

      /**
       * Stop the body from scrolling
       */
      if (
        window.innerWidth <= this.state.config.mobile.maxWidth ||
        window.innerHeight <= this.state.config.mobile.maxHeight
      ) {
        if (open) {
          document.body.style.overflow = 'hidden'
        } else {
          document.body.style.overflow = ''
        }
      }

      /**
       * Add the meta tag, for chrome header color
       */
      ; (() => {
        let meta: HTMLMetaElement = document.querySelector(
          'meta[name=theme-color]'
        )
        if (meta) {
          if (meta.getAttribute('default') === null) {
            meta.setAttribute('default', meta.content || '')
          }
        } else {
          meta = document.createElement('meta')
          meta.setAttribute('name', 'theme-color')
          meta.setAttribute('default', '')
          document.head.appendChild(meta)
        }
        /**
         * Timeout so the transition fades with the chrome header
         */
        setTimeout(() => {
          if (open) {
            let color =
              this.state.config.colors['background'] ||
                this.state.config['scheme'] === 'light'
                ? '#ffffff'
                : '#36393E'
            meta.setAttribute('content', color)
          } else {
            meta.setAttribute('content', meta.getAttribute('default'))
          }
        }, 100)
      })()

      this.event({
        category: 'Toggle',
        action: this.state.view.open ? 'Open' : 'Close'
      })

      this.crateEvent('toggle', open)
    }

    modal(open: boolean = !this.state.view.modalOpen) {
      // @ts-ignore Remove focus from iframe so key listeners will work
      document.activeElement.blur()

      this.setState({
        view: {
          ...this.state.view,
          modalOpen: open
        }
      })

      this.event({
        category: 'Modal',
        action: this.state.view.modalOpen ? 'Open' : 'Close'
      })
    }

    user(user) {
      this.setState({
        view: {
          ...this.state.view,
          modalOpen: true
        },
        modal: {
          type: 'user',
          data: user
        }
      })

      this.event({
        category: 'User popup',
        action: 'Open'
      })
    }

    expandMessage(message: Notifications.message) {
      this.setState({
        view: {
          ...this.state.view,
          modalOpen: true
        },
        modal: {
          type: 'message',
          data: message
        }
      })

      this.event({
        category: 'User popup',
        action: 'Open'
      })
    }

    // jumpTo(id) {
    //   console.log(`jumping to ${id}`)
    // }

    show() {
      clearTimeout(this.visibilityTimer)
      this.node.firstChild.classList.remove('disable-input')
      this.visibilityTimer = setTimeout(() => {
        this.node.firstChild.classList.remove('fade-out')
      }, 10)

      this.crateEvent('visibility', true)

      this.event({
        category: 'API',
        action: 'Visibility',
        name: 'Show'
      })
    }

    hide() {
      clearTimeout(this.visibilityTimer)
      this.node.firstChild.classList.add('fade-out')
      this.visibilityTimer = setTimeout(() => {
        this.node.firstChild.classList.add('disable-input')
      }, 200)

      this.crateEvent('visibility', false)

      this.event({
        category: 'API',
        action: 'Visibility',
        name: 'Hide'
      })
    }

    pulse(pulsing: boolean = !this.state.notifications.pinged) {
      this.setState({
        notifications: {
          ...this.state.notifications,
          pinged: pulsing,
        }
      })
      this.crateEvent('pulse', pulsing)
    }

    message(message: string, visibility: number, avatar: string = 'https://beta.widgetbot.io/embed/335391242248519680/335391242248519680/0002/default.webp') {
      let { unread, pinged, messages } = this.state.notifications

      let expiration
      if (typeof visibility !== 'undefined') {
        if (typeof visibility === 'number') {
          expiration = +new Date() + visibility
        } else if (typeof visibility === 'boolean') {
          expiration = false
        } else {
          throw new Error('Expected parameter two to be of type number | boolean!')
        }
      } else {
        let time = this.state.config.notifications.toasts.visibilityTime
        if (time < 1) time = 15
        expiration = +new Date() + 1000 * time
      }

      if (this.state.config.notifications.indicator.enable && !this.state.view.open) unread++

      // Push to start of array
      messages.unshift({
        expiration,
        message: {
          author: {
            avatar
          },
          id: Math.floor(Math.pow(10, 15) + Math.random() * 9 * Math.pow(10, 15)) + +new Date(),
          content: message,
          fake: true
        }
      })
      messages = messages.slice(
        0,
        this.state.config.notifications.toasts.maxMessages
      )

      this.setState({
        notifications: {
          ...this.state.notifications,
          unread,
          messages
        }
      })

      this.event({
        category: 'API',
        action: 'Toast'
      })
    }

    remove() {
      ReactDOM.unmountComponentAtNode(this.node)
      global.insertionPoint.removeChild(this.node)

      this.event({
        category: 'API',
        action: 'Visibility',
        name: 'Remove'
      })
    }

    postMessage(event: string, action?: any) {
      if (this.state.iframe) {
        if (this.state.iframe && this.state.iframe.contentWindow) {
          this.state.iframe.contentWindow.postMessage(
            {
              src: 'crate',
              session: this.state.session,
              event: event,
              action: action
            },
            '*'
          )
        } else {
          log(
            'error',
            `iFrame topology destroyed!`
          )
        }
      }
    }

    event(data) {
      const { event } = global
      event(this.state, data)
    }

    /**
     * Crate listeners API
     */

    on(eventName: string, callback: Function) {
      if (!this.eventListeners[eventName]) {
        this.eventListeners[eventName] = []
      }
      this.eventListeners[eventName].push(callback)
    }

    onEvent(callback: Function) {
      this.allEventListeners.push(callback)
    }

    crateEvent(name: string, data?: any) {
      if (this.eventListeners[name]) {
        for (let listener of this.eventListeners[name]) {
          // Async to prevent blocking
          setTimeout(() => {
            listener(data)
          })
        }
      }
      for (let listener of this.allEventListeners) {
        // Async to prevent blocking
        setTimeout(() => {
          listener(name, data)
        })
      }
    }
  }

  window.Crate = Crate

    // Load crate from inside script tag
    ; (() => {
      let config = document.currentScript && document.currentScript.innerHTML
      if (config) {
        eval(config)
      }
    })()

    // Crate Event
    ; (() => {
      var event = document.createEvent('Event')
      // @ts-ignore
      event.Crate = Crate
      event.initEvent('crate', true, false)
      window.dispatchEvent(event)
    })()
})