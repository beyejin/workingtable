# vibe diary 설치 가이드 / Install Guide

작업용 사이드 다이어리 데스크탑 앱입니다. Windows / macOS 모두 지원합니다.

## 다운로드 (Download)

최신 버전: **[Releases 페이지](https://github.com/binglehaepi/workingtable/releases/latest)**

| OS | 파일 | 비고 |
|----|------|------|
| Windows | `vibe-diary_x.y.z_x64-setup.exe` (또는 `_x64_en-US.msi`) | 설치형 |
| macOS (Apple Silicon + Intel) | `vibe-diary_x.y.z_universal.dmg` | 통합 바이너리 |

설치 후에는 새 버전이 나오면 **자동 업데이트**로 받아집니다.

---

## ⚠️ 보안 경고에 대해 (개발자 인증 없음)

이 앱은 별도의 상용 코드 서명 인증서(Windows) / Apple Developer 공증(macOS)이 **없습니다**.
그래서 설치/첫 실행 시 OS가 "알 수 없는 개발자" 경고를 띄울 수 있어요. **악성 프로그램이 아니며**, 아래 절차로 한 번만 허용하면 정상 실행됩니다.

### Windows

1. 설치 파일 실행 시 **"Windows의 PC 보호 (SmartScreen)"** 파란 창이 뜰 수 있습니다.
2. **"추가 정보"** 클릭 → **"실행"** 버튼 클릭.
3. 이후에는 경고 없이 실행됩니다.

### macOS

1. `.dmg`를 열고 앱을 **응용 프로그램** 폴더로 드래그합니다.
2. 처음 실행 시 *"개발자를 확인할 수 없어 열 수 없습니다"* 경고가 뜨면:
   - **응용 프로그램** 폴더에서 앱을 **우클릭(또는 Control+클릭) → 열기 → 열기**
   - 또는 **시스템 설정 → 개인정보 보호 및 보안** 하단의 **"확인 없이 열기"** 클릭
3. 한 번 허용하면 다음부터는 그냥 실행됩니다.

> 참고: macOS에서 `"손상되었기 때문에 열 수 없습니다"`가 뜨는 경우(격리 속성 때문),
> 터미널에서 다음을 실행하면 해제됩니다:
> ```bash
> xattr -dr com.apple.quarantine "/Applications/vibe-diary.app"
> ```

---

## English (Summary)

This app is **not** signed with a paid code-signing certificate (Windows) or Apple notarization (macOS),
so your OS may show an "unknown developer" warning on first launch. It is **not malware** — allow it once:

- **Windows**: On the SmartScreen prompt, click **More info → Run anyway**.
- **macOS**: Right-click the app in Applications → **Open → Open**, or allow it in **System Settings → Privacy & Security**.
  If it says the app is "damaged", run: `xattr -dr com.apple.quarantine "/Applications/vibe-diary.app"`.
