# Death-Game
netflix 데스게임의 게임들을 재미로 만들어보았다.

# 🐼 1일차
play-web-prod
play-server-prod

Ubuntu vs Amazon Linux

| 항목      | Ubuntu   | Amazon Linux |
| ------- | -------- | ------------ |
| 자료      | ⭐⭐⭐⭐⭐    | ⭐⭐⭐          |
| 난이도     | 쉬움       | 중간           |
| AWS 친화성 | 보통       | ⭐⭐⭐⭐⭐        |
| 개발 편의성  | ⭐⭐⭐⭐⭐    | ⭐⭐⭐          |
| 포폴용     | 👍 매우 추천 | 👍 AWS 강조용   |

<img width="761" height="559" alt="image" src="https://github.com/user-attachments/assets/42c51d0e-d33e-4123-80de-13aec94b7bbd" />

---

## 1. 기본 네트워크 설정

VPC 서브넷 10.0.0.0/24

보안그룹 - API 서버용
인바운드 : web 서버 sg에서만 API 포트 허용
인바운드 : 본인 IP에서 SSH (22) 허용
아웃바운드 : RDS, Redis 포트, 인터넷 허용

## 2. EC2 서버 세팅

#### 시스템 업데이트
sudo apt update && sudo apt upgrade -y

#### Node.js 22 설치 (NodeSource)
- curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
- sudo apt install -y nodejs

#### PM2 설치 (프로세스 매니저)
sudo npm install -g pm2

#### 방화벽 설정
- sudo ufw allow 22
- sudo ufw allow 8080
- sudo ufw enable


# 🐻 2일차

---
## 3. 로컬에서 Project 생성
1. 프로젝트 생성
```
mkdir death-game
cd death-game
npm init -y
```

``` index.js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Death Game Server Running");
});

app.listen(3000, () => {
  console.log("Server running");
});
```
2. 기본 구조
```
npm install express
touch index.js
```

3. Github 연결
```
git init
git add .
git commit -m "init project"
git remote add origin <repo_url>
git push -u origin master
```

4. EC2 clone
```
cd /var/www/api
git clone <repo_url>
cd death-game
npm install
```

---
## 4. API 앱 배포

#### 앱 디렉토리 생성
mkdir -p /var/www/api && cd /var/www/api

#### Git에서 코드 clone (또는 scp로 파일 전송)
git clone https://github.com/yourrepo/boardgame-api.git .

#### 패키지 설치
npm install --production

#### 환경변수 파일 설정
nano .env
#### DB_HOST, DB_PASSWORD, REDIS_URL, JWT_SECRET 등 입력

#### PM2로 실행
pm2 start app.js --name "boardgame-api"
pm2 save
pm2 startup  # 서버 재부팅 시 자동 시작

#### SG 설정
TCP 3000 -> All allow

#### cors 설치
npm install cors -> 다른 서버에서 요청 오는 걸 허용할지 말지 정하는 보안정책

``` 특정 front만 허용
app.use(cors({
  origin: "http://프론트주소"
}));
```

#### express : Node.js로 웹서버를 쉽게 만들게 해주는 프레임워크
- URL 처리 쉬움
- API 만들기 쉬움
- 코드 짧아짐


---

## 5. API 만들기 (게임은 일단 chess로 시작)

- 1단계: 백엔드에 Socket.io + 체스 로직 붙이기 (chess.js 라이브러리 활용)
- 2단계: 간단한 프론트 HTML로 연결 테스트
- 3단계: 프론트엔드 본격 개발
- 4단계: 그때 DB 스키마 확정 + RDS 연결


``` Node.js + Express + Socket.io + chess.js
api/
├── src/
│   ├── socket/
│   │   ├── index.js        # Socket.io 초기화
│   │   └── gameHandler.js  # 게임 이벤트 처리
│   ├── game/
│   │   └── chessManager.js # 방 & 게임 상태 관리
│   └── app.js              # Express + Socket.io 서버
├── package.json
└── .env
```
```
death-game/                  ← 현재 root (여기서 git 관리)
├── backend/
│   ├── src/
│   │   ├── game/
│   │   │   └── chessManager.js
│   │   └── socket/
│   │       └── index.js
│   ├── index.js             ← 기존 index.js 이동
│   ├── package.json         ← 새로 생성
│   └── .env                 ← 기존 .env 이동
├── frontend/                ← 나중에 생성
└── package.json             ← root package.json (워크스페이스 관리용)
```


---

깨달음

* JSON : 주석 불가능
json vs YAML
