import { Component } from 'react'

// Stops one view's failure from blanking the entire app (which is exactly what
// happened before: a stalled view left the whole React root empty until a hard
// refresh). If a child throws, we show a small recoverable card instead of a
// white screen, and a reset lets the user switch views without reloading.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[StackTask] view error:', error, info?.componentStack)
  }

  // recover when the caller changes `resetKey` (e.g. the user switches view)
  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <div className="font-display text-lg" style={{ color: 'var(--text)' }}>this view hit a snag</div>
              <div className="mt-1 text-sm" style={{ color: 'var(--text-faint)' }}>switch views and it’ll sort itself out — nothing was lost.</div>
              <button
                onClick={() => this.setState({ error: null })}
                className="mt-4 rounded-full px-4 py-2 text-sm font-bold"
                style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
              >
                try again
              </button>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
