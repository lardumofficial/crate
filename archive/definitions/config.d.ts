import { Url } from "url"

type Languages = 'en' | 'de' | 'fr' | 'es' | 'ar' | 'he' | 'it' | 'pl' | 'sk'
type Components = 'toggle' | 'toasts' | 'embed' | 'modal'

export interface Config {
  /**
   * WidgetBot widget options
   */
  server: string                // Your guilds ID
  channel: string               // Channel ID
  options?: string              // WidgetBot widget options
  beta?: boolean                // Whether to use the beta domain or not
  buttons?: {                   // Change text of buttons
    primary?: string
    secondary?: string
  }
  username: string              // Use a specific username for the guest chatter
  language?: Languages

  /**
   * Aesthetic options
   */
  logo?: Url | 'intercom' | 'discord' | any | {
    url: Url
    size?: string
  }
  scheme?: 'dark' | 'light'     // Whether to show dark or light toasts
  style?: 'material' | 'discord'// Toggle button style
  colors?: {
    toggle?: string             // Crate toggle button color
    background?: string         // WidgetBot widget background
    button?: string             // WidgetBot `Start chatting` button color
  }
  position: {
    x: 'left' | 'right'
    y: 'top' | 'bottom'
  }
  contained: boolean            // Display modals in iframe or in the window
  mobile?: {
    maxWidth?: number           // The screen resolution at which the mobile version should be used
    maxHeight?: number          // The screen resolution at which the mobile version should be used
  }

  /**
   * Notifications
   */
  notifications?: Notifications

  /**
   * General options
   */
  delay?: boolean               // Only load the widget once the button has been clicked
  debug?: boolean               // Debug crate
  analytics?: boolean           // Enable / disable analytics
  disable?: Components[] // Disable components

  /**
   * Overrides
   */
  domain?: string               // Override the domain
  widgetURL?: string            // Widget URL without any query strings
  url?: string                  // Final Widget URL for the iframe
  query?: any                   // Override the query string
}

interface Notifications {
  indicator?: {
    enable: boolean
  }
  toasts?: {
    enable: boolean           // Whether to enable toasts or not
    visibilityTime?: number   // Max amount of time the toasts should be visible for (set to 0 to disable timeout)
    maxMessages?: number      // Max amount of messages to display on screen
    maxHeight?: string        // Max height of the toast container, CSS `calc()` can be used
  }
}