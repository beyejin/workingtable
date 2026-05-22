// 빌드 산출물로부터 GitHub Releases 용 latest.json 을 생성한다.
// 자동 업데이터가 이 파일을 보고 새 버전 여부를 판단한다.
//
// 사용법: node scripts/make-latest-json.mjs [릴리스 노트]
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const REPO = "binglehaepi/workingtable"; // GitHub OWNER/REPO

const conf = JSON.parse(
  readFileSync(join(root, "src-tauri/tauri.conf.json"), "utf8"),
);
const version = conf.version;
const notes = process.argv[2] || `v${version} 업데이트`;

// Windows NSIS 설치 파일이 업데이터 아티팩트
const setupName = `vibe-diary_${version}_x64-setup.exe`;
const sigPath = join(
  root,
  "src-tauri/target/release/bundle/nsis",
  `${setupName}.sig`,
);
const signature = readFileSync(sigPath, "utf8").trim();

const latest = {
  version, // "0.2.0" — 앱의 현재 버전보다 높으면 업데이트 실행
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature,
      // 릴리스 태그는 v{version} 형식, 자산 파일명은 setup.exe 그대로 업로드
      url: `https://github.com/${REPO}/releases/download/v${version}/${setupName}`,
    },
  },
};

const out = join(root, "latest.json");
writeFileSync(out, JSON.stringify(latest, null, 2));
console.log(`latest.json 생성 완료 → ${out}`);
console.log(`  version: ${version}`);
console.log(`  url: ${latest.platforms["windows-x86_64"].url}`);
