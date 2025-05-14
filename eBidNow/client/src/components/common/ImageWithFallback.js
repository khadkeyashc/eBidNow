import React, { useState } from 'react';

/**
 * A component that displays an image with fallback handling
 * @param {string} src - Primary image source
 * @param {string} fallbackSrc - Fallback image source if primary fails
 * @param {string} alt - Alt text for the image
 * @param {Object} props - Additional props to pass to the img element
 */
const ImageWithFallback = ({ src, fallbackSrc, alt, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [imgError, setImgError] = useState(false);

  const onError = () => {
    if (!imgError) {
      setImgSrc(fallbackSrc);
      setImgError(true);
    }
  };

  // Function to fix relative URLs if needed
  const fixUrl = (url) => {
    if (!url) return fallbackSrc;
    
    // If already absolute URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it starts with 'uploads/' or '/uploads/', prepend server URL
    if (url.startsWith('uploads/') || url.startsWith('/uploads/')) {
      return `http://localhost:5000/${url.startsWith('/') ? url.substring(1) : url}`;
    }
    
    // If it's a relative URL, make sure it's correct
    if (url.startsWith('/')) {
      return `http://localhost:5000${url}`;
    }
    
    // Otherwise, assume it's relative to server
    return `http://localhost:5000/${url}`;
  };

  return (
    <img
      src={fixUrl(imgSrc)}
      alt={alt || 'Image'}
      onError={onError}
      {...props}
    />
  );
};

export default ImageWithFallback; 