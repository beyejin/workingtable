/* global React */
// ===========================================================
// Option 1 — 클래식 XP 데스크탑
// 데스크탑 바탕에 메모창들이 떠다니는 형태.
// 각 창이 독립적인 도구 (프로젝트 / TODO / 프롬프트 / 이메일 / 회고)
// 우하단 트레이에 스트레칭 타이머.
// ===========================================================

function WireDesktopClassic() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
         className="bg-desktop">

      {/* 바탕 그리드 점들 (XP 'Bliss' 대신 흐릿한 점) */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }} />

      {/* 데스크탑 아이콘들 (좌상단) */}
      <div style={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 18 }}>
        {[
          { name: "내 프로젝트" },
          { name: "프롬프트 함" },
          { name: "회고 노트" },
          { name: "휴지통" },
        ].map((d) => (
          <div key={d.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 70 }}>
            <div style={{
              width: 36, height: 32,
              border: "1.6px solid #1a1a1a",
              background: "#fafaf6",
              borderRadius: 3,
              boxShadow: "1.5px 1.5px 0 rgba(0,0,0,0.25)",
            }} />
            <div style={{
              fontFamily: "var(--hand)",
              color: "white",
              fontSize: 12,
              marginTop: 4,
              textShadow: "1px 1px 0 rgba(0,0,0,0.45)",
              textAlign: "center",
              lineHeight: 1.05,
            }}>{d.name}</div>
          </div>
        ))}
      </div>

      {/* === 창 1: 현재 프로젝트 === */}
      <div className="xp-window" style={{ position: "absolute", top: 50, left: 140, width: 360 }}>
        <div className="xp-titlebar">
          <span className="ttl">현재 작업중 — vibe-diary.app</span>
          <span className="xp-btn">_</span>
          <span className="xp-btn">▢</span>
          <span className="xp-btn close">×</span>
        </div>
        <div className="xp-body">
          <div className="sk-label" style={{ marginBottom: 4 }}>STACK</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {["Next.js", "Supabase", "Tailwind"].map(s => (
              <span key={s} className="sk-badge">{s}</span>
            ))}
          </div>
          <div className="sk-label" style={{ marginBottom: 4 }}>LINKS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div className="sk-mono">→ github.com/me/vibe-diary</div>
            <div className="sk-mono">→ figma.com/file/xK29…</div>
            <div className="sk-mono">→ notion.so/spec-v2</div>
          </div>
          <hr className="sk-hr" />
          <div className="sk-note" style={{ color: "var(--ink-2)" }}>
            "MDI 자식창 드래그가 좀 끊김 — fix 필요"
          </div>
        </div>
      </div>

      {/* === 창 2: TODO === */}
      <div className="xp-window" style={{ position: "absolute", top: 90, left: 530, width: 280 }}>
        <div className="xp-titlebar">
          <span className="ttl">📝 다음에 할 일</span>
          <span className="xp-btn">_</span>
          <span className="xp-btn">▢</span>
          <span className="xp-btn close">×</span>
        </div>
        <div className="xp-body" style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { t: "타이머 알림 권한 처리", done: true },
            { t: "이메일 답장 토글 UI", done: false },
            { t: "프롬프트 즐겨찾기 정렬", done: false },
            { t: "회고 모달 카피 다듬기", done: false },
          ].map((x, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span className={"sk-check" + (x.done ? " done" : "")} />
              <span style={{
                fontFamily: "var(--hand)",
                fontSize: 15,
                color: x.done ? "var(--ink-3)" : "var(--ink)",
                textDecoration: x.done ? "line-through" : "none",
              }}>{x.t}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span className="sk-plus">+</span>
            <span className="sk-cap">새 항목…</span>
          </div>
        </div>
      </div>

      {/* === 창 3: 프롬프트 함 === */}
      <div className="xp-window" style={{ position: "absolute", top: 260, left: 60, width: 320 }}>
        <div className="xp-titlebar">
          <span className="ttl">💬 자주 쓰는 프롬프트</span>
          <span className="xp-btn">_</span>
          <span className="xp-btn">▢</span>
          <span className="xp-btn close">×</span>
        </div>
        <div className="xp-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "이 함수 리팩토링하면서 테스트 같이…",
            "에러 메시지 친절하게 바꿔줘",
            "이 컴포넌트 접근성 검토",
            "커밋 메시지 한 줄 초안",
          ].map((p, i) => (
            <div key={i} className="sk-box wobble-1" style={{ padding: "6px 8px", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="sk-mono" style={{ color: "var(--ink-3)" }}>#{i+1}</span>
              <span className="sk-note" style={{ fontSize: 15, flex: 1, color: "var(--ink)" }}>{p}</span>
              <span className="sk-cap">📋</span>
            </div>
          ))}
        </div>
      </div>

      {/* === 창 4: AI 세션 북마크 === */}
      <div className="xp-window xp-mini" style={{ position: "absolute", top: 280, left: 420, width: 280 }}>
        <div className="xp-titlebar">
          <span className="ttl">🔖 AI 세션 북마크</span>
          <span className="xp-btn close">×</span>
        </div>
        <div className="xp-body" style={{ padding: 8 }}>
          {[
            { d: "5/19", t: "Auth 흐름 설계 — 굿", ok: true },
            { d: "5/18", t: "Edge 함수 디버깅", ok: true },
            { d: "5/17", t: "초기 스키마", ok: false },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: i<2 ? "1px dashed #cfcabc" : "none" }}>
              <span className="sk-mono">{s.d}</span>
              <span style={{ fontFamily: "var(--hand)", fontSize: 14, flex: 1 }}>{s.t}</span>
              <span className={"sk-dot " + (s.ok ? "ok" : "ring")} />
            </div>
          ))}
        </div>
      </div>

      {/* === 창 5: 이메일 === */}
      <div className="xp-window" style={{ position: "absolute", top: 440, left: 360, width: 360 }}>
        <div className="xp-titlebar">
          <span className="ttl">📬 고객 문의</span>
          <span className="xp-btn">_</span>
          <span className="xp-btn">▢</span>
          <span className="xp-btn close">×</span>
        </div>
        <div className="xp-body" style={{ padding: 0 }}>
          {[
            { who: "지수 @studio", sub: "결제 안 됨", ok: false, hot: true },
            { who: "박PM", sub: "회의자료 받음", ok: true, hot: false },
            { who: "noreply@…", sub: "주간 리포트", ok: true, hot: false },
            { who: "강아무개", sub: "환불 문의", ok: false, hot: true },
          ].map((e, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 10px",
              borderBottom: i<3 ? "1px solid #e8e3d4" : "none",
              background: e.hot ? "#fff8d8" : "transparent",
            }}>
              <span className={"sk-check" + (e.ok ? " done" : "")} />
              <span style={{ fontFamily: "var(--hand)", fontSize: 14, width: 100, color: "var(--ink-2)" }}>{e.who}</span>
              <span style={{ fontFamily: "var(--hand)", fontSize: 14, flex: 1 }}>{e.sub}</span>
              {e.hot && <span className="sk-badge hi">미답</span>}
            </div>
          ))}
        </div>
      </div>

      {/* === 콜아웃 (손글씨 화살표) === */}
      <div className="sk-callout" style={{ top: 22, right: 230, width: 200, color: "white", textAlign: "right" }}>
        창 닫고/열고/배치 자유로움 ↘
      </div>
      <div className="sk-callout" style={{ top: 510, left: 30, width: 200, color: "white" }}>
        ↗ 메모창들이 각각 독립<br/>저장 위치 = 데스크탑
      </div>

      {/* === 우하단 타이머 / 스트레칭 푸시 미리보기 === */}
      <div style={{ position: "absolute", bottom: 40, right: 16, width: 240 }}>
        <div className="sk-box wobble-2" style={{ background: "#fff", padding: 8, display: "flex", gap: 8, alignItems: "center", boxShadow: "2px 2px 0 rgba(0,0,0,0.25)" }}>
          <div className="timer-donut">23:14</div>
          <div style={{ flex: 1 }}>
            <div className="sk-label">스트레칭 알림</div>
            <div className="sk-note" style={{ fontSize: 14 }}>23분 뒤 — 잠깐 어깨 돌리기</div>
          </div>
        </div>
      </div>

      {/* === XP 작업표시줄 === */}
      <div className="xp-taskbar" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 28 }}>
        <span className="xp-start">시작</span>
        <span style={{ opacity: 0.85 }}>vibe-diary.app</span>
        <span style={{ opacity: 0.55 }}>|</span>
        <span style={{ opacity: 0.85 }}>다음에 할 일</span>
        <span style={{ opacity: 0.55 }}>|</span>
        <span style={{ opacity: 0.85 }}>프롬프트 함</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11 }}>14:23 · 작업 1h 47m</span>
      </div>
    </div>
  );
}

window.WireDesktopClassic = WireDesktopClassic;
