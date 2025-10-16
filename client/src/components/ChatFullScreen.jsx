import React from 'react';
import Chat from './Chat';

function ChatFullScreen() {
  return (
    <div className="h-screen w-screen bg-gray-900 p-4 flex flex-col">
      <Chat />
    </div>
  );
}

export default ChatFullScreen;