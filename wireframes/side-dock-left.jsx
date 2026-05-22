/* global React */
// ===========================================================
// Option 2 — 왼쪽 사이드 도크
// 화면 왼쪽에 세로로 길게 붙는 단일 패널.
// 위→아래로 스크롤하며 모든 섹션 한눈에.
// 각 섹션은 노트 종이처럼.
// ===========================================================

function WireSideDockLeft() {
  return (
    <div className="bg-paper" style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", padding: "14px 16px 14px 16px" }}>

      {/* 상단 — 도크 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          border: "1.6px solid var(--ink)", background: "var(--hi)",
          display: "grid", placeItems: "center", fontFamily: "var(--hand)", fontSize: 16,
        }}>v</div>
        <div style={{ fontFamily: "var(--hand)", fontSize: 18 }}>바이브 다이어리</div>
        <span className="sk-cap" style={{ marginLeft: "auto" }}>도킹됨 ↤</span>
      </div>

      {/* 현재 프로젝트 카드 (강조) */}
      <div className="sk-box wobble-1 sk-double" style={{ padding: 10, background: "var(--hi)", marginBottom: 12 }}>
        <div className="sk-label" style={{ color: "var(--ink)" }}>지금 작업중</div>
        <div style={{ fontFamily: "var(--hand)", fontSize: 19, marginTop: 2 }}>vibe-diary.app</div>
        <div className="sk-mono" style={{ marginTop: 2 }}>~/work/vibe-diary</div>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <span className="sk-badge">Next.js</span>
          <span className="sk-badge">Supabase</span>
          <span className="sk-badge">Tailwind</span>
        </div>
      </div>

      {/* 섹션: 진행중 프로젝트들 */}
      <Section num="01" ttl="진행중 프로젝트" more="3">
        {[
          { n: "vibe-diary.app", s: "활성", active: true },
          { n: "studio-site v2", s: "일시정지" },
          { n: "cli-tool sandbox", s: "백로그" },
        ].map((p) => (
          <div key={p.n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
            <span className={"sk-dot " + (p.active ? "hi" : "ring")} />
            <span style={{ fontFamily: "var(--hand)", fontSize: 15, flex: 1 }}>{p.n}</span>
            <span className="sk-cap">{p.s}</span>
          </div>
        ))}
      </Section>

      {/* 섹션: 다음에 할 일 */}
      <Section num="02" ttl="다음에 할 일" more="+ 추가">
        {[
          { t: "타이머 권한 처리", done: true },
          { t: "이메일 답장 토글", done: false },
          { t: "회고 모달 카피", done: false },
          { t: "스트레칭 알림 사운드", done: false },
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
      </Section>

      {/* 섹션: AI 세션 북마크 */}
      <Section num="03" ttl="AI 세션 북마크" more="≡">
        {[
          { d: "5/19", t: "Auth 흐름 — 굿", ok: true },
          { d: "5/18", t: "Edge fn 디버깅", ok: true },
          { d: "5/17", t: "스키마 v1", ok: false },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
            <span className="sk-mono" style={{ width: 32 }}>{s.d}</span>
            <span style={{ fontFamily: "var(--hand)", fontSize: 14, flex: 1 }}>{s.t}</span>
            <span className={"sk-dot " + (s.ok ? "ok" : "ring")} />
          </div>
        ))}
      </Section>

      {/* 섹션: 고객 이메일 */}
      <Section num="04" ttl="고객 문의" more="2 미답">
        {[
          { who: "지수", sub: "결제 안 됨", ok: false },
          { who: "박PM", sub: "회의자료 받음", ok: true },
          { who: "강아무개", sub: "환불 문의", ok: false },
        ].map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
            <span className={"sk-check" + (e.ok ? " done" : "")} />
            <span style={{ fontFamily: "var(--hand)", fontSize: 14, width: 50 }}>{e.who}</span>
            <span style={{ fontFamily: "var(--hand)", fontSize: 14, flex: 1, color: "var(--ink-2)" }}>{e.sub}</span>
          </div>
        ))}
      </Section>

      {/* 섹션: 프롬프트 함 */}
      <Section num="05" ttl="프롬프트 함" more="12">
        {[
          "이 함수 리팩토링…",
          "에러 메시지 친절하게",
          "접근성 검토",
        ].map((p, i) => (
          <div key={i} className="sk-box wobble-2" style={{ padding: "4px 7px", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="sk-mono" style={{ color: "var(--ink-3)" }}>#{i+1}</span>
            <span style={{ fontFamily: "var(--hand-2)", fontSize: 15, flex: 1 }}>{p}</span>
            <span className="sk-cap">📋</span>
          </div>
        ))}
      </Section>

      {/* 섹션: 치트시트 */}
      <Section num="06" ttl="이 프로젝트 치트시트">
        <div className="sk-box sk-fill wobble-1" style={{ padding: 7, fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.5 }}>
          $ pnpm dev<br/>
          $ pnpm db:reset<br/>
          $ pnpm test --filter ui<br/>
          ENV → .env.local
        </div>
      </Section>

      {/* 하단 — 타이머 / 회고 (sticky) */}
      <div style={{
        position: "absolute", left: 16, right: 16, bottom: 12,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div className="sk-box wobble-2" style={{ background: "white", padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <div className="timer-donut" style={{ width: 44, height: 44, fontSize: 11 }}>23:14</div>
          <div style={{ flex: 1 }}>
            <div className="sk-label">스트레칭</div>
            <div className="sk-note" style={{ fontSize: 13 }}>23분 뒤 푸시</div>
          </div>
          <span className="sk-cap">⏸</span>
        </div>
        <div className="sk-box sk-dashed" style={{ padding: 8, textAlign: "center", background: "var(--paper-2)" }}>
          <span className="sk-note" style={{ fontSize: 14 }}>오늘 작업 마치기 → 회고 한 줄</span>
        </div>
      </div>

      {/* 콜아웃 */}
      <div className="sk-callout" style={{ top: 60, right: -130, width: 130, textAlign: "left" }}>
        <span className="arrow">↤</span>
        한 컬럼에 모든<br/>도구 세로로
      </div>
    </div>
  );
}

function Section({ num, ttl, more, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="sec-head">
        <span className="num">{num}</span>
        <span className="ttl">{ttl}</span>
        {more && <span className="more">{more}</span>}
      </div>
      {children}
    </div>
  );
}

window.WireSideDockLeft = WireSideDockLeft;
