const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');

// 메모리에 게임방 상태 저장 (추후 Redis로 교체)
// rooms = { [roomId]: Room }
const rooms = new Map();

/**
 * Room 구조:
 * {
 *   id: string,
 *   chess: Chess instance,
 *   players: { white: socketId | null, black: socketId | null },
 *   status: 'waiting' | 'playing' | 'finished',
 *   winner: 'white' | 'black' | 'draw' | null,
 *   createdAt: Date,
 * }
 */

function createRoom() {
  const id = uuidv4().slice(0, 8).toUpperCase(); // 예: A3F9B2C1
  const room = {
    id,
    chess: new Chess(),
    players: { white: null, black: null },
    status: 'waiting',
    winner: null,
    createdAt: new Date(),
  };
  rooms.set(id, room);
  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function deleteRoom(roomId) {
  rooms.delete(roomId);
}

/**
 * 플레이어를 방에 입장시킨다.
 * 먼저 온 사람이 white, 두 번째가 black.
 * @returns { room, color } | null (방이 꽉 찼거나 없을 때)
 */
function joinRoom(roomId, socketId) {
  const room = getRoom(roomId);
  if (!room) return null;

  if (!room.players.white) {
    room.players.white = socketId;
    return { room, color: 'white' };
  }

  if (!room.players.black && room.players.white !== socketId) {
    room.players.black = socketId;
    room.status = 'playing';
    return { room, color: 'black' };
  }

  return null; // 이미 꽉 참
}

/**
 * 소켓 연결이 끊어졌을 때 방에서 제거
 * @returns roomId | null
 */
function removePlayer(socketId) {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.white === socketId || room.players.black === socketId) {
      // 상대가 없으면 방 삭제, 있으면 빈 자리로 표시
      const opponent =
        room.players.white === socketId ? room.players.black : room.players.white;
      if (!opponent) {
        deleteRoom(roomId);
      } else {
        if (room.players.white === socketId) room.players.white = null;
        else room.players.black = null;
        room.status = 'waiting';
      }
      return roomId;
    }
  }
  return null;
}

/**
 * 착수 시도
 * @returns { success, move, fen, gameOver, winner }
 */
function applyMove(roomId, socketId, movePayload) {
  const room = getRoom(roomId);
  if (!room || room.status !== 'playing') {
    return { success: false, error: '게임이 진행 중이 아닙니다.' };
  }

  // 턴 검증
  const turn = room.chess.turn(); // 'w' | 'b'
  const isWhite = room.players.white === socketId;
  const isBlack = room.players.black === socketId;
  if ((turn === 'w' && !isWhite) || (turn === 'b' && !isBlack)) {
    return { success: false, error: '상대방의 턴입니다.' };
  }

  // 착수 시도
  let move;
  try {
    move = room.chess.move(movePayload); // { from, to, promotion? }
  } catch {
    return { success: false, error: '유효하지 않은 수입니다.' };
  }

  if (!move) {
    return { success: false, error: '유효하지 않은 수입니다.' };
  }

  // 게임 종료 체크
  let gameOver = false;
  let winner = null;

  if (room.chess.isCheckmate()) {
    gameOver = true;
    winner = turn === 'w' ? 'white' : 'black'; // 방금 착수한 쪽이 이김
    room.status = 'finished';
    room.winner = winner;
  } else if (room.chess.isDraw()) {
    gameOver = true;
    winner = 'draw';
    room.status = 'finished';
    room.winner = 'draw';
  }

  return {
    success: true,
    move,
    fen: room.chess.fen(),
    pgn: room.chess.pgn(),
    inCheck: room.chess.inCheck(),
    gameOver,
    winner,
  };
}

function getRoomState(roomId) {
  const room = getRoom(roomId);
  if (!room) return null;
  return {
    id: room.id,
    fen: room.chess.fen(),
    turn: room.chess.turn(),
    players: room.players,
    status: room.status,
    winner: room.winner,
  };
}

module.exports = { createRoom, getRoom, joinRoom, removePlayer, applyMove, getRoomState };