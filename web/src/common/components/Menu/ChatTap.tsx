import React from 'react';

interface ChatTapProps {
  onClose: () => void;
}

export default function ChatTap({ onClose }: ChatTapProps) {
  return (
    <>
      <header className="rMenu-header">
        <h2>Chat</h2>
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </header>
    </>
  );
}
