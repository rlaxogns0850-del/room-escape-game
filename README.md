# C-Web Escape Game

C언어 코어 로직을 WebAssembly로 컴파일하여 웹 브라우저에서 실행하는 방탈출 게임입니다.
웅보출판사 《프로그래밍》 교과서 학습 내용을 기반으로 실습을 확장하여 제작했습니다.

## 현재 상태

- [x] C 콘솔 프로토타입 (`Player` 구조체, 방 이동/조사/자물쇠 로직)
- [x] 웹 호출용 함수 분리 리팩터링 (`game_init`, `game_move`, `game_inspect`, `game_try_lock`, getter 함수들)
- [x] HTML/CSS UI (방 뷰, 인벤토리, 로그, 자물쇠 입력창)
- [x] JS ↔ WASM 바인딩 스크립트 (`cwrap` 기반)
- [ ] **emcc 빌드 실행** — 로컬에 emsdk 설치 후 `./build.sh` 실행 필요 (이 저장소에는 `.wasm`/글루 JS 미포함)

## 폴더 구조

```
c-web-escape-game/
├── README.md
├── build.sh              # emcc 빌드 스크립트
├── src/
│   └── game_core.c        # 게임 코어 로직 (WASM 익스포트 함수 포함)
└── web/
    ├── index.html          # 게임 화면 (HTML/CSS/JS)
    └── js/                 # build.sh 실행 후 game_core.js/.wasm 생성됨
```

## 로컬에서 실행하는 방법

### 1) Emscripten 설치 (최초 1회)

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh   # 새 터미널마다 재실행 필요
```

### 2) 빌드

```bash
cd c-web-escape-game
chmod +x build.sh
./build.sh
```

성공하면 `web/js/game_core.js`와 `web/js/game_core.wasm`이 생성됩니다.

### 3) 로컬 서버로 실행

WASM은 `file://`로 직접 열면 CORS 문제로 로드되지 않으므로 간단한 서버가 필요합니다.

```bash
cd web
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속.

## 게임 진행

1. **입구**에서 조사 → 열쇠 획득
2. 북쪽으로 이동 → **서재**에서 조사 → 비밀번호 단서(낡은 종이) 획득
3. 북쪽으로 이동 → **연구실**에서 자물쇠 비밀번호 입력 (`1042`)
4. 자물쇠가 열리면 **출구**로 이동 → 탈출 성공

## 다음 개발 계획

- [ ] 방 개수 확장 및 퍼즐 다양화
- [ ] 인벤토리 아이템 조합 로직
- [ ] 엔딩 등급별 분기 연출
- [ ] GitHub Pages 배포 (web/ 디렉토리 기준)

## 라이선스

추후 결정 (예: MIT License)
