import React, { useEffect } from 'react';
import { useLudoSocket } from './hooks/useLudoSocket';
import { Scene } from './components/3d/Scene';
import { LudoUI } from './components/ui/LudoUI';
import { RoomModal } from './components/ui/RoomModal';

export default function App() {
  const {
    connected,
    roomState,
    localPlayer,
    isMyTurn,
    canRoll,
    isRolling,
    lastMoveEvent,
    notification,
    createRoom,
    joinRoom,
    startGame,
    rollDice,
    moveToken,
    restartGame,
  } = useLudoSocket();

  // Spacebar shortcut to roll dice
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && canRoll && !isRolling) {
        e.preventDefault();
        rollDice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canRoll, isRolling, rollDice]);

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden select-none">
      {/* 3D Scene Viewport */}
      <Scene
        roomState={roomState}
        localPlayer={localPlayer}
        isMyTurn={isMyTurn}
        canRoll={canRoll}
        isRolling={isRolling}
        lastMoveEvent={lastMoveEvent}
        onRollDice={rollDice}
        onMoveToken={moveToken}
      />

      {/* 2D Minimalist HUD Overlay */}
      {roomState.roomId && (
        <LudoUI
          roomState={roomState}
          localPlayer={localPlayer}
          isMyTurn={isMyTurn}
          canRoll={canRoll}
          isRolling={isRolling}
          notification={notification}
          onRollDice={rollDice}
          onMoveToken={moveToken}
          onStartGame={startGame}
          onRestartGame={restartGame}
        />
      )}

      {/* Modal for Room Creation & Joining */}
      {!roomState.roomId && (
        <RoomModal
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          isConnecting={!connected}
        />
      )}
    </div>
  );
}
