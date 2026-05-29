# todoary — Tauri 데스크탑 앱 빌드

투명 사이드바로 바탕화면에 떠 있는 다이어리 앱.

## 사전 설치 필요

1. **Rust** — <https://www.rust-lang.org/tools/install>
   ```sh
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **Node.js** (Tauri CLI 실행용) — <https://nodejs.org>
3. **플랫폼별 시스템 의존성** — <https://tauri.app/start/prerequisites/>
   - macOS: Xcode Command Line Tools (`xcode-select --install`)
   - Windows: WebView2 (Win10 1903+엔 기본 설치)
   - Linux: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev` 등

## 첫 실행

```sh
# 1) 프로젝트 루트에서
npm install          # 또는 pnpm install / yarn

# 2) (선택) 플랫폼별 아이콘 생성 — icon.png 하나로 .icns/.ico 등 다 만들어줌
npx tauri icon src-tauri/icons/icon.png

# 3) 개발 모드 실행 (핫 리로드 X — 정적 HTML이라)
npm run dev

# 4) 배포용 빌드 (.app / .msi / .deb / .AppImage 등 생성)
npm run build
# 결과: src-tauri/target/release/bundle/
```

## 구조

```
project/
├── todoary.html                              ← Tauri가 로드하는 메인 HTML
├── styles.css, design-canvas.jsx, ...
├── v2/                                       ← React 컴포넌트
├── package.json                              ← Tauri CLI
└── src-tauri/
    ├── tauri.conf.json                       ← 창 설정 (투명/프레임리스/사이즈)
    ├── Cargo.toml                            ← Rust 의존성
    ├── build.rs
    ├── icons/                                ← 앱 아이콘
    ├── capabilities/default.json             ← 권한 (알림 등)
    └── src/main.rs                           ← Rust 진입점
```

## 윈도우 설정 (`src-tauri/tauri.conf.json`)

| 옵션 | 값 | 의미 |
|---|---|---|
| `decorations` | `false` | 타이틀바/테두리 제거 (커스텀 chrome 사용) |
| `transparent` | `true` | 투명 배경 허용 (바탕화면 보임) |
| `shadow` | `false` | OS 그림자 제거 |
| `width` / `height` | 440 / 1000 | 초기 크기 |
| `alwaysOnTop` | `false` | 항상 위 표시 (필요하면 `true`로) |
| `skipTaskbar` | `false` | 작업표시줄 노출 여부 |

### 항상 위에 띄우려면

```json
"alwaysOnTop": true
```

### 시작 위치 (화면 오른쪽에 붙이기) — 동적으로 설정하려면 `main.rs` 수정

```rust
use tauri::{Manager, PhysicalPosition};
.setup(|app| {
    let win = app.get_webview_window("main").unwrap();
    if let Some(monitor) = win.primary_monitor()? {
        let m = monitor.size();
        win.set_position(PhysicalPosition::new(m.width as i32 - 460, 40))?;
    }
    Ok(())
})
```

## 알림

- 브라우저 Notification API가 그대로 동작 (`window.Notification`) — 별도 변경 불필요
- 더 OS-네이티브한 알림이 필요하면 `tauri-plugin-notification` JS 바인딩 사용:
  ```js
  import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
  ```
- 권한 capability는 `src-tauri/capabilities/default.json`에 이미 추가됨

## 드래그

- 도크 상단 핑크 헤더에 `data-tauri-drag-region` 속성 있음 → 그 부분 잡고 창 이동 가능

## 데이터 저장 위치

- 현재는 브라우저 `localStorage` 사용 — Tauri 웹뷰의 로컬 스토리지
- 위치:
  - macOS: `~/Library/WebKit/<bundle-id>/...`
  - Windows: `%APPDATA%\<bundle-id>\WebView2\...`
  - Linux: `~/.local/share/<bundle-id>/...`
- 더 안정적인 영속화가 필요하면 `tauri-plugin-store` 또는 SQLite로 마이그레이션 권장

## CSP (Content Security Policy)

현재 `csp: null`로 개발용 설정. 배포 전엔 다음처럼 좁히는 걸 권장:

```json
"csp": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://fonts.googleapis.com https://fonts.gstatic.com data:; img-src 'self' data: https:;"
```

## 트러블슈팅

- **빌드 실패: 아이콘 누락** → `npx tauri icon src-tauri/icons/icon.png` 한 번 실행하면 플랫폼별 아이콘 자동 생성
- **창이 안 떠짐 / 흰 화면** → Devtools 열기: macOS는 우클릭→Inspect, 또는 `Cargo.toml`에서 `tauri = { features = ["devtools"] }` 추가
- **AI 기능이 안 됨** → `window.claude.complete`는 Claude 환경에서만 동작. 데스크탑 앱에선 자체 API 키로 직접 fetch 호출하도록 `v2/ai.jsx` 수정 필요
- **글꼴이 안 보임** → Tauri는 기본적으로 외부 폰트 fetch 가능. 인터넷 연결 없을 땐 폰트 파일을 로컬에 번들하기

## 다음 단계 아이디어

- `tauri-plugin-global-shortcut` — 전역 단축키로 다이어리 토글
- `tauri-plugin-autostart` — 부팅 시 자동 실행
- `tauri-plugin-store` — JSON 파일 기반 안정적 영속화
- System Tray — 트레이 아이콘 + 메뉴
