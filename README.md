# Death-Game
netflix 데스게임의 게임들을 재미로 만들어보았다.

1일차
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
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

#### PM2 설치 (프로세스 매니저)
sudo npm install -g pm2

#### 방화벽 설정
sudo ufw allow 22
sudo ufw allow 8080
sudo ufw enable

## 3. API 앱 배포

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

