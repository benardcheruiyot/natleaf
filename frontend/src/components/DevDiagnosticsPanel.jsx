import React from 'react';
import styles from './dev-diagnostics-panel.module.css';

const DEFAULT_LINES = 40;

async function fetchEventLogs(lines = DEFAULT_LINES) {
  const response = await fetch(`/api/logs/events?lines=${encodeURIComponent(String(lines))}`);
  if (!response.ok) {
    throw new Error(`Log request failed (${response.status})`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.lines)) {
    return [];
  }
  return data.lines;
}

export default function DevDiagnosticsPanel() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [lines, setLines] = React.useState([]);

  const refreshLogs = React.useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextLines = await fetchEventLogs();
      setLines(nextLines);
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load logs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    refreshLogs();
    const timer = window.setInterval(refreshLogs, 5000);
    return () => window.clearInterval(timer);
  }, [isOpen, refreshLogs]);

  return (
    <aside
      className={`${styles.panel}${isOpen ? ` ${styles.open}` : ''}`}
      aria-label="Developer diagnostics"
    >
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? 'Hide diagnostics' : 'Show diagnostics'}
      </button>

      {isOpen ? (
        <div className={styles.body}>
          <div className={styles.headerRow}>
            <strong>Recent events</strong>
            <button type="button" className={styles.refreshButton} onClick={refreshLogs}>
              Refresh
            </button>
          </div>

          {isLoading ? <p className={styles.stateText}>Loading logs...</p> : null}
          {error ? <p className={styles.errorText}>{error}</p> : null}

          {!isLoading && !error ? (
            <ul className={styles.logList}>
              {lines.length ? (
                lines.map((line, index) => (
                  <li key={`${index}-${line}`} className={styles.logItem}>
                    {line}
                  </li>
                ))
              ) : (
                <li className={styles.logItem}>No logs yet.</li>
              )}
            </ul>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
