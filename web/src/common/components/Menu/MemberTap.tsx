import React from 'react';

interface memberTapProps {
  onClose: () => void;
}

export default function memberTap({ onClose }: memberTapProps) {
  return (
    <>
      <header className="rMenu-header">
        <h2>Member</h2>
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </header>
    </>
  );
}
