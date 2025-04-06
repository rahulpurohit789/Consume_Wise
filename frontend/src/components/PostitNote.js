import React, { useState } from 'react';

const PostitNote = () => {
  const [isHidden, setIsHidden] = useState(false);

  const postitStyles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '250px',
    padding: '15px',
    background: '#00205b', // Navy blue color
    boxShadow: '4px 4px 10px rgba(0, 0, 0, 0.25)',
    fontFamily: 'Arial, sans-serif',
    zIndex: 1000,
    transform: 'rotate(2deg)',
    transition: 'all 0.3s ease',
    color: '#fff',
    borderRadius: '10px',
    display: isHidden ? 'none' : 'block',
    cursor: 'pointer',
  };

  const arrowStyles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '30px',
    height: '30px',
    backgroundColor: '#00205b', // Navy blue color
    borderRadius: '50%',
    boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)',
    display: isHidden ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'transform 0.3s ease',
    color: '#fff',
  };

  const pinStyles = {
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '12px',
    height: '12px',
    backgroundColor: 'red',
    borderRadius: '50%',
    boxShadow: '0 0 5px rgba(0,0,0,0.3)',
    zIndex: 1001,
  };

  const titleStyles = {
    margin: '0 0 10px 0',
    color: '#fff', // White text
    fontSize: '18px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
    paddingBottom: '5px',
    fontWeight: 'bold',
  };

  const sectionTitleStyles = {
    fontWeight: 'bold',
    marginBottom: '5px',
    fontSize: '14px',
    color: '#fff', // White text
  };

  const listStyles = {
    margin: '0 0 15px 0',
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#fff', // White text
  };

  const codeStyles = {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '2px 4px',
    borderRadius: '3px',
    color: '#fff',
  };

  const sectionStyles = {
    marginBottom: '15px',
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'rotate(0deg) scale(1.03)';
    e.currentTarget.style.boxShadow = '5px 5px 12px rgba(0, 0, 0, 0.3)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'rotate(2deg)';
    e.currentTarget.style.boxShadow = '4px 4px 10px rgba(0, 0, 0, 0.25)';
  };

  const handleArrowHover = (e) => {
    e.currentTarget.style.transform = 'scale(1.1)';
  };

  const handleArrowLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
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
          <div style={sectionStyles}>
            {/* <div style={sectionTitleStyles}>Names:</div> */}
            {/* <ul style={listStyles}>
              <li>Maggi Noodles</li>
              <li>Coca Cola</li>
              <li>Oreo Cookies</li>
              <li>Lays Chips</li>
            </ul> */}
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
