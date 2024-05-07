import React from 'react';

interface BookmarpProps {
  onClose: () => void;
}

export default function BookMarkTap({ onClose }: BookmarpProps) {
  return (
    <>
      <header className="rMenuHeader">
        <h2>Bookmark</h2>
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </header>
    </>
  );
}
