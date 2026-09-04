import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { getImageUrl } from '../api';

const FALLBACK_SRC = '/images/placeholder.svg';

export default function ImageWithFallback({ src, alt, className, fallbackText }) {
  const [error, setError] = useState(false);
  const resolvedSrc = useMemo(() => getImageUrl(src), [src]);

  useEffect(() => {
    setError(false);
  }, [resolvedSrc]);

  if (!src || error) {
    if (fallbackText) {
      return (
        <span className={className} role="img" aria-label={alt}>
          {fallbackText}
        </span>
      );
    }

    return <img src={FALLBACK_SRC} alt={alt} className={className} />;
  }

  return <img src={resolvedSrc} alt={alt} className={className} onError={() => setError(true)} />;
}

ImageWithFallback.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  fallbackText: PropTypes.string,
};
