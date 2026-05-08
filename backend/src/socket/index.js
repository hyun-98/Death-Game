const {
  createRoom,
  joinRoom,
  removePlayer,
  applyMove,
  getRoomState,
} = require('../game/chessManager');

/**
 * 클라이언트 ↔ 서버 이벤트 목록
 *
 * [클라 → 서버]
 *   create_room              방 생성 요청
 *   join_room   { roomId }   방 입장 요청
 *   move        { roomId, from, to, promotion? }  착수
 *   resign      { roomId }   기권
 *
 * [서버 → 클라]
 *   room_created  { roomId }                        방 생성 완료
 *   room_joined   { roomId, color, fen, status }    입장 완료 (본인)
 *   opponent_joined { color }                       상대 입장 알림
 *   move_made     { move, fen, inCheck, turn }      착수 결과 (양측)
 *   game_over     { winner, pgn }                   게임 종료 (양측)
 *   error         { message }                       오류
 */

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[connected] ${socket.id}`);

    // ── 방 생성 ──────────────────────────────────────────
    socket.on('create_room', () => {
      const room = createRoom();
      const result = joinRoom(room.id, socket.id);
      socket.join(room.id);

      socket.emit('room_created', { roomId: room.id });
      socket.emit('room_joined', {
        roomId: room.id,
        color: result.color,
        fen: getRoomState(room.id).fen,
        status: 'waiting',
      });

      console.log(`[room_created] ${room.id} by ${socket.id}`);
    });

    // ── 방 입장 ──────────────────────────────────────────
    socket.on('join_room', ({ roomId }) => {
      const result = joinRoom(roomId, socket.id);

      if (!result) {
        socket.emit('error', { message: '방이 없거나 이미 가득 찼습니다.' });
        return;
      }

      socket.join(roomId);
      const state = getRoomState(roomId);

      // 본인에게
      socket.emit('room_joined', {
        roomId,
        color: result.color,
        fen: state.fen,
        status: state.status,
      });

      // 상대방에게 (이미 방에 있던 플레이어)
      socket.to(roomId).emit('opponent_joined', { color: result.color });

      console.log(`[join_room] ${socket.id} joined ${roomId} as ${result.color}`);
    });

    // ── 착수 ─────────────────────────────────────────────
    socket.on('move', ({ roomId, from, to, promotion }) => {
      const result = applyMove(roomId, socket.id, { from, to, promotion: promotion || 'q' });

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      const state = getRoomState(roomId);

      // 양측 모두에게 착수 결과 전송
      io.to(roomId).emit('move_made', {
        move: result.move,
        fen: result.fen,
        inCheck: result.inCheck,
        turn: state.turn,
      });

      // 게임 종료
      if (result.gameOver) {
        io.to(roomId).emit('game_over', {
          winner: result.winner,
          pgn: result.pgn,
        });
        console.log(`[game_over] room ${roomId} winner: ${result.winner}`);
      }
    });

    // ── 기권 ─────────────────────────────────────────────
    socket.on('resign', ({ roomId }) => {
      const state = getRoomState(roomId);
      if (!state) return;

      const isWhite = state.players.white === socket.id;
      const winner = isWhite ? 'black' : 'white';

      io.to(roomId).emit('game_over', { winner, pgn: null, reason: 'resign' });
      console.log(`[resign] room ${roomId} ${socket.id} resigned`);
    });

    // ── 연결 해제 ─────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomId = removePlayer(socket.id);
      if (roomId) {
        // 상대방에게 알림
        socket.to(roomId).emit('opponent_disconnected');
        console.log(`[disconnected] ${socket.id} left room ${roomId}`);
      }
    });
  });
}

module.exports = { initSocket };