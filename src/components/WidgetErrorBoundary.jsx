import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="widget-card rounded-xl p-4 flex flex-col items-center justify-center gap-2"
          style={{
            minHeight: 100,
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.05)',
          }}
        >
          <AlertTriangle size={20} style={{ color: '#ef4444', opacity: 0.6 }} />
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            {this.props.name || 'Widget'} failed to load
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-[10px] px-2 py-1 rounded border-0 cursor-pointer"
            style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
