const express = require("express");
const cors = require("cors");

const app = express();

// 🔥 기본 설정
app.use(cors()); // 모든 도메인 허용 (나중에 제한 가능)
app.use(express.json()); // JSON 요청 처리

// ✅ 테스트용 루트
app.get("/", (req, res) => {
  res.send("Death Game Server Running");
});

// ✅ API 테스트
app.get("/api/test", (req, res) => {
  res.json({
    message: "API working!",
  });
});

// 🎮 예시: 게임 방 생성 (간단 버전)
app.post("/api/room", (req, res) => {
  const roomId = Math.floor(Math.random() * 10000);

  res.json({
    roomId,
    message: "Room created",
  });
});

// 🔥 서버 실행 (중요!!)
const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});