/* global React */
// ===========================================================
// Option 4 — MDI 윈도우 (창 안의 창)
// 진한 XP 감성. 하나의 큰 메인 창 안에 자식창들이 떠다님.
// 좌측 트리메뉴로 도구 선택, 우측에 자식창 캔버스.
// ===========================================================

function WireMdiWindow() {
  return (
    <div style={{ width: "100%", height: "100%", padding: 12, background: "#bcb799" }}>

      {/* 메인 XP 창 */}
      <div className="xp-window" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>

        {/* 타이틀바 */}
        <div className="xp-titlebar" style={{ fontSize: 15 }}>
          <span className="ttl">바이브 다이어리 — vibe-diary.app</span>
          <span className="xp-btn">_</span>
          <span className="xp-btn">▢</span>
          <span className="xp-btn close">×</span>
        </div>

        {/* 메뉴바 */}
        <div style={{
          background: "#ece9d8",
          padding: "3px 8px",
          fontFamily: "var(--hand)", fontSize: 13,
          color: "var(--ink-2)",
          display: "flex", gap: 14,
          borderBottom: "1px solid #aca899",
        }}>
          {["파일(F)", "편집(E)", "프로젝트(P)", "보기(V)", "도구(T)", "도움말(H)"].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>

        {/* 툴바 */}
        <div style={{
          background: "#ece9d8",
          padding: "4px 8px",
          display: "flex", gap: 6, alignItems: "center",
          borderBottom: "1px solid #aca899",
        }}>
          {["+ 프로젝트", "+ 할 일", "+ 프롬프트", "+ 메일", "▶ 타이머"].map((b) => (
            <span key={b} className="sk-badge" style={{ background: "white", borderColor: "#888" }}>{b}</span>
          ))}
          <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)" }}>
            오늘 1h 47m · 스트레칭 23m 뒤
          </span>
        </div>

        {/* 본문 — 좌 트리 + 우 MDI */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

          {/* 트리 메뉴 */}
          <div style={{
            width: 200,
            background: "var(--paper-2)",
            borderRight: "1px solid #aca899",
            padding: 10,
            fontFamily: "var(--hand)", fontSize: 14,
            overflow: "auto",
          }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: "var(--ink-2)" }}>▾ 진행중 프로젝트</div>
              <div style={{ paddingLeft: 14, color: "var(--ink)" }}>
                <div style={{ background: "var(--xp-blue)", color: "white", padding: "1px 6px", borderRadius: 2 }}>● vibe-diary.app</div>
                <div style={{ padding: "1px 6px" }}>○ studio-site v2</div>
                <div style={{ padding: "1px 6px" }}>○ cli-tool sandbox</div>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ color: "var(--ink-2)" }}>▾ 도구</div>
              <div style={{ paddingLeft: 14 }}>
                <div>📝 다음에 할 일</div>
                <div>💬 프롬프트 함</div>
                <div>📬 이메일</div>
                <div>🔖 AI 세션</div>
                <div>⏱ 타이머</div>
                <div>✎ 회고 노트</div>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ color: "var(--ink-2)" }}>▸ 보관함</div>
            </div>

            <div className="sk-cap" style={{ marginTop: 16, color: "var(--ink-3)" }}>← 좌측에서 도구 더블클릭 → 자식창 열림</div>
          </div>

          {/* MDI 작업영역 (자식창들이 떠다님) */}
          <div style={{
            flex: 1, position: "relative",
            background: "linear-gradient(180deg, #4d8fd8 0%, #2a6cc4 100%)",
            overflow: "hidden",
          }}>
            {/* 살짝 점박이 */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }} />

            {/* 자식창 A — 프로젝트 메타 */}
            <div className="xp-window xp-mini" style={{ position: "absolute", top: 12, left: 14, width: 260 }}>
              <div className="xp-titlebar">
                <span className="ttl">vibe-diary.app · 정보</span>
                <span className="xp-btn">_</span><span className="xp-btn close">×</span>
              </div>
              <div className="xp-body" style={{ fontSize: 12 }}>
                <div className="sk-label">스택</div>
                <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                  <span className="sk-badge">Next.js</span>
                  <span className="sk-badge">Supabase</span>
                  <span className="sk-badge">Tailwind</span>
                </div>
                <hr className="sk-hr" />
                <div className="sk-label">링크</div>
                <div className="sk-mono">→ github · figma · spec</div>
                <hr className="sk-hr" />
                <div className="sk-label">치트</div>
                <div className="sk-mono">pnpm dev<br/>pnpm db:reset</div>
              </div>
            </div>

            {/* 자식창 B — TODO (활성) */}
            <div className="xp-window" style={{ position: "absolute", top: 24, left: 290, width: 260, boxShadow: "3px 4px 0 rgba(0,0,0,0.3)" }}>
              <div className="xp-titlebar">
                <span className="ttl">📝 다음에 할 일</span>
                <span className="xp-btn">_</span><span className="xp-btn">▢</span><span className="xp-btn close">×</span>
              </div>
              <div className="xp-body">
                {[
                  { t: "타이머 권한 처리", done: true },
                  { t: "이메일 답장 토글", done: false },
                  { t: "회고 모달 카피", done: false },
                  { t: "푸시 사운드 옵션", done: false },
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
            </div>

            {/* 자식창 C — 프롬프트 */}
            <div className="xp-window xp-mini" style={{ position: "absolute", top: 200, left: 50, width: 280 }}>
              <div className="xp-titlebar">
                <span className="ttl">💬 프롬프트 함</span>
                <span className="xp-btn close">×</span>
              </div>
              <div className="xp-body" style={{ padding: 8 }}>
                {[
                  "이 함수 리팩토링…",
                  "에러 메시지 친절하게",
                  "접근성 검토",
                  "커밋 메시지 초안",
                ].map((p, i) => (
                  <div key={i} className="sk-box wobble-1" style={{ padding: "3px 6px", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                    <span className="sk-mono" style={{ color: "var(--ink-3)" }}>#{i+1}</span>
                    <span style={{ fontFamily: "var(--hand-2)", fontSize: 14, flex: 1 }}>{p}</span>
                    <span className="sk-cap">📋</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 자식창 D — 이메일 */}
            <div className="xp-window xp-mini" style={{ position: "absolute", top: 215, left: 360, width: 280 }}>
              <div className="xp-titlebar">
                <span className="ttl">📬 고객 문의</span>
                <span className="xp-btn close">×</span>
              </div>
              <div className="xp-body" style={{ padding: 0 }}>
                {[
                  { who: "지수", sub: "결제 안 됨", ok: false, hot: true },
                  { who: "박PM", sub: "회의자료", ok: true },
                  { who: "강아무개", sub: "환불 문의", ok: false, hot: true },
                ].map((e, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 8px",
                    background: e.hot ? "#fff4b0" : "transparent",
                    borderBottom: i < 2 ? "1px solid #e8e3d4" : "none",
                  }}>
                    <span className={"sk-check" + (e.ok ? " done" : "")} />
                    <span style={{ fontFamily: "var(--hand)", fontSize: 13, width: 55 }}>{e.who}</span>
                    <span style={{ fontFamily: "var(--hand)", fontSize: 13, flex: 1, color: "var(--ink-2)" }}>{e.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 우상단 타이머 */}
            <div className="xp-window xp-mini" style={{ position: "absolute", top: 12, right: 14, width: 170 }}>
              <div className="xp-titlebar">
                <span className="ttl">⏱ 스트레칭</span>
                <span className="xp-btn close">×</span>
              </div>
              <div className="xp-body" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className="timer-donut" style={{ width: 44, height: 44, fontSize: 11 }}>23:14</div>
                <div>
                  <div className="sk-label">다음</div>
                  <div className="sk-note" style={{ fontSize: 13 }}>23m</div>
                </div>
              </div>
            </div>

            {/* 콜아웃 (메인 캔버스 안) */}
            <div className="sk-callout" style={{ bottom: 40, right: 18, color: "white", textAlign: "right", textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>
              자식창 자유 배치·접기·크기조정<br/>
              <span className="arrow">↘</span>
            </div>
          </div>
        </div>

        {/* 상태바 */}
        <div style={{
          background: "#ece9d8",
          borderTop: "1px solid #aca899",
          padding: "3px 10px",
          fontFamily: "var(--mono)", fontSize: 11,
          color: "var(--ink-2)",
          display: "flex", gap: 14,
        }}>
          <span>준비됨</span>
          <span>· 자식창 4 / 도구 6</span>
          <span style={{ marginLeft: "auto" }}>오늘 1h 47m</span>
          <span>· 14:23</span>
        </div>
      </div>
    </div>
  );
}

window.WireMdiWindow = WireMdiWindow;
