import { Component, type ReactNode } from 'react';

type Props = { fallback: ReactNode; children: ReactNode };

export class ArenaBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* fall back to the box score; nothing to report */
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
