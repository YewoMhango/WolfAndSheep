import { Wifi, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '../net/socket.js';
import styles from './ConnectionIndicator.module.css';

const LABELS: Record<ConnectionStatus, string> = {
  online: 'Connected',
  connecting: 'Connecting…',
  offline: 'Reconnecting…',
};

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  /** Show the text label next to the icon (off = icon only). */
  showLabel?: boolean;
}

export function ConnectionIndicator({ status, showLabel = true }: ConnectionIndicatorProps) {
  const online = status === 'online';
  const Icon = online ? Wifi : WifiOff;
  return (
    <span
      className={`${styles.indicator} ${styles[status]}`}
      role="status"
      aria-label={LABELS[status]}
    >
      <Icon size={16} aria-hidden />
      {showLabel && <span>{LABELS[status]}</span>}
    </span>
  );
}
