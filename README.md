# todoary

작업할 때 화면 옆에 띄워두는 **투명 사이드 다이어리** 데스크탑 앱입니다.
할 일, 메모, 문의 메일, 작업 시간, 달력 기록, 배경 음악, 꾸미기 설정을 한 창에서 관리합니다.

> A translucent side-dock diary widget for focused work. It keeps tasks, memos,
> inbox drafts, work sessions, calendar notes, background music, and visual themes
> in one slim desktop window.

Windows와 macOS를 지원하며, 릴리스 빌드에는 자동 업데이트가 포함됩니다.

---

## 주요 기능

- **할 일**: 해야 할 일, 한 일, 반복 할 일, 하위 작업 관리
- **메모**: 날짜별 메모와 작업 연결 메모 관리
- **습관**: 간단한 습관 추적
- **문의 메일**: 받은 메일 붙여넣기, 답장 초안 작성, 답장 여부 기록
- **달력/오늘 보기**: 작업 시간, 완료한 일, 메모를 날짜별로 확인
- **배경 음악**: YouTube 기반 작업 음악 플레이어
- **타이머**: 포모도로/작업 시간 추적
- **꾸미기**: 테마 프리셋, 그라데이션, 포인트 색, 도크 위치, 앱 높이 설정
- **다국어**: 한국어, English, 中文, 日本語
- **데스크탑 모드**: 투명하고 테두리 없는 Tauri 창으로 실행
- **자동 업데이트**: 새 릴리스가 있으면 다음 실행 시 업데이트 적용

---

## 설치

최신 설치 파일은 GitHub Releases에서 받을 수 있습니다.

**Releases**: <https://github.com/binglehaepi/workingtable/releases/latest>

| OS | 설치 파일 |
| --- | --- |
| Windows | `todoary_x.y.z_x64-setup.exe` 또는 `_x64_en-US.msi` |
| macOS | `todoary_x.y.z_universal.dmg` |

### 보안 경고

이 프로젝트는 현재 상용 코드 서명 인증서와 Apple 공증을 사용하지 않습니다.
첫 실행 시 OS 보안 경고가 나올 수 있습니다.

**Windows**

1. SmartScreen의 "Windows의 PC 보호" 화면에서 **추가 정보**를 누릅니다.
2. **실행**을 선택합니다.

**macOS**

1. `.dmg`를 열고 `todoary.app`을 응용 프로그램 폴더로 옮깁니다.
2. 첫 실행 시 앱을 우클릭 또는 Control+클릭한 뒤 **열기**를 선택합니다.
3. `"손상되어 열 수 없습니다"`가 표시되면 터미널에서 격리 속성을 제거합니다.

```bash
xattr -dr com.apple.quarantine "/Applications/todoary.app"
```

자세한 설치 안내는 [INSTALL.md](INSTALL.md)를 참고하세요.

---

## 개발 환경

필요한 도구:

- Node.js 20 권장
- npm
- Rust stable
- Tauri 2 CLI
- macOS 빌드: Xcode Command Line Tools
- Windows 빌드: Visual Studio Build Tools 또는 Tauri 권장 Windows 환경

의존성 설치:

```bash
npm install
```

개발 실행:

```bash
npm run dev
```

릴리스 빌드:

```bash
npm run build
```

프론트엔드 자산만 `dist/`로 복사:

```bash
npm run dist
```

---

## 기술 스택

- **Tauri 2**: Rust + 시스템 WebView 기반 데스크탑 패키징
- **React 18 UMD**: 번들러 없이 브라우저 전역 객체로 사용
- **Babel standalone**: `.jsx` 파일을 런타임에 변환
- **localStorage**: 앱 데이터 저장소
- **Tauri plugins**: updater, opener, notification, dialog
- **macOS native integration**: Reminders 연동, YouTube child webview

이 프로젝트는 일반적인 React 번들러 구조가 아닙니다. `todoary.html`이 React, Babel,
전역 유틸, 각 화면 모듈을 순서대로 로드합니다. 따라서 `v2/*.jsx` 파일의 로드 순서는
런타임 의존성에 영향을 줍니다.

---

## 프로젝트 구조

