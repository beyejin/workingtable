/* global React, diary */
// ===========================================================
// 타이머 — 카운트다운 + 시스템 알림
// - lengthMin 단위로 순환 (다 되면 알림 + 자동 새 사이클)
// - 일시정지 / 재개 / "방금 스트레칭함" 으로 리셋
// - 알림 권한 요청 플로우 (사용자가 명시적으로 ON 했을 때만)
// - 페이지가 열려있는 동안 동작 (설치형/PWA로 래핑 시 백그라운드 가능)
// ===========================================================

const { useState, useEffect, useRef } = React;

const fmtMS = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
};

const STRETCH_TIPS = [
  "어깨 한 번 돌리고 와요",
  "목을 천천히 좌우로",
  "허리 펴고 깊게 숨 한 번",
  "손목 한 바퀴 돌리기",
  "눈 깜빡깜빡, 멀리 한 번 보기",
  "잠깐 일어서서 기지개",
  "물 한 모금 어떠세요?",
];
function randTip() { return STRETCH_TIPS[Math.floor(Math.random() * STRETCH_TIPS.length)]; }

function Timer() {
  const { state, actions } = diary.useDiary();
  const t = state.timer;
  const [, setNow] = useState(Date.now());     // 매초 강제 리렌더
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);    // {tip, at}
  const lastNotifiedRef = useRef(t.lastNotifiedAt ?? 0);

  // 매초 틱
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // 사이클 종료 감지 → 알림 + 자동 새 사이클
  useEffect(() => {
    if (!t.enabled || t.paused || !t.cycleStartedAt) return;
    const lenMs = t.lengthMin * 60 * 1000;
    const elapsed = Date.now() - t.cycleStartedAt;
    if (elapsed >= lenMs) {
      // 중복 발송 방지 (한 사이클당 1번)
      if (lastNotifiedRef.current === t.cycleStartedAt) return;
      lastNotifiedRef.current = t.cycleStartedAt;

      const tip = randTip();
      fireNotification("스트레칭 시간이에요 ♡", tip, t.notificationsGranted);
      setToast({ tip, at: Date.now() });
      actions.markNotified();

      // 자동으로 다음 사이클 시작
      actions.startCycle();
    }
  });

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(id);
  }, [toast]);

  // 남은 시간 계산
  const lenMs = t.lengthMin * 60 * 1000;
  let remaining;
  let progress;
  if (!t.cycleStartedAt) {
    remaining = lenMs;
    progress = 0;
  } else if (t.paused) {
    remaining = t.pausedRemainingMs ?? lenMs;
    progress = 1 - (remaining / lenMs);
  } else {
    const elapsed = Date.now() - t.cycleStartedAt;
    remaining = Math.max(0, lenMs - elapsed);
    progress = Math.min(1, elapsed / lenMs);
  }
  const running = !!t.cycleStartedAt && !t.paused && t.enabled;

  // 권한 요청 핸들러
  const askPermission = async () => {
    if (!("Notification" in window)) {
      alert("이 브라우저는 알림을 지원하지 않아요");
      return;
    }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    actions.setNotificationsGranted(perm === "granted");
    if (perm === "denied") {
      alert("알림이 거부되었어요. 브라우저 사이트 설정에서 허용으로 바꿔주세요.");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 메인 타이머 바 */}
      <div className="sk-box" style={{
        background: "white", padding: 8,
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <TimerDonut
          remaining={remaining}
          progress={progress}
          paused={t.paused}
          enabled={t.enabled}
          running={running}
          onClick={() => {
            // 한 번 클릭: 시작/재개. 두 번 클릭: 설정 토글
            if (!t.cycleStartedAt || t.paused) {
              if (!t.cycleStartedAt) actions.startCycle();
              else actions.resumeCycle();
            } else {
              actions.pauseCycle();
            }
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sk-label">
            {!t.enabled  ? "타이머 꺼짐" :
              !t.cycleStartedAt ? "다음 스트레칭" :
              t.paused          ? "일시정지됨" :
              "다음 스트레칭"}
          </div>
          <div className="sk-note" style={{ fontSize: 13 }}>
            {!t.enabled ? "설정에서 켜기" :
              !t.cycleStartedAt ? `${t.lengthMin}분 사이클 · ▶ 눌러 시작` :
              `${t.lengthMin}분마다 · ${t.notificationsGranted ? "🔔 알림 ON" : "🔕 화면만"}`}
          </div>
        </div>
        <button onClick={() => setSettingsOpen(o => !o)} title="설정" style={{
          all: "unset", cursor: "pointer", padding: 4,
          fontFamily: "var(--hand)", fontSize: 16, color: "var(--ink-2)",
        }}>⚙</button>
      </div>

      {/* 설정 팝오버 */}
      {settingsOpen && (
        <div className="sk-box" style={{
          position: "absolute", bottom: "100%", left: 0, right: 0,
          marginBottom: 6,
          padding: 12, background: "var(--paper)",
          boxShadow: "0 -2px 0 var(--paper-3)",
          zIndex: 30,
        }}>
          <div className="sk-label" style={{ marginBottom: 8 }}>타이머 설정</div>

          {/* ON/OFF */}
          <Row label="타이머">
            <ToggleButton on={t.enabled} onClick={() => actions.setTimerEnabled(!t.enabled)}>
              {t.enabled ? "켜짐" : "꺼짐"}
            </ToggleButton>
          </Row>

          {/* 사이클 길이 */}
          <Row label="간격">
            <div style={{ display: "flex", gap: 4 }}>
              {[15, 25, 30, 45, 60].map(min => (
                <button key={min} onClick={() => actions.setTimerLength(min)} style={{
                  all: "unset", cursor: "pointer",
                  padding: "2px 8px", borderRadius: 99,
                  border: "1.1px solid var(--ink)",
                  background: t.lengthMin === min ? "var(--pink)" : "var(--paper)",
                  fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
                }}>{min}m</button>
              ))}
            </div>
          </Row>

          {/* 시스템 알림 */}
          <Row label="시스템 알림">
            {t.notificationsGranted ? (
              <span style={{ fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink-2)" }}>
                🔔 허용됨
              </span>
            ) : (
              <button onClick={askPermission} style={{
                all: "unset", cursor: "pointer",
                padding: "2px 10px", borderRadius: 99,
                border: "1.1px solid var(--ink)",
                background: "var(--mint)",
                fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
              }}>
                권한 받기
              </button>
            )}
          </Row>

          <hr className="sk-hr" />

          {/* 컨트롤 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {t.cycleStartedAt && !t.paused && (
              <button onClick={() => actions.pauseCycle()} style={ctrlBtn}>⏸ 일시정지</button>
            )}
            {t.cycleStartedAt && t.paused && (
              <button onClick={() => actions.resumeCycle()} style={{...ctrlBtn, background: "var(--mint)"}}>▶ 재개</button>
            )}
            {!t.cycleStartedAt && (
              <button onClick={() => actions.startCycle()} style={{...ctrlBtn, background: "var(--mint)"}}>▶ 시작</button>
            )}
            {t.cycleStartedAt && (
              <button onClick={() => actions.markStretched()} style={{...ctrlBtn, background: "var(--hi)"}}>
                ✓ 방금 스트레칭함
              </button>
            )}
          </div>

          <div className="sk-cap" style={{ marginTop: 8, fontSize: 12 }}>
            팁: 도넛을 클릭해서 빠르게 일시정지/재개 가능해요
          </div>

          <hr className="sk-hr" />

          <button onClick={() => window.openRetroModal()} style={{
            ...ctrlBtn, background: "var(--mint-soft)", width: "100%", textAlign: "center",
          }}>
            ✎ 오늘 작업 마치기
          </button>
        </div>
      )}

      {/* 토스트 (알림 발송 시) */}
      {toast && (
        <div className="sk-box" style={{
          position: "absolute", bottom: "100%", left: 0, right: 0,
          marginBottom: 6, padding: 10,
          background: "var(--pink-soft)",
          boxShadow: "0 -2px 0 var(--paper-3)",
          zIndex: 25,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>♡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--hand)", fontSize: 14, fontWeight: 700 }}>스트레칭 시간이에요!</div>
              <div className="sk-note" style={{ fontSize: 13 }}>{toast.tip}</div>
            </div>
            <button onClick={() => { actions.markStretched(); setToast(null); }} style={{
              all: "unset", cursor: "pointer",
              padding: "2px 10px", borderRadius: 99,
              border: "1.1px solid var(--ink)",
              background: "var(--mint)",
              fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
            }}>✓ 함</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- 도넛 ----
function TimerDonut({ remaining, progress, paused, enabled, running, onClick }) {
  const size = 42;
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * progress;
  const color = !enabled ? "var(--ink-soft)"
              : paused   ? "var(--ink-3)"
              : "var(--pink)";

  return (
    <button onClick={onClick} title={running ? "클릭: 일시정지" : "클릭: 시작/재개"} style={{
      all: "unset", cursor: "pointer",
      position: "relative", width: size, height: size,
      flexShrink: 0,
    }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="var(--paper)" stroke="var(--paper-3)" strokeWidth="3.5" />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s linear" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "grid", placeItems: "center",
        fontFamily: "var(--mono)", fontSize: 10,
        color: "var(--ink)",
        pointerEvents: "none",
      }}>
        {!enabled ? "off" :
          paused ? "‖" :
          !running ? "▶" :
          fmtMS(remaining)}
      </div>
    </button>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span className="sk-cap" style={{ fontSize: 13, flex: 1 }}>{label}</span>
      {children}
    </div>
  );
}
function ToggleButton({ on, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      all: "unset", cursor: "pointer",
      padding: "2px 10px", borderRadius: 99,
      border: "1.1px solid var(--ink)",
      background: on ? "var(--mint)" : "var(--paper)",
      fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
    }}>{children}</button>
  );
}
const ctrlBtn = {
  all: "unset", cursor: "pointer",
  padding: "3px 12px", borderRadius: 99,
  border: "1.1px solid var(--ink)",
  background: "var(--paper)",
  fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
};

// ---- 시스템 알림 발사 ----
function fireNotification(title, body, granted) {
  if (granted && "Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification(title, {
        body,
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='28' fill='%23ffc7d4' stroke='%238a6a5e' stroke-width='2'/><text x='32' y='42' text-anchor='middle' font-size='32' fill='%238a6a5e'>♡</text></svg>",
        tag: "vibe-diary-stretch",
        silent: false,
      });
      n.onclick = () => { window.focus(); n.close(); };
      setTimeout(() => n.close(), 10000);
    } catch (e) {
      console.warn("notification failed", e);
    }
  }
}

window.Timer = Timer;
