/*
 * multiplayer.js
 * Firebase Realtime Database를 이용한 방 생성/참가/실시간 동기화 로직.
 *
 * 사전 조건:
 * - index.html에서 firebase-compat SDK 스크립트가 이 파일보다 먼저 로드되어야 함
 * - firebase-config.js에 본인의 Firebase 프로젝트 설정이 채워져 있어야 함
 *
 * DB 구조:
 * rooms/{roomCode}/
 *   createdAt
 *   stage: 1~3 (현재 진행 중인 스테이지), 4 = 탈출 완료
 *   players/{playerId}: { name, role(1~4), joinedAt }
 *   log/{pushId}: { text, type, ts }
 */

import { STAGES, STAGE_ORDER, normalizeAnswer } from "./story-data.js";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동되는 문자(0/O, 1/I) 제외
const MAX_PLAYERS = 4;
const PLAYER_ID_KEY = "escapeGamePlayerId";

let db = null;
let currentRoomCode = null;
let currentPlayerId = null;
let roomListenerRef = null;

export function initFirebase(firebaseConfig) {
  if (!window.firebase) {
    throw new Error("firebase compat SDK가 로드되지 않았습니다. index.html의 script 태그를 확인하세요.");
  }
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }
  db = window.firebase.database();
}

function getOrCreatePlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = "p_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  currentPlayerId = id;
  return id;
}

function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

async function roomExists(code) {
  const snap = await db.ref(`rooms/${code}`).get();
  return snap.exists();
}

/* 새 방 생성 후 바로 참가까지 처리 */
export async function createRoom(playerName) {
  let code;
  let tries = 0;
  do {
    code = generateRoomCode();
    tries++;
    if (tries > 10) throw new Error("방 코드 생성에 반복 실패했습니다. 다시 시도해주세요.");
  } while (await roomExists(code));

  await db.ref(`rooms/${code}`).set({
    createdAt: window.firebase.database.ServerValue.TIMESTAMP,
    stage: 1,
  });

  return joinRoom(code, playerName);
}

/* 기존 방에 참가 (역할은 참가 순서로 자동 배정, 새로고침 시 기존 역할 유지) */
export async function joinRoom(code, playerName) {
  code = code.trim().toUpperCase();
  if (!(await roomExists(code))) {
    throw new Error("존재하지 않는 방 코드입니다.");
  }

  const playerId = getOrCreatePlayerId();
  const playersSnap = await db.ref(`rooms/${code}/players`).get();
  const players = playersSnap.exists() ? playersSnap.val() : {};

  let role;
  if (players[playerId]) {
    role = players[playerId].role;
  } else {
    const takenRoles = Object.values(players).map((p) => p.role);
    role = [1, 2, 3, 4].find((r) => !takenRoles.includes(r));
    if (!role) {
      throw new Error("이 방은 이미 4명이 가득 찼습니다.");
    }
  }

  await db.ref(`rooms/${code}/players/${playerId}`).set({
    name: playerName || `탐사대원 ${role}`,
    role,
    joinedAt: window.firebase.database.ServerValue.TIMESTAMP,
  });

  currentRoomCode = code;
  await addLog(code, `${playerName || "누군가"}가 합류했다. (역할 ${role})`, "system");

  return { code, playerId, role };
}

/* 방 상태 실시간 구독. callback(roomData) 형태로 호출됨 */
export function listenToRoom(code, callback) {
  if (roomListenerRef) {
    roomListenerRef.off();
  }
  roomListenerRef = db.ref(`rooms/${code}`);
  roomListenerRef.on("value", (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
}

export function stopListening() {
  if (roomListenerRef) {
    roomListenerRef.off();
    roomListenerRef = null;
  }
}

export async function addLog(code, text, type = "info") {
  await db.ref(`rooms/${code}/log`).push({
    text,
    type,
    ts: window.firebase.database.ServerValue.TIMESTAMP,
  });
}

/*
 * 정답 제출
 * 반환값: { correct: boolean, stageCleared: boolean, gameCleared: boolean }
 */
export async function submitAnswer(code, stageId, rawAnswer, playerName) {
  const stage = STAGES[stageId];
  const guess = normalizeAnswer(rawAnswer);
  const correct = guess === stage.answer;

  if (!correct) {
    await addLog(code, `${playerName}: "${rawAnswer}" → 오답`, "error");
    return { correct: false, stageCleared: false, gameCleared: false };
  }

  await addLog(code, `${playerName}: "${rawAnswer}" → 정답! ${stage.successLog}`, "success");

  const currentIndex = STAGE_ORDER.indexOf(stageId);
  const isLastStage = currentIndex === STAGE_ORDER.length - 1;
  const nextStage = isLastStage ? 4 : STAGE_ORDER[currentIndex + 1];

  await db.ref(`rooms/${code}/stage`).set(nextStage);

  if (isLastStage) {
    await addLog(code, "=== 전원 탈출 성공 ===", "success");
  }

  return { correct: true, stageCleared: true, gameCleared: isLastStage };
}

export function getCurrentPlayerId() {
  return currentPlayerId || getOrCreatePlayerId();
}

export function getCurrentRoomCode() {
  return currentRoomCode;
}
