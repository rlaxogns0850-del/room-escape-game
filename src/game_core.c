/*
 * game_core.c
 * 방탈출 게임 코어 로직 (웹/WASM 연동용 리팩터링 버전)
 *
 * - main()의 블로킹 while 루프 대신, JS가 이벤트마다 개별 호출하는
 *   "함수 분리" 구조로 설계 (game_init, game_move, game_inspect, game_try_lock)
 * - 상태 조회는 getter 함수로 노출 (game_get_room 등) — JS가 포인터를
 *   직접 다루지 않아도 되도록 함
 * - EMSCRIPTEN_KEEPALIVE로 각 함수를 표시해두면 emcc가 자동으로
 *   심볼을 보존함 (EXPORTED_FUNCTIONS 목록과 병행 사용 권장)
 */

#include <string.h>
#include <stdbool.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

/* ---------- 상수 정의 ---------- */
#define LOCK_CODE "1042"

/* ---------- 방 번호 정의 ---------- */
enum RoomId {
    ROOM_ENTRANCE = 0,
    ROOM_LIBRARY  = 1,
    ROOM_STUDY    = 2,
    ROOM_EXIT     = 3
};

/* ---------- 플레이어 상태 구조체 ---------- */
typedef struct Player {
    int  current_room;
    bool has_key;
    bool has_code_paper;
    bool lock_opened;
    int  move_count;
} Player;

/* 모듈 내부 단일 인스턴스 (브라우저에서는 세션당 게임 1개면 충분) */
static Player g_player;

/* ---------- 내부 유틸 ---------- */
static void reset_player(Player *p) {
    p->current_room   = ROOM_ENTRANCE;
    p->has_key        = false;
    p->has_code_paper = false;
    p->lock_opened    = false;
    p->move_count     = 0;
}

/* ============================================================
 * 외부(JS)로 노출되는 API
 * ============================================================ */

/* 게임 초기화 / 재시작 */
EMSCRIPTEN_KEEPALIVE
void game_init(void) {
    reset_player(&g_player);
}

/*
 * 방 이동
 * direction: +1(북/동), -1(남/서)
 * 반환값: 0=이동 성공, 1=범위 밖, 2=잠긴 문
 */
EMSCRIPTEN_KEEPALIVE
int game_move(int direction) {
    int next_room = g_player.current_room + direction;

    if (next_room < ROOM_ENTRANCE || next_room > ROOM_EXIT) {
        return 1;
    }

    if (g_player.current_room == ROOM_STUDY &&
        next_room == ROOM_EXIT &&
        !g_player.lock_opened) {
        return 2;
    }

    g_player.current_room = next_room;
    g_player.move_count++;
    return 0;
}

/*
 * 현재 방 조사
 * 반환값: 0=조사할 것 없음, 1=새 아이템 획득
 */
EMSCRIPTEN_KEEPALIVE
int game_inspect(void) {
    switch (g_player.current_room) {
        case ROOM_ENTRANCE:
            if (!g_player.has_key) {
                g_player.has_key = true;
                return 1;
            }
            return 0;

        case ROOM_LIBRARY:
            if (!g_player.has_code_paper) {
                g_player.has_code_paper = true;
                return 1;
            }
            return 0;

        default:
            return 0;
    }
}

/*
 * 자물쇠 비밀번호 시도
 * 반환값: 0=오답 또는 시도 불가, 1=정답(열림)
 */
EMSCRIPTEN_KEEPALIVE
int game_try_lock(const char *code) {
    if (g_player.current_room != ROOM_STUDY) return 0;
    if (!g_player.has_code_paper) return 0;
    if (code == NULL) return 0;

    if (strcmp(code, LOCK_CODE) == 0) {
        g_player.lock_opened = true;
        return 1;
    }
    return 0;
}

/* ---------- 상태 조회 (getter) ---------- */

EMSCRIPTEN_KEEPALIVE
int game_get_room(void) { return g_player.current_room; }

EMSCRIPTEN_KEEPALIVE
int game_get_has_key(void) { return g_player.has_key ? 1 : 0; }

EMSCRIPTEN_KEEPALIVE
int game_get_has_code_paper(void) { return g_player.has_code_paper ? 1 : 0; }

EMSCRIPTEN_KEEPALIVE
int game_get_lock_opened(void) { return g_player.lock_opened ? 1 : 0; }

EMSCRIPTEN_KEEPALIVE
int game_get_move_count(void) { return g_player.move_count; }

/*
 * 브라우저 없이 로컬 테스트하고 싶을 때를 위한 선택적 main()
 * emcc 빌드 시 EXPORTED_FUNCTIONS에 _main을 넣지 않으면 무시되므로
 * 네이티브 gcc 컴파일 시 동작 확인용으로 안전하게 남겨둠
 */
#ifndef __EMSCRIPTEN__
#include <stdio.h>
int main(void) {
    game_init();
    printf("game_core.c (web API 버전) — 네이티브 컴파일 확인용 실행\n");
    printf("현재 방: %d, 이동 가능 함수: game_move/game_inspect/game_try_lock\n",
           game_get_room());
    return 0;
}
#endif
