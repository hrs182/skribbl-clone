import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { socket } from '../services/socket';
import { soundManager } from '../services/sound';

interface ChatBoxProps {
  messages: ChatMessage[];
  isDrawer: boolean;
  hasGuessed: boolean;
  phase: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  isDrawer,
  hasGuessed,
  phase,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    soundManager.playPop();
    socket.emit('guess', { text });
    setInputText('');
  };

  const getPlaceholder = () => {
    if (isDrawer) return "You are drawing...";
    if (hasGuessed) return "You guessed the word!";
    return "Type your guess here...";
  };

  return (
    <div className="skribbl-chatbox-card">
      {/* Scrollable messages container */}
      <div className="skribbl-chat-feed">
        {messages.map((msg, i) => {
          // Correct guess in vibrant green
          if (msg.type === 'correct') {
            return (
              <div key={msg.id || i} className="skribbl-chat-line chat-line-correct">
                {msg.text}
              </div>
            );
          }

          // Close guess alert in yellow/gold
          if (msg.type === 'close') {
            return (
              <div key={msg.id || i} className="skribbl-chat-line chat-line-close">
                {msg.text}
              </div>
            );
          }

          // System message in blue/orange (Screenshot 2 & 3)
          if (msg.type === 'system' || msg.type === 'join' || msg.type === 'leave') {
            const isOwner = msg.text.includes('room owner');
            const isDislike = msg.text.includes('disliked');
            return (
              <div
                key={msg.id || i}
                className={`skribbl-chat-line ${isOwner || isDislike ? 'chat-line-orange' : 'chat-line-blue'}`}
              >
                {msg.text}
              </div>
            );
          }

          // Regular guess or chat
          const isReaction = msg.text.includes('liked the drawing') || msg.text.includes('disliked the drawing');
          if (isReaction) {
            return (
              <div key={msg.id || i} className="skribbl-chat-line chat-line-orange">
                <strong>{msg.playerName}</strong> {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id || i} className={`skribbl-chat-line ${i % 2 === 0 ? 'bg-even' : ''}`}>
              <strong className="chat-user-label">{msg.playerName}: </strong>
              <span>{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="skribbl-chat-form">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={isDrawer}
          maxLength={100}
          className="skribbl-chat-input"
        />
      </form>
    </div>
  );
};
