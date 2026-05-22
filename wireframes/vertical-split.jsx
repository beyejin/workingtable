/* global React */
// ===========================================================
// Option 5 — 수직 분할 패널 (세로 사이드바, 섹션 아코디언)
// 차분하고 미니멀. 한 컬럼이지만 섹션이 명확히 위→아래로 분할.
// 윈도우 chrome은 가장 절제(거의 없음). 노트지 느낌.
// ===========================================================

function WireVerticalSplit() {
  return (
    <div className="bg-paper" style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* 미니 헤더 (XP는 흔적만) */}
      <div style={{
        height: 24,
        background: "linear-gradient(180deg, #3c7be0 0%, #1941a5 100%)",
        color: "white",
        fontFamily: "var(--hand)", fontSize: 12,
        padding: "4px 8px",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}>📔 바이브 다이어리</span>
        <span className="xp-btn" style={{ marginLeft: "auto" }}>_</span>
        <span className="xp-btn close">×</span>
      </div>

      {/* 현재 프로젝트 — 항상 위 (sticky) */}
      <div style={{ padding: "10px 14px 8px", borderBottom: "1.4px solid var(--ink)", background: "var(--hi-soft)" }}>
        <div className="sk-cap">지금 작업중 · 14:23 · 1h 47m</div>
        <div style={{ fontFamily: "var(--hand)", fontSize: 19, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
          vibe-diary.app
          <span className="sk-dot hi" />
        </div>
        <div className="sk-mono" style={{ marginTop: 1 }}>~/work/vibe-diary · git: main</div>
      </div>

      {/* 본문 — 섹션 아코디언 (위→아래) */}
      <div style={{ flex: 1, overflow: "auto" }}>

        <AccSection num="01" ttl="다음에 할 일" badge="3 남음" open>
          {[
            { t: "타이머 권한 처리", done: true },
            { t: "이메일 답장 토글", done: false },
            { t: "회고 모달 카피", done: false },
            { t: "푸시 사운드 옵션", done: false },
          ].map((x, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0" }}>
              <span className={"sk-check" + (x.done ? " done" : "")} />
              <span style={{
                fontFamily: "var(--hand)", fontSize: 15, flex: 1,
                color: x.done ? "var(--ink-3)" : "var(--ink)",
                textDecoration: x.done ? "line-through" : "none",
              }}>{x.t}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
            <span className="sk-plus">+</span>
            <span className="sk-cap">새 할 일 한 줄로…</span>
          </div>
        </AccSection>

        <AccSection num="02" ttl="고객 문의" badge="2 미답" open>
          {[
            { who: "지수", sub: "결제 안 됨", ok: false },
            { who: "박PM", sub: "회의자료 받음", ok: true },
            { who: "강아무개", sub: "환불 문의", ok: false },
            { who: "noreply", sub: "주간 리포트", ok: true },
          ].map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
              <span className={"sk-check" + (e.ok ? " done" : "")} />
              <span style={{ fontFamily: "var(--hand)", fontSize: 14, width: 60 }}>{e.who}</span>
              <span style={{ fontFamily: "var(--hand)", fontSize: 14, flex: 1, color: "var(--ink-2)" }}>{e.sub}</span>
            </div>
          ))}
        </AccSection>

        <AccSection num="03" ttl="프롬프트 함" badge="12">
          <div className="sk-cap">접혀있음 — 클릭하면 열림</div>
        </AccSection>

        <AccSection num="04" ttl="AI 세션 북마크" badge="3 이번주">
          <div className="sk-cap">접혀있음</div>
        </AccSection>

        <AccSection num="05" ttl="다른 프로젝트들" badge="2">
          {[
            { n: "studio-site v2", s: "일시정지" },
            { n: "cli-tool sandbox", s: "백로그" },
          ].map((p) => (
            <div key={p.n} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0" }}>
              <span className="sk-dot ring" />
              <span style={{ fontFamily: "var(--hand)", fontSize: 15, flex: 1, color: "var(--ink-2)" }}>{p.n}</span>
              <span className="sk-cap">{p.s}</span>
            </div>
          ))}
        </AccSection>

        <AccSection num="06" ttl="치트시트 (이 프로젝트)">
          <div className="sk-box sk-fill wobble-1" style={{ padding: 8, fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.55 }}>
            $ pnpm dev<br/>
            $ pnpm db:reset<br/>
            $ pnpm test --filter ui<br/>
            ENV → .env.local · SUPABASE_URL=…
          </div>
        </AccSection>

      </div>

      {/* 하단 항상 — 타이머 + 회고 */}
      <div style={{
        borderTop: "1.4px solid var(--ink)",
        background: "var(--paper-2)",
        padding: 10,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div className="sk-box wobble-2" style={{ background: "white", padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <div className="timer-donut" style={{ width: 42, height: 42, fontSize: 11 }}>23:14</div>
          <div style={{ flex: 1 }}>
            <div className="sk-label">다음 스트레칭</div>
            <div className="sk-note" style={{ fontSize: 13 }}>23분 뒤 · 어깨 돌리기</div>
          </div>
          <span className="sk-cap">⏸</span>
        </div>
        <div className="sk-box sk-dashed" style={{ padding: 7, textAlign: "center", background: "var(--paper)" }}>
          <span className="sk-note" style={{ fontSize: 14 }}>✎ 오늘 회고 한 줄 쓰기</span>
        </div>
      </div>

      {/* 콜아웃 */}
      <div className="sk-callout" style={{ top: 36, right: -120, width: 130 }}>
        <span className="arrow">↤</span>
        sticky 현재 프로젝트<br/>(스크롤해도 고정)
      </div>
    </div>
  );
}

function AccSection({ num, ttl, badge, open, children }) {
  return (
    <div style={{ borderBottom: "1.4px dashed var(--ink-2)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px 6px",
        background: open ? "transparent" : "var(--paper-2)",
      }}>
        <span style={{ fontFamily: "var(--hand-2)", fontSize: 16, color: "var(--ink-3)" }}>{open ? "▾" : "▸"}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>{num}</span>
        <span style={{ fontFamily: "var(--hand)", fontSize: 16, flex: 1 }}>{ttl}</span>
        {badge && <span className="sk-badge">{badge}</span>}
      </div>
      {open && (
        <div style={{ padding: "0 14px 10px" }}>{children}</div>
      )}
    </div>
  );
}

window.WireVerticalSplit = WireVerticalSplit;
