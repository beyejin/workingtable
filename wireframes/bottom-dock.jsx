/* global React */
// ===========================================================
// Option 3 — 하단 도크 (트레이)
// 화면 아래 가로로 긴 패널. 작업 중인 코드 에디터 아래에 깔리는 느낌.
// 평소엔 접혀 있고, 위로 펼치면 카드 패널들이 펼쳐짐.
// 본 와이어프레임은 "펼쳐진 상태" + 작업표시줄.
// ===========================================================

function WireBottomDock() {
  return (
    <div className="bg-paper" style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>

      {/* 상단 — 에디터 영역 (페이크 = 작업중인 코드 자리) */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0, height: 70,
        background: "#2a2a2a", color: "#d8d2c2",
        fontFamily: "var(--mono)", fontSize: 11,
        padding: "10px 16px",
        borderBottom: "2px solid #1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        opacity: 0.85,
      }}>
        <div>
          <div style={{ opacity: 0.55 }}>// 작업중인 IDE / 브라우저 (참고용)</div>
          <div>vibe-diary / src / components / Timer.tsx</div>
        </div>
        <div className="sk-cap" style={{ color: "#bdb6a3" }}>← 다이어리는 화면 하단에 도킹 ↓</div>
      </div>

      {/* 도크 본체 */}
      <div style={{
        position: "absolute", left: 8, right: 8, bottom: 32, top: 84,
        border: "1.8px solid var(--ink)",
        borderRadius: "8px 8px 4px 4px",
        background: "var(--paper)",
        boxShadow: "2px 3px 0 rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* 도크 헤더 (탭 + 펼침 화살표) */}
        <div style={{
          height: 32,
          background: "linear-gradient(180deg, #3c7be0 0%, #1941a5 100%)",
          color: "white",
          padding: "0 10px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontFamily: "var(--hand)", fontSize: 14, textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}>바이브 다이어리 — 트레이</span>
          <div style={{ display: "flex", gap: 4, marginLeft: 10 }}>
            {["프로젝트", "TODO", "프롬프트", "이메일", "AI 세션", "회고"].map((t, i) => (
              <span key={t} style={{
                fontFamily: "var(--hand)", fontSize: 12,
                background: i === 0 ? "var(--paper)" : "rgba(255,255,255,0.18)",
                color: i === 0 ? "var(--ink)" : "white",
                padding: "3px 8px", borderRadius: "4px 4px 0 0",
              }}>{t}</span>
            ))}
          </div>
          <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, opacity: 0.8 }}>1h 47m today</span>
          <span className="xp-btn" style={{ width: 22 }}>▾</span>
        </div>

        {/* 도크 컨텐츠 — 5개 카드 가로 배치 */}
        <div style={{ flex: 1, padding: 12, display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr 0.9fr", gap: 10, overflow: "hidden" }}>

          {/* 카드 1 — 현재 프로젝트 */}
          <div className="sk-box wobble-1 sk-double" style={{ padding: 10, background: "var(--hi)" }}>
            <div className="sk-label">현재 프로젝트</div>
            <div style={{ fontFamily: "var(--hand)", fontSize: 18, marginTop: 2 }}>vibe-diary.app</div>
            <div className="sk-mono" style={{ marginTop: 2 }}>~/work/vibe-diary</div>
            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
              <span className="sk-badge">Next.js</span>
              <span className="sk-badge">Supabase</span>
            </div>
            <hr className="sk-hr" />
            <div className="sk-label">링크</div>
            <div className="sk-mono">→ github / figma / spec</div>
            <hr className="sk-hr" />
            <div className="sk-label">치트</div>
            <div className="sk-mono">pnpm dev · db:reset</div>
          </div>

          {/* 카드 2 — TODO */}
          <div className="sk-box wobble-2" style={{ padding: 10 }}>
            <div className="sec-head"><span className="num">02</span><span className="ttl">다음에 할 일</span><span className="more">+ 추가</span></div>
            {[
              { t: "타이머 권한 처리", done: true },
              { t: "이메일 답장 토글", done: false },
              { t: "회고 모달 카피", done: false },
              { t: "푸시 사운드 옵션", done: false },
              { t: "사이드바 폭 메모", done: false },
            ].map((x, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                <span className={"sk-check" + (x.done ? " done" : "")} />
                <span style={{
                  fontFamily: "var(--hand)", fontSize: 14,
                  color: x.done ? "var(--ink-3)" : "var(--ink)",
                  textDecoration: x.done ? "line-through" : "none",
                }}>{x.t}</span>
              </div>
            ))}
          </div>

          {/* 카드 3 — 프롬프트 함 */}
          <div className="sk-box wobble-3" style={{ padding: 10 }}>
            <div className="sec-head"><span className="num">03</span><span className="ttl">프롬프트 함</span><span className="more">12</span></div>
            {[
              "이 함수 리팩토링하면서 테스트…",
              "에러 메시지 친절하게",
              "이 컴포넌트 접근성 검토",
              "커밋 메시지 한 줄 초안",
            ].map((p, i) => (
              <div key={i} className="sk-box sk-fill" style={{ padding: "3px 6px", marginBottom: 4, display: "flex", alignItems: "center", gap: 5, borderRadius: 3 }}>
                <span className="sk-mono" style={{ color: "var(--ink-3)" }}>#{i+1}</span>
                <span style={{ fontFamily: "var(--hand-2)", fontSize: 14, flex: 1 }}>{p}</span>
                <span className="sk-cap">📋</span>
              </div>
            ))}
          </div>

          {/* 카드 4 — 이메일 */}
          <div className="sk-box wobble-1" style={{ padding: 10 }}>
            <div className="sec-head"><span className="num">04</span><span className="ttl">이메일 문의</span><span className="more">2 미답</span></div>
            {[
              { who: "지수", sub: "결제 안 됨", ok: false, hot: true },
              { who: "박PM", sub: "회의자료 받음", ok: true },
              { who: "강아무개", sub: "환불 문의", ok: false, hot: true },
              { who: "noreply", sub: "주간 리포트", ok: true },
            ].map((e, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "2px 4px",
                background: e.hot ? "#fff4b0" : "transparent",
                borderRadius: 2,
              }}>
                <span className={"sk-check" + (e.ok ? " done" : "")} />
                <span style={{ fontFamily: "var(--hand)", fontSize: 13, width: 45 }}>{e.who}</span>
                <span style={{ fontFamily: "var(--hand)", fontSize: 13, flex: 1, color: "var(--ink-2)" }}>{e.sub}</span>
              </div>
            ))}
          </div>

          {/* 카드 5 — 타이머 + AI 북마크 + 회고 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="sk-box wobble-2" style={{ padding: 8, background: "white", display: "flex", gap: 8, alignItems: "center" }}>
              <div className="timer-donut" style={{ width: 42, height: 42, fontSize: 11 }}>23:14</div>
              <div style={{ flex: 1 }}>
                <div className="sk-label">스트레칭</div>
                <div className="sk-note" style={{ fontSize: 12 }}>23분 뒤</div>
              </div>
            </div>

            <div className="sk-box wobble-1" style={{ padding: 8, flex: 1 }}>
              <div className="sk-label">AI 세션 북마크</div>
              {[
                { d: "5/19", t: "Auth 흐름", ok: true },
                { d: "5/18", t: "Edge fn", ok: true },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0" }}>
                  <span className="sk-mono" style={{ width: 30 }}>{s.d}</span>
                  <span style={{ fontFamily: "var(--hand)", fontSize: 13, flex: 1 }}>{s.t}</span>
                  <span className={"sk-dot " + (s.ok ? "ok" : "ring")} />
                </div>
              ))}
            </div>

            <div className="sk-box sk-dashed" style={{ padding: 8, textAlign: "center", background: "var(--paper-2)" }}>
              <span className="sk-note" style={{ fontSize: 13 }}>오늘 회고 ✎</span>
            </div>
          </div>
        </div>
      </div>

      {/* 작업표시줄 */}
      <div className="xp-taskbar" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 28 }}>
        <span className="xp-start">시작</span>
        <span style={{ opacity: 0.85 }}>VS Code</span>
        <span style={{ opacity: 0.55 }}>|</span>
        <span style={{ opacity: 0.85 }}>Chrome — localhost:3000</span>
        <span style={{ opacity: 0.55 }}>|</span>
        <span style={{
          background: "var(--hi)", color: "var(--ink)",
          padding: "1px 8px", borderRadius: 3,
          fontFamily: "var(--hand)", fontSize: 12,
        }}>♥ 다이어리 (도킹됨)</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11 }}>14:23 · 다음 스트레칭 23m</span>
      </div>

      {/* 콜아웃 */}
      <div className="sk-callout" style={{ top: 78, right: 12 }}>
        <span className="arrow">↓</span>
        탭 누르면<br/>해당 카드만 펼침
      </div>
      <div className="sk-callout" style={{ bottom: 36, left: 10 }}>
        <span className="arrow">↘</span>
        ▾ 누르면 트레이로 접힘
      </div>
    </div>
  );
}

window.WireBottomDock = WireBottomDock;
