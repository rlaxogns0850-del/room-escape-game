/*
 * firebase-config.js
 *
 * Firebase 콘솔(https://console.firebase.google.com)에서:
 * 1) 새 프로젝트 생성
 * 2) 왼쪽 메뉴 "빌드 > Realtime Database" > "데이터베이스 만들기"
 *    - 위치는 아무거나, 보안 규칙은 우선 "테스트 모드"로 시작 (30일 후 잠김 — 나중에 규칙 조정 필요)
 * 3) 프로젝트 설정(톱니바퀴) > 일반 > "내 앱" > 웹 앱 추가(</> 아이콘)
 * 4) 나오는 firebaseConfig 객체를 아래에 그대로 붙여넣기
 *
 * 이 파일은 공개 저장소에 커밋해도 되는 값입니다 (Firebase 클라이언트 키는
 * 원래 공개용이며, 실제 보안은 Realtime Database 규칙에서 설정합니다).
 */

export const firebaseConfig = {
  apiKey: "여기에_API_KEY를_붙여넣으세요",
  authDomain: "여기에_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://여기에_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "여기에_PROJECT_ID",
  storageBucket: "여기에_PROJECT_ID.appspot.com",
  messagingSenderId: "여기에_SENDER_ID",
  appId: "여기에_APP_ID",
};
