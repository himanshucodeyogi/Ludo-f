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
    rollId,
    lastMoveEvent,
    notification,
    createRoom,
    joinRoom,
    startGame,
    rollDice,
    moveToken,
    restartGame,
  } = useLudoSocket();

  const canMove = isMyTurn && roomState.diceRolled && !isRolling;

  // Keyboard shortcuts: Space rolls the dice, 1-4 (top row or numpad) moves that numbered pawn
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't hijack typing in the name / room code inputs
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && canRoll && !isRolling) {
        e.preventDefault();
        rollDice();
        return;
      }

      const match = /^(?:Digit|Numpad)([1-4])$/.exec(e.code);
      if (match && canMove) {
        const tokenIndex = Number(match[1]) - 1;
        if (roomState.validMoves?.includes(tokenIndex)) {
          e.preventDefault();
          moveToken(tokenIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canRoll, canMove, isRolling, rollDice, moveToken, roomState.validMoves]);

  return (
    <div className="app-viewport relative w-full bg-slate-950 overflow-hidden select-none">
      {/* 3D Scene Viewport */}
      <Scene
        roomState={roomState}
        localPlayer={localPlayer}
        isMyTurn={isMyTurn}
        canRoll={canRoll}
        isRolling={isRolling}
        rollId={rollId}
        lastMoveEvent={lastMoveEvent}
        onRollDice={rollDice}
        onMoveToken={moveToken}
      />

      {/* 2D Minimalist HUD Overlay */}
      {roomState.roomId && (
        <LudoUI
          connected={connected}
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
          notice={notification}
        />
      )}
    </div>
  );
}
