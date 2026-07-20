#!/bin/bash
# build.sh — game_core.c를 WASM으로 컴파일
#
# 사전 준비: emsdk 설치 및 활성화가 되어 있어야 합니다.
#   git clone https://github.com/emscripten-core/emsdk.git
#   cd emsdk && ./emsdk install latest && ./emsdk activate latest
#   source ./emsdk_env.sh
#
# 사용법: 프로젝트 루트에서 ./build.sh 실행

set -e

emcc src/game_core.c \
  -o web/js/game_core.js \
  -O2 \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_game_init","_game_move","_game_inspect","_game_try_lock","_game_get_room","_game_get_has_key","_game_get_has_code_paper","_game_get_lock_opened","_game_get_move_count"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="GameModule" \
  -s ALLOW_MEMORY_GROWTH=1

echo "빌드 완료: web/js/game_core.js, web/js/game_core.wasm"
