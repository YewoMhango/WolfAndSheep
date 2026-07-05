import styles from './Spinner.module.css';

/** Small indeterminate loading spinner. */
export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <div className={styles.spinner} role="status" aria-label={label} />;
}
