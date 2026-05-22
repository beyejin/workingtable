/* global React */
// ===========================================================
// AI 공통 헬퍼 — window.claude.complete 래퍼 + JSON 파싱
// 모델: claude-haiku-4-5 (1024 토큰 출력 캡)
// ===========================================================

async function callClaude(messages) {
  if (!window.claude?.complete) {
    throw new Error("AI를 사용할 수 없어요 (claude API 미연결)");
  }
  return await window.claude.complete({ messages });
}

// Claude가 ```json 으로 감싸거나 앞뒤 텍스트 붙일 수 있어서 robust하게 파싱
function extractJson(text) {
  if (!text) throw new Error("빈 응답");

  // ```json ... ``` 패턴
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }

  // 첫 { 부터 마지막 } 까지
  const firstBrace = text.indexOf("{");
  const lastBrace  = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)); } catch {}
  }

  // 첫 [ 부터 마지막 ]
  const firstBr = text.indexOf("[");
  const lastBr  = text.lastIndexOf("]");
  if (firstBr >= 0 && lastBr > firstBr) {
    try { return JSON.parse(text.slice(firstBr, lastBr + 1)); } catch {}
  }

  throw new Error("응답을 파싱할 수 없어요");
}

// ---- 회고 초안 ----
async function generateRetroDraft({ project, minutes, doneTodos, stuck, bookmarks, existingText }) {
  const doneList = doneTodos.length
    ? doneTodos.map(t => `- ${t.text}`).join("\n")
    : "(없음)";
  const bmList = bookmarks.length
    ? bookmarks.map(b => `- [${b.ok ? "굿" : "별로"}] ${b.title}${b.note ? ` (${b.note})` : ""}`).join("\n")
    : "(없음)";

  const sys = `당신은 사용자가 짧고 자연스러운 한국어 회고(일기 한 줄)를 쓰도록 돕는 친근한 어시스턴트입니다.
딱딱한 업무 요약이 아니라, 본인이 쓰는 일기처럼 자연스럽고 솔직한 톤으로 작성하세요.
짧게 — 한 줄 회고는 1-2문장, 잘된 것/막힌 것은 각각 한 줄.
이모지는 거의 쓰지 말고, 친구한테 말하듯 편하게.
반드시 아래 형식의 JSON으로만 응답하세요. 다른 설명은 금지.

{
  "text": "오늘의 한 줄 회고 (1-2문장)",
  "good": "잘된 일 한 줄",
  "bad": "막혔거나 아쉬운 일 한 줄"
}`;

  const user = `오늘 데이터:
- 프로젝트: ${project?.name ?? "이름없음"}
- 작업 시간: ${minutes}분
- 끝낸 일:
${doneList}
- 막혀있는 것: ${stuck || "(없음)"}
- AI 세션:
${bmList}
${existingText ? `\n- 사용자가 이미 쓴 한 줄(다듬기만): "${existingText}"` : ""}

위 데이터를 보고 JSON으로 회고 초안을 만들어주세요.`;

  const raw = await callClaude([
    { role: "user", content: `${sys}\n\n${user}` },
  ]);
  const parsed = extractJson(raw);
  return {
    text: String(parsed.text || ""),
    good: String(parsed.good || ""),
    bad: String(parsed.bad || ""),
  };
}

// ---- 막힌 것 → 할 일 쪼개기 ----
async function breakdownStuck({ stuck, project }) {
  if (!stuck?.trim()) throw new Error("막힌 것이 비어있어요");

  const sys = `당신은 사용자가 막힌 문제를 작은 다음 단계로 쪼개도록 돕습니다.
3-5개의 구체적이고 작은 한국어 할 일을 만들어주세요. 각 항목:
- 한 줄, 30자 이내
- 오늘 안에 할 수 있을 만큼 작게
- 구체적이고 행동 가능 ("검토하기" 같은 막연한 말 X, "X 함수의 Y 케이스 콘솔 찍어보기" O)
- 명령형/평서형, 일관되게

반드시 아래 형식의 JSON 배열로만 응답하세요. 다른 설명 금지.
["할 일 1", "할 일 2", ...]`;

  const user = `프로젝트: ${project?.name ?? "이름없음"}
스택: ${project?.stack?.join(", ") || "(미지정)"}

막혀있는 것:
"${stuck}"

위 막힌 점을 3-5개 구체적 다음 단계로 쪼개주세요.`;

  const raw = await callClaude([
    { role: "user", content: `${sys}\n\n${user}` },
  ]);
  const parsed = extractJson(raw);
  if (!Array.isArray(parsed)) throw new Error("배열이 아닌 응답");
  return parsed.map(s => String(s).trim()).filter(Boolean).slice(0, 8);
}

window.diaryAI = {
  callClaude,
  generateRetroDraft,
  breakdownStuck,
};
