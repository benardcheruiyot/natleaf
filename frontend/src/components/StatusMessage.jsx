import React from 'react';
import PropTypes from 'prop-types';

export default function StatusMessage({ loading, error, children }) {
  if (loading) {
    return (
      <div className="loading-grid" aria-live="polite" aria-busy="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton-card">
            <div className="skeleton-media" />
            <div className="skeleton-body">
              <div className="skeleton-line skeleton-line-short" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-button" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="status-message error">{error.message || 'Something went wrong.'}</div>;
  }
  return <>{children}</>;
}

StatusMessage.propTypes = {
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  children: PropTypes.node.isRequired,
};
