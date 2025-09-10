import React, { useState } from 'react';

const PostitNote = () => {
  const [isHidden, setIsHidden] = useState(false);

  const postitStyles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '280px',
    padding: '20px',
    background: 'var(--accent-color)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    fontFamily: 'Inter, sans-serif',
    zIndex: 1000,
    transform: 'rotate(2deg)',
    transition: 'all 0.3s ease',
    color: 'white',
    borderRadius: '12px',
    display: isHidden ? 'none' : 'block',
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const arrowStyles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '36px',
    height: '36px',
    backgroundColor: 'var(--accent-color)',
    borderRadius: '50%',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    display: isHidden ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const pinStyles = {
    position: 'absolute',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--error-color)',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    zIndex: 1001,
  };

  const titleStyles = {
    margin: '0 0 16px 0',
    color: 'white',
    fontSize: '1.25rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    paddingBottom: '8px',
    fontWeight: '600',
    letterSpacing: '-0.5px',
  };

  const sectionTitleStyles = {
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '0.875rem',
    color: 'white',
    opacity: 0.9,
  };

  const listStyles = {
    margin: '0 0 16px 0',
    paddingLeft: '24px',
    fontSize: '0.875rem',
    color: 'white',
    opacity: 0.9,
  };

  const codeStyles = {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.75rem',
  };

  const sectionStyles = {
    marginBottom: '16px',
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)';
    e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'rotate(2deg)';
    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  };

  const handleArrowHover = (e) => {
    e.currentTarget.style.transform = 'scale(1.1)';
    e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1)';
  };

  const handleArrowLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  };

  const toggleNote = () => {
    setIsHidden(!isHidden);
  };

  return (
    <>
      <div 
        style={postitStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={toggleNote}
      >
        <div style={pinStyles}></div>
        <h3 style={titleStyles}>Try These Examples</h3>
        <div>
          <div style={sectionStyles}>
            <div style={sectionTitleStyles}>Barcodes:</div>
            <ul style={listStyles}>
              <li><span style={codeStyles}>3017620425035</span> Nutella</li>
              <li><span style={codeStyles}>4056489177388</span> BrownriceCake</li>
              <li><span style={codeStyles}>8901058000290</span> Maggi</li>
              <li><span style={codeStyles}>8901058850429</span> KitKat</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div 
        style={arrowStyles} 
        onClick={toggleNote}
        onMouseEnter={handleArrowHover}
        onMouseLeave={handleArrowLeave}
      >
        📝
      </div>
    </>
  );
};

export default PostitNote;
