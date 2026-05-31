// 웹 자산만 dist/ 로 모아 Tauri frontendDist 로 사용한다.
// (프로젝트 루트엔 node_modules, src-tauri 등이 섞여 있어 그대로 번들할 수 없음)
//
// 주의: 이 환경에선 fs.rmSync/cpSync 의 recursive 옵션이 죽는다(STATUS_STACK_BUFFER_OVERRUN).
//       그래서 단일 파일 연산(mkdirSync/copyFileSync)만으로 직접 재귀 복사한다.
import { mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync, rmdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// 메인 HTML 이 로드하는 자산 목록
const assets = [
  "todoary.html",
  "styles.css",
  "tweaks-panel.jsx",
  "v2",
  "vendor",
  "asset",
];

function clearDir(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      clearDir(path);
      rmdirSync(path);
    } else {
      unlinkSync(path);
    }
  }
}

function copyRecursive(src, dest) {
  if (statSync(src).isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    copyFileSync(src, dest);
  }
}

mkdirSync(dist, { recursive: true });
clearDir(dist);
for (const name of assets) {
  copyRecursive(join(root, name), join(dist, name));
}

console.log(`dist/ 준비 완료 (${assets.length}개 자산)`);