```text
.
├── todoary.html                  # 앱 진입점, vendor와 v2 모듈 로드
├── styles.css                    # 디자인 토큰, 공통 스타일
├── tweaks-panel.jsx              # 테마/도크/설정 패널
├── v2/                           # bundleless React 앱 코드
│   ├── app/                      # 앱 셸, 도크 레이아웃, 탭 라우팅
│   ├── features/                 # 기능별 화면과 관련 모듈
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── habit/
│   │   ├── mail/
│   │   ├── memo/
│   │   ├── music/
│   │   ├── prompt/
│   │   ├── retro/
│   │   ├── room/
│   │   ├── timer/
│   │   ├── today/
│   │   └── todo/
│   ├── i18n/                     # 다국어 처리
│   ├── shared/                   # 여러 화면에서 쓰는 공통 UI/유틸
│   └── store/                    # localStorage 기반 데이터 레이어
├── vendor/                       # React, ReactDOM, Babel, Firebase 설정
├── asset/                        # 앱에서 사용하는 이미지 자산
├── scripts/
│   ├── build-dist.mjs            # Tauri frontendDist 생성
│   ├── dev-server.py             # 정적 개발 서버
│   └── make-latest-json.mjs      # 업데이트 메타데이터 생성 보조
├── src-tauri/
│   ├── tauri.conf.json           # Tauri 앱, 창, 번들, updater 설정
│   ├── Cargo.toml                # Rust 의존성
│   ├── capabilities/default.json # Tauri 권한 allowlist
│   └── src/main.rs               # Tauri 명령, 플러그인, macOS 연동
├── wireframes/                   # UI 와이어프레임/실험안
├── dist/                         # 빌드 전처리로 생성되는 프론트엔드 산출물
└── .github/workflows/release.yml # 태그 기반 Windows/macOS 릴리스 빌드
```

---

## 데이터 저장

앱 데이터는 브라우저 `localStorage`에 저장됩니다.

- 기본 키: `todoary.v1`
- 앱 이름 변경 전 데이터 마이그레이션 키: `vibe-diary.v1`
- 마이그레이션 진단 키: `todoary.migration.diag`

`v2/store/store.jsx`는 첫 실행 seed, 기존 데이터 마이그레이션, 반복 할 일 생성,
메모/타이머/프로젝트 등 주요 상태 변경 액션을 관리합니다.

---

## Tauri 기능

`src-tauri/src/main.rs`에서 제공하는 주요 기능:

- 백업 JSON 파일 저장 대화상자
- macOS Reminders 목록 조회와 항목 추가
- macOS 네이티브 YouTube child webview 제어
- 릴리스 빌드 자동 업데이트 확인
- macOS 메뉴바와 도크 미니화 단축키
- 알림, 파일/URL 열기, 다이얼로그 플러그인 초기화

프론트엔드에서 Tauri API를 사용할 때는 `src-tauri/capabilities/default.json`의
권한 allowlist도 함께 확인해야 합니다.

---

## 릴리스

릴리스는 `v*` 태그 push로 GitHub Actions에서 빌드됩니다.

```bash
git tag v0.7.19
git push origin v0.7.19
```

릴리스 전 확인할 항목:

- `package.json` 버전
- `src-tauri/Cargo.toml` 버전
- `src-tauri/tauri.conf.json` 버전
- `CHANGELOG.md`
- updater용 signing key와 `latest.json` 생성/업로드 흐름

워크플로는 Windows 설치 파일과 macOS universal DMG를 빌드하고 draft release에
업로드합니다.

---

## 문제 해결

**개발 중 화면이 예전 코드로 보일 때**

`localhost`에서 실행하면 `todoary.html`의 개발용 cache buster가 `.jsx` 스크립트에
타임스탬프를 붙입니다. 그래도 문제가 있으면 브라우저/WebView 캐시를 비우고 다시 실행하세요.

**Tauri 빌드에 프론트엔드 변경이 반영되지 않을 때**

```bash
npm run dist
npm run build
```

`dist/`가 `todoary.html`, `styles.css`, `v2/`, `vendor/`, `asset/`을 포함하는지 확인하세요.

**macOS에서 Reminders 연동이 실패할 때**

시스템 설정의 개인정보 보호 권한에서 앱 또는 터미널이 Reminders/자동화 권한을 받았는지
확인하세요.

**업데이트가 적용되지 않을 때**

릴리스가 draft 상태이면 최신 버전으로 노출되지 않습니다. updater endpoint,
서명된 updater artifact, release publish 상태를 확인하세요.
