import { Component, type ReactNode } from 'react';
import { useWorld } from '../../store';

export class AvatarBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    useWorld.getState().setAvatar('capsule');
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
