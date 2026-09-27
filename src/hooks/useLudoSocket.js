import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export function useLudoSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState({
    roomId: null,
    players: [],
    currentTurnColor: null,
    currentTurnIndex: 0,
    diceValue: null,
    diceRolled: false,
    validMoves: [],
    tokens: {
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1],
    },
    gameStarted: false,
    winner: null,
  });

  const [localPlayer, setLocalPlayer] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastMoveEvent, setLastMoveEvent] = useState(null);
  const [notification, setNotification] = useState(null);

  // Trigger temporary notification banner
  const showNotification = (msg, duration = 3000) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), duration);
  };

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to Ludo Socket Server with ID:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('game_state_update', (state) => {
      setRoomState(state);
      setIsRolling(false);
    });

    socket.on('dice_rolled', ({ diceValue, color, validMoves, consecutiveSixesPenalty }) => {
      setIsRolling(true);
      setRoomState((prev) => ({
        ...prev,
        diceValue,
        diceRolled: true,
        validMoves: validMoves || [],
      }));

      setTimeout(() => {
        setIsRolling(false);
        if (consecutiveSixesPenalty) {
          showNotification(`Three consecutive 6s! ${color.toUpperCase()}'s turn was forfeited.`, 2500);
        } else if (validMoves && validMoves.length === 0) {
          showNotification(`${color.toUpperCase()} rolled ${diceValue} - No valid moves available!`, 2000);
        } else if (diceValue === 6) {
          showNotification(`🎉 ${color.toUpperCase()} rolled a 6! Select a pawn to move or unlock from base!`, 2500);
        }
      }, 900);
    });

    socket.on('token_moved', (data) => {
      setLastMoveEvent({ ...data, id: Date.now() });
      setRoomState((prev) => {
        const nextTokens = { ...prev.tokens };
        if (nextTokens[data.color]) {
          nextTokens[data.color] = [...nextTokens[data.color]];
          nextTokens[data.color][data.tokenIndex] = data.newStep;
        }
        if (data.capturedOpponent) {
          const oppColor = data.capturedOpponent.color;
          if (nextTokens[oppColor]) {
            nextTokens[oppColor] = [...nextTokens[oppColor]];
            nextTokens[oppColor][data.capturedOpponent.tokenIndex] = -1;
          }
        }
        return {
          ...prev,
          tokens: nextTokens,
          validMoves: [],
        };
      });

      if (data.capturedOpponent) {
        showNotification(
          `⚔️ ${data.color.toUpperCase()} captured ${data.capturedOpponent.color.toUpperCase()}'s token!`,
          3000
        );
      } else if (data.bonusTurn) {
        showNotification(`⭐ ${data.color.toUpperCase()} earned an extra turn!`, 2500);
      }
    });

    socket.on('player_won', ({ color, player }) => {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
      showNotification(`🏆 ${player.name} (${color.toUpperCase()}) WON THE GAME!`, 6000);
    });

    socket.on('player_disconnected', ({ color, name }) => {
      showNotification(`${name} (${color.toUpperCase()}) disconnected. AI has taken over.`, 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName, maxPlayers = 4) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Socket not initialized'));
      socketRef.current.emit('create_room', { playerName, maxPlayers }, (res) => {
        if (res?.success) {
          setLocalPlayer(res.player);
          resolve(res);
        } else {
          reject(new Error(res?.message || 'Failed to create room'));
        }
      });
    });
  }, []);

  const joinRoom = useCallback((roomId, playerName) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Socket not initialized'));
      socketRef.current.emit('join_room', { roomId, playerName }, (res) => {
        if (res?.success) {
          setLocalPlayer(res.player);
          resolve(res);
        } else {
          reject(new Error(res?.message || 'Failed to join room'));
        }
      });
    });
  }, []);

  const startGame = useCallback(() => {
    if (!socketRef.current || !roomState.roomId) return;
    socketRef.current.emit('start_game', { roomId: roomState.roomId });
  }, [roomState.roomId]);

  const rollDice = useCallback(() => {
    if (!socketRef.current || !roomState.roomId || isRolling) return;
    socketRef.current.emit('roll_dice', { roomId: roomState.roomId });
  }, [roomState.roomId, isRolling]);

  const moveToken = useCallback(
    (tokenIndex) => {
      if (!socketRef.current || !roomState.roomId) return;
      socketRef.current.emit('move_token', {
        roomId: roomState.roomId,
        tokenIndex,
      });
    },
    [roomState.roomId]
  );

  const restartGame = useCallback(() => {
    if (!socketRef.current || !roomState.roomId) return;
    socketRef.current.emit('restart_game', { roomId: roomState.roomId });
  }, [roomState.roomId]);

  const isMyTurn =
    Boolean(localPlayer) &&
    roomState.gameStarted &&
    !roomState.winner &&
    roomState.currentTurnColor === localPlayer.color;

  const canRoll = isMyTurn && !roomState.diceRolled && !isRolling;

  return {
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
  };
}
