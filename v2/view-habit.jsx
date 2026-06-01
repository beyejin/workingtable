/* global React, diary */
// ===========================================================
// 습관 트래커 — 레이아웃 및 챌린지 뷰 다각화 버전
// • 주간 스탬프 모음: 모든 습관(완성된 습관 포함)을 모아서 매주/매일 체크하는 영역
// • 챌린지 모음: 습관별로 66일 챌린지(도트), 월간 캘린더, 연간 잔디(365일) 뷰를 전환해서 보는 영역
// • 명예의 전당: 완료된 습관들의 이름만 칩 형태로 컴팩트하게 나열
// ===========================================================
const { useState, useEffect } = React;

// 아기자기한 대표 습관용 이모지 후보군
const EMOJI_LIST = ["🌸", "🌱", "🥛", "💊", "🧘", "🏃", "🥗", "📚", "✍️", "💻", "⏰", "🛌", "✨", "🎵"];

// 오프셋이 적용된 주의 월요일부터 일요일까지의 날짜 배열 구하기
function getWeekDays(offset = 0) {
  const today = new Date();
  today.setDate(today.getDate() + offset * 7);

  const currentDay = today.getDay(); // 0: 日, 1: 月, ... 6: 土
  // 월요일을 이번 주의 시작(index 0)으로 계산하기 위한 보정
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMonday);

  const days = [];
  const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    days.push({
      dateStr: `${y}-${m}-${dd}`,
      name: dayNames[i],
      isToday: `${y}-${m}-${dd}` === diary.today(),
    });
  }
  return days;
}

// createdAt 기준으로 YYYY-MM-DD 와 오늘 사이의 경과 일수 (D+n)
function getDDay(createdAt) {
  try {
    const start = new Date(createdAt + "T00:00:00");
    const end = new Date(diary.today() + "T00:00:00");
    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `D+${Math.max(1, diffDays)}`;
  } catch (_) {
    return "D+1";
  }
}

// 66일 중 누적 완료 횟수에 따른 식물 상태와 텍스트 리턴
function getPlantState(doneCount) {
  if (doneCount === 0) {
    return { icon: "🌱", label: "씨앗", comment: "시작이 반이야!" };
  } else if (doneCount <= 13) {
    return { icon: "🌱", label: "새싹", comment: "조금씩 자라나요" };
  } else if (doneCount <= 30) {
    return { icon: "🍀", label: "클로버", comment: "슬슬 자리를 잡았어요" };
  } else if (doneCount <= 48) {
    return { icon: "🌿", label: "잎사귀", comment: "단단하게 성장 중!" };
  } else if (doneCount <= 65) {
    return { icon: "🌷", label: "꽃망울", comment: "곧 꽃이 피어날 것 같아요!" };
  } else {
    return { icon: "🌸", label: "꽃", comment: "습관 달성 완료! 멋져요 🎉" };
  }
}

function isDateSuccess(habit, dStr) {
  const rec = habit.history[dStr];
  if (!rec) return false;
  if (rec === true) return true;
  if (typeof rec === "object") {
    return Object.values(rec).some(v => !!v);
  }
  return false;
}

function HabitView() {
  const { state, actions } = diary.useDiary();
  const [newHabitName, setNewHabitName] = useState("");
  const [weekOffset, setWeekOffset] = useState(0); // 주차 이동 오프셋
  const [activeSubTab, setActiveSubTab] = useState("tracker"); // "tracker" | "insights"
  const thisWeekDays = getWeekDays(weekOffset);
  const habits = diary.select.habitsForCurrent(state) || [];

  const activeHabits = habits.filter(h => h.status !== "completed");
  const completedHabits = habits.filter(h => h.status === "completed");

  const handleAddHabit = (e) => {
    if (e) e.preventDefault();
    let name = newHabitName.trim();
    if (!name) return;

    // 첫 문자열이 이모지인지 감지하여 이모지 분리 추출
    const emojiRegex = /^([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/;
    const match = name.match(emojiRegex);
    let extractedEmoji = "🌸";
    if (match) {
      extractedEmoji = match[0];
      name = name.replace(emojiRegex, "").trim(); // 본문 이름에서 이모지 제거
    }

    actions.addHabit(name, { emoji: extractedEmoji });
    setNewHabitName("");
  };

  const startDay = thisWeekDays[0];
  const endDay = thisWeekDays[6];
  const fmtShort = (iso) => {
    const [, m, d] = iso.split("-").map(Number);
    return `${m}/${d}`;
  };
  const weekRangeText = `${fmtShort(startDay.dateStr)} ~ ${fmtShort(endDay.dateStr)}`;

  const navBtnStyle = {
    all: "unset",
    cursor: "pointer",
    width: 22,
    height: 20,
    borderRadius: 4,
    display: "grid",
    placeItems: "center",
    fontSize: 10,
    color: "var(--ink-2)",
    background: "rgba(255,255,255,0.6)",
    border: "1px solid var(--ink-soft)",
  };

  const sectionHeaderStyle = {
    fontFamily: "var(--hand)",
    fontSize: 14,
    fontWeight: "bold",
    color: "var(--ink)",
    marginTop: 18,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderBottom: "1px dashed var(--ink-soft)",
    paddingBottom: 4
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--paper)" }}>
      {/* 습관 추가 인풋 */}
      <div style={{ padding: "12px 14px 8px", borderBottom: "1.1px solid var(--ink)", flexShrink: 0 }}>
        <form onSubmit={handleAddHabit} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="새 습관 추가... (예: 💊 비타민 먹기)"
            style={{
              flex: 1,
              border: "1.1px solid var(--ink-soft)",
              borderRadius: 8,
              padding: "6px 12px",
              fontFamily: "var(--hand)",
              fontSize: 14,
              outline: "none",
              background: "white",
            }}
          />
          <button
            type="submit"
            style={{
              all: "unset",
              cursor: "pointer",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--hi)",
              border: "1.1px solid var(--ink)",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--hand)",
              fontSize: 18,
              fontWeight: "bold",
              color: "var(--ink)",
              boxShadow: "0 1.5px 0 var(--paper-3)",
            }}
          >
            +
          </button>
        </form>
      </div>

      {/* 서브 탭 바 */}
      <div style={{ display: "flex", borderBottom: "1.1px solid var(--ink)", background: "var(--paper-2)", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setActiveSubTab("tracker")}
          style={{
            all: "unset",
            cursor: "pointer",
            flex: 1,
            padding: "8px 0",
            textAlign: "center",
            fontFamily: "var(--hand)",
            fontSize: 13,
            fontWeight: "bold",
            color: activeSubTab === "tracker" ? "var(--ink)" : "var(--ink-3)",
            background: activeSubTab === "tracker" ? "white" : "transparent",
            borderRight: "1.1px solid var(--ink)",
            borderBottom: activeSubTab === "tracker" ? "none" : "1.1px solid var(--ink)",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          🌸 {L("habit.tracker")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("insights")}
          style={{
            all: "unset",
            cursor: "pointer",
            flex: 1,
            padding: "8px 0",
            textAlign: "center",
            fontFamily: "var(--hand)",
            fontSize: 13,
            fontWeight: "bold",
            color: activeSubTab === "insights" ? "var(--ink)" : "var(--ink-3)",
            background: activeSubTab === "insights" ? "white" : "transparent",
            borderBottom: activeSubTab === "insights" ? "none" : "1.1px solid var(--ink)",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          📊 {L("habit.insights")}
        </button>
      </div>

      {activeSubTab === "tracker" ? (
        <>
          {/* 주간 네비게이션 바 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 14px",
            background: "var(--paper-2)",
            borderBottom: "1.1px solid var(--ink-soft)",
            fontFamily: "var(--hand)",
            fontSize: 13,
            color: "var(--ink)",
            flexShrink: 0
          }}>
            <button type="button" onClick={() => setWeekOffset(o => o - 1)} style={navBtnStyle}>◀</button>
            <span
              onClick={() => setWeekOffset(0)}
              style={{ cursor: "pointer", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: 4 }}
              title="이번 주로 돌아가기"
            >
              📅 {weekRangeText} {weekOffset !== 0 && <span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: "normal" }}>(오늘로)</span>}
            </span>
            <button type="button" onClick={() => setWeekOffset(o => o + 1)} style={navBtnStyle}>▶</button>
          </div>

          {/* 습관 리스트 스크롤 영역 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 20px" }}>
            
            {/* 1. 주간 스탬프 모음 */}
            <div style={sectionHeaderStyle}>
              🌸 주간 스탬프
            </div>
            {habits.length > 0 ? (
              habits.map((habit) => (
                <HabitWeeklyStampCard
                  key={habit.id}
                  habit={habit}
                  thisWeekDays={thisWeekDays}
                  actions={actions}
                />
              ))
            ) : (
              <div style={emptySectionStyle}>등록된 습관이 없어요 🌱</div>
            )}

            {/* 2. 챌린지 모음 */}
            <div style={sectionHeaderStyle}>
              🌱 챌린지
            </div>
            {habits.length > 0 ? (
              habits.map((habit) => (
                <HabitChallengeCard
                  key={habit.id}
                  habit={habit}
                  actions={actions}
                />
              ))
            ) : (
              <div style={emptySectionStyle}>등록된 챌린지가 없어요 🌱</div>
            )}

            {/* 3. 명예의 전당 */}
            {completedHabits.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{
                  fontFamily: "var(--hand)",
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "var(--ink)",
                  marginBottom: 8,
                  borderBottom: "1px dashed var(--ink-soft)",
                  paddingBottom: 4
                }}>
                  🏆 명예의 전당
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "4px 0" }}>
                  {completedHabits.map((habit) => (
                    <div
                      key={habit.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#eefcf2",
                        border: "1.1px solid var(--ink)",
                        borderRadius: 99,
                        padding: "4px 10px 4px 8px",
                        boxShadow: "0 1.5px 0 var(--paper-3)",
                      }}
                    >
                      <span style={{ fontSize: 13 }}>🌸</span>
                      <span style={{
                        fontFamily: "var(--hand)",
                        fontSize: 13,
                        fontWeight: "bold",
                        color: "var(--ink)",
                      }}>
                        {habit.name}
                      </span>
                      <button
                        onClick={async () => {
                          const ok = await window.dialog.confirm(`명예의 전당에 등록된 "${habit.name}" 습관을 삭제할까요?`);
                          if (ok) {
                            actions.removeHabit(habit.id);
                          }
                        }}
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          fontSize: 10,
                          color: "var(--ink-3)",
                          fontFamily: "var(--mono)",
                          marginLeft: 4,
                          padding: "0 2px"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <HabitInsightsView habits={habits} />
      )}
    </div>
  );
}

// 1. 주간 스탬프 카드 컴포넌트
function HabitWeeklyStampCard({ habit, thisWeekDays, actions }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [newSubName, setNewSubName] = useState("");
  const [newSubEmoji, setNewSubEmoji] = useState("🌱");
  const [subPickerOpen, setSubPickerOpen] = useState(false);

  useEffect(() => {
    setEditName(habit.name);
  }, [habit.name]);

  const handleRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== habit.name) {
      actions.renameHabit(habit.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleAddSub = (e) => {
    if (e) e.preventDefault();
    const trimmed = newSubName.trim();
    if (!trimmed) return;
    actions.addSubItemToHabit(habit.id, trimmed, newSubEmoji);
    setNewSubName("");
    setNewSubEmoji("🌱");
  };

  return (
    <div style={{
      background: "white",
      border: "1.1px solid var(--ink)",
      borderRadius: 12,
      padding: "10px 12px 8px",
      marginBottom: 10,
      boxShadow: "0 3px 0 var(--paper-3)",
      position: "relative",
    }}>
      {/* 카드 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
          {/* 이모지 선택 토글 */}
          <span
            onClick={() => setPickerOpen(o => !o)}
            style={{ fontSize: 14, cursor: "pointer", userSelect: "none" }}
            title="클릭하여 이모지 바꾸기"
          >
            {habit.emoji}
          </span>
          {pickerOpen && (
            <EmojiPicker
              current={habit.emoji}
              onSelect={(em) => actions.updateHabit(habit.id, { emoji: em })}
              onClose={() => setPickerOpen(false)}
            />
          )}

          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setEditName(habit.name);
                  setIsEditing(false);
                }
              }}
              autoFocus
              style={{
                fontFamily: "var(--hand)",
                fontSize: 13,
                fontWeight: "bold",
                border: "1.1px solid var(--ink)",
                borderRadius: 4,
                padding: "2px 4px",
                width: 110,
                outline: "none",
              }}
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              style={{
                fontFamily: "var(--hand)",
                fontSize: 14,
                fontWeight: "bold",
                color: "var(--ink)",
                cursor: "pointer",
              }}
              title="더블클릭하여 이름 수정"
            >
              {habit.name}
            </span>
          )}

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                all: "unset",
                cursor: "pointer",
                fontSize: 10,
                color: "var(--ink-3)",
                marginLeft: 2,
              }}
              title="이름 수정"
            >
              ✎
            </button>
          )}

          {habit.streak > 0 && (
            <span style={{
              background: "#ffe9da",
              color: "#e06a7a",
              border: "1px solid #ffc8b6",
              borderRadius: 6,
              padding: "0px 5px",
              fontFamily: "var(--mono)",
              fontSize: 9,
              fontWeight: "bold",
            }}>
              🔥 {habit.streak}일
            </span>
          )}
        </div>
        <button
          onClick={async () => {
            const ok = await window.dialog.confirm(`"${habit.name}" 습관을 삭제할까요?`);
            if (ok) {
              actions.removeHabit(habit.id);
            }
          }}
          style={{
            all: "unset",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--ink-3)",
            fontFamily: "var(--mono)",
            padding: "0px 4px",
          }}
        >
          ✕
        </button>
      </div>

      {/* 요일 스탬프 체크 */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        background: "var(--paper-2)",
        borderRadius: 8,
        padding: "6px 8px",
        border: "1px solid var(--ink-soft)"
      }}>
        {thisWeekDays.map((day) => {
          const isDone = isDateSuccess(habit, day.dateStr);
          return (
            <div
              key={day.dateStr}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                flex: 1
              }}
            >
              <span style={{
                fontFamily: "var(--hand)",
                fontSize: 9,
                color: day.isToday ? "var(--ink)" : "var(--ink-3)",
                fontWeight: day.isToday ? "bold" : "normal"
              }}>
                {day.name}
              </span>
              <button
                onClick={() => actions.toggleHabitDate(habit.id, day.dateStr)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: day.isToday ? "1.5px solid var(--ink)" : "1px solid var(--ink-soft)",
                  background: isDone ? "#ffe6f0" : "white",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 10,
                  boxShadow: day.isToday ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                  transition: "background 0.15s, transform 0.1s",
                }}
              >
                {isDone ? habit.emoji : ""}
              </button>
            </div>
          );
        })}
      </div>

      {/* 하위 항목 목록 및 관리 UI */}
      <div style={{
        marginTop: 8,
        borderTop: "1px dashed var(--ink-soft)",
        paddingTop: 6,
      }}>
        {habit.subItems && habit.subItems.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {habit.subItems.map(si => (
              <span
                key={si.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  background: "var(--paper-2)",
                  border: "1px solid var(--ink-soft)",
                  borderRadius: 6,
                  padding: "2px 6px",
                  fontSize: 10,
                  fontFamily: "var(--hand)",
                  color: "var(--ink)",
                }}
              >
                <span>{si.emoji} {si.name}</span>
                <button
                  type="button"
                  onClick={() => actions.removeSubItemFromHabit(habit.id, si.id)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    color: "var(--ink-3)",
                    fontSize: 8,
                    marginLeft: 2,
                    display: "grid",
                    placeItems: "center",
                  }}
                  title="하위 항목 삭제"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleAddSub} style={{ display: "flex", gap: 6, alignItems: "center", position: "relative" }}>
          <span
            onClick={() => setSubPickerOpen(o => !o)}
            style={{ fontSize: 13, cursor: "pointer", userSelect: "none" }}
            title="하위 항목 이모지 선택"
          >
            {newSubEmoji}
          </span>
          {subPickerOpen && (
            <EmojiPicker
              current={newSubEmoji}
              onSelect={(em) => setNewSubEmoji(em)}
              onClose={() => setSubPickerOpen(false)}
            />
          )}
          <input
            type="text"
            value={newSubName}
            onChange={(e) => setNewSubName(e.target.value)}
            placeholder="하위 항목 추가... (예: 이불정리)"
            style={{
              flex: 1,
              fontFamily: "var(--hand)",
              fontSize: 11,
              border: "1px solid var(--ink-soft)",
              borderRadius: 6,
              padding: "3px 8px",
              outline: "none",
              background: "white",
            }}
          />
          <button
            type="submit"
            style={{
              all: "unset",
              cursor: "pointer",
              background: "var(--paper-3)",
              border: "1.1px solid var(--ink)",
              borderRadius: "50%",
              width: 18,
              height: 18,
              display: "grid",
              placeItems: "center",
              fontSize: 10,
              fontWeight: "bold",
              color: "var(--ink)",
            }}
          >
            +
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. 챌린지 카드 컴포넌트 (66일 / 월간 / 연간 뷰 전환 지원)
function HabitChallengeCard({ habit, actions }) {
  const [viewStyle, setViewStyle] = useState("66day"); // "66day" | "monthly" | "yearly"
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);

  useEffect(() => {
    setEditName(habit.name);
  }, [habit.name]);

  const handleRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== habit.name) {
      actions.renameHabit(habit.id, trimmed);
    }
    setIsEditing(false);
  };

  const doneCount = Object.keys(habit.history).length;
  const plant = getPlantState(doneCount);
  const dday = getDDay(habit.createdAt);
  const isCompleted = habit.status === "completed";

  const styleTabStyle = (styleName) => ({
    all: "unset",
    cursor: "pointer",
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 10,
    fontFamily: "var(--hand)",
    background: viewStyle === styleName ? "var(--hi)" : "var(--paper-2)",
    border: viewStyle === styleName ? "1px solid var(--ink)" : "1px solid var(--ink-soft)",
    color: "var(--ink)",
    fontWeight: viewStyle === styleName ? "bold" : "normal",
    transition: "background 0.15s"
  });

  return (
    <div style={{
      background: "white",
      border: "1.1px solid var(--ink)",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      boxShadow: "0 3px 0 var(--paper-3)",
      position: "relative",
    }}>
      {/* 카드 헤더 및 3가지 스타일 탭 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, position: "relative" }}>
          {/* 이모지 선택 토글 */}
          <span
            onClick={() => setPickerOpen(o => !o)}
            style={{ fontSize: 13, cursor: "pointer", userSelect: "none" }}
            title="클릭하여 이모지 바꾸기"
          >
            {habit.emoji}
          </span>
          {pickerOpen && (
            <EmojiPicker
              current={habit.emoji}
              onSelect={(em) => actions.updateHabit(habit.id, { emoji: em })}
              onClose={() => setPickerOpen(false)}
            />
          )}

          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setEditName(habit.name);
                  setIsEditing(false);
                }
              }}
              autoFocus
              style={{
                fontFamily: "var(--hand)",
                fontSize: 12,
                fontWeight: "bold",
                border: "1.1px solid var(--ink)",
                borderRadius: 4,
                padding: "1px 3px",
                width: 100,
                outline: "none",
              }}
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              style={{
                fontFamily: "var(--hand)",
                fontSize: 13,
                fontWeight: "bold",
                color: "var(--ink)",
                cursor: "pointer",
              }}
              title="더블클릭하여 이름 수정"
            >
              {habit.name}
            </span>
          )}

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                all: "unset",
                cursor: "pointer",
                fontSize: 10,
                color: "var(--ink-3)",
                marginLeft: 2,
              }}
              title="이름 수정"
            >
              ✎
            </button>
          )}
        </div>
        {/* 스타일 세그먼트 버튼 */}
        <div style={{ display: "flex", gap: 3 }}>
          <button type="button" onClick={() => setViewStyle("66day")} style={styleTabStyle("66day")}>66일</button>
          <button type="button" onClick={() => setViewStyle("monthly")} style={styleTabStyle("monthly")}>월간</button>
          <button type="button" onClick={() => setViewStyle("yearly")} style={styleTabStyle("yearly")}>연간</button>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed var(--ink-soft)", paddingTop: 10 }}>
        {viewStyle === "66day" && (
          <>
            {/* 66일 챌린지 뷰 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, background: "var(--paper-2)", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--ink-soft)" }}>
              <span style={{ fontSize: 20 }}>{plant.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--hand)", fontSize: 11, fontWeight: "bold", color: "var(--ink)" }}>
                    {plant.label} <span style={{ fontWeight: "normal", fontSize: 9, color: "var(--ink-3)" }}>({doneCount}/66일)</span>
                  </span>
                  <span style={{ fontFamily: "var(--hand)", fontSize: 9, color: "var(--ink-2)", fontWeight: "bold" }}>
                    {dday} · 연속 {habit.streak}일
                  </span>
                </div>
                <div style={{ fontFamily: "var(--hand)", fontSize: 10, color: "var(--ink-2)" }}>
                  {plant.comment}
                </div>
              </div>
            </div>

            {/* 66일 도트 그리드 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(11, 1fr)",
              gap: 3,
              marginBottom: 6,
              justifyItems: "center"
            }}>
              {Array.from({ length: 66 }).map((_, idx) => {
                const isFilled = idx < doneCount;
                return (
                  <div
                    key={idx}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      border: "1px solid var(--ink-soft)",
                      background: isFilled ? "var(--hi)" : "#f0f0f0",
                    }}
                  />
                );
              })}
            </div>

            {/* 달성도 프로그레스 바 */}
            <div style={{ display: "flex", height: 5, background: "#f0f0f0", borderRadius: 2, overflow: "hidden", border: "1px solid var(--ink-soft)" }}>
              <div style={{
                width: `${(doneCount / 66) * 100}%`,
                height: "100%",
                background: "var(--hi)",
                transition: "width 0.3s ease"
              }} />
            </div>
          </>
        )}

        {viewStyle === "monthly" && (
          <MonthlyMiniGrid habit={habit} actions={actions} />
        )}

        {viewStyle === "yearly" && (
          <YearlyGrassGrid habit={habit} actions={actions} />
        )}
      </div>
    </div>
  );
}

// 3. 미니 이모지 피커 컴포넌트
function EmojiPicker({ current, onSelect, onClose }) {
  return (
    <div style={{
      position: "absolute",
      top: 26,
      left: 0,
      zIndex: 100,
      background: "white",
      border: "1.1px solid var(--ink)",
      borderRadius: 8,
      padding: 6,
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 4,
      boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    }}>
      {EMOJI_LIST.map(em => (
        <button
          key={em}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(em);
            onClose();
          }}
          style={{
            all: "unset",
            cursor: "pointer",
            width: 22,
            height: 22,
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            borderRadius: 4,
            background: current === em ? "var(--hi)" : "transparent",
            transition: "background 0.1s"
          }}
        >
          {em}
        </button>
      ))}
    </div>
  );
}

// 4. 미니 월간 달력 그리드 컴포넌트
function MonthlyMiniGrid({ habit, actions }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0: 1월 .. 11: 12월
  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  
  const startDow = new Date(year, month, 1).getDay(); // 1일 요일 (0:일 .. 6:토)
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // 이 달 총 일수
  
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  
  const dows = ["일", "월", "화", "수", "목", "금", "토"];
  
  return (
    <div style={{ background: "var(--paper-2)", border: "1px solid var(--ink-soft)", borderRadius: 8, padding: 8 }}>
      <div style={{ fontFamily: "var(--hand)", fontSize: 11, fontWeight: "bold", textAlign: "center", marginBottom: 6, color: "var(--ink)" }}>
        📅 {year}년 {monthNames[month]}
      </div>
      
      {/* 요일 헤더 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4, justifyItems: "center" }}>
        {dows.map((dw, i) => (
          <span key={i} style={{ fontFamily: "var(--mono)", fontSize: 9, color: i === 0 ? "#e06a7a" : (i === 6 ? "#5b8fd6" : "var(--ink-3)") }}>{dw}</span>
        ))}
      </div>
      
      {/* 날짜 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, justifyItems: "center" }}>
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} style={{ width: 18, height: 18 }} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isDone = isDateSuccess(habit, dateStr);
          const isToday = dateStr === diary.today();
          
          return (
            <div
              key={idx}
              onClick={() => actions.toggleHabitDate(habit.id, dateStr)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: isToday ? "1px solid var(--ink)" : "1px solid transparent",
                background: isDone ? "#ffe6f0" : "white",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--mono)",
                fontSize: 9,
                color: isDone ? "var(--ink)" : "var(--ink-2)",
                cursor: "pointer",
                boxSizing: "border-box"
              }}
              title={dateStr}
            >
              {isDone ? habit.emoji : d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 5. 연간 잔디밭 그리드 컴포넌트
function YearlyGrassGrid({ habit, actions }) {
  const daysInYear = getDaysOfYearList();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        paddingBottom: 4,
        scrollbarWidth: "none",
      }}>
        {daysInYear.weeks.map((week, wIdx) => (
          <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {week.map((day, dIdx) => {
              if (!day) return <div key={dIdx} style={{ width: 6, height: 6, background: "transparent" }} />;
              const isDone = isDateSuccess(habit, day.dateStr);
              const isToday = day.dateStr === diary.today();
              return (
                <div
                  key={day.dateStr}
                  title={`${day.dateStr} (${isDone ? "성공" : "미완료"})`}
                  onClick={() => actions.toggleHabitDate(habit.id, day.dateStr)}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 1.2,
                    background: isDone ? "var(--hi)" : "#eef0f2",
                    border: isToday ? "1px solid var(--ink)" : "none",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "var(--mono)",
        fontSize: 9,
        color: "var(--ink-3)",
        padding: "0 2px"
      }}>
        <span>1월</span>
        <span>12월</span>
      </div>
    </div>
  );
}

// 1년치 날짜를 주(Week) 단위로 묶어서 반환하는 헬퍼
function getDaysOfYearList() {
  const year = new Date().getFullYear();
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  // 1월 1일이 시작하는 요일 (0: 일, ... 6: 토)
  const startDayOfWeek = startDate.getDay();
  
  const weeks = [];
  let currentWeek = Array.from({ length: 7 }, () => null);
  
  // 첫 주 빈칸 오프셋 채우기
  let dayOfWeekIndex = startDayOfWeek;
  
  let current = new Date(startDate);
  while (current <= endDate) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${dd}`;
    
    currentWeek[dayOfWeekIndex] = { dateStr };
    
    if (dayOfWeekIndex === 6) {
      weeks.push(currentWeek);
      currentWeek = Array.from({ length: 7 }, () => null);
      dayOfWeekIndex = 0;
    } else {
      dayOfWeekIndex++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  // 마지막 주 추가
  if (currentWeek.some(d => d !== null)) {
    weeks.push(currentWeek);
  }
  
  return { weeks, year };
}

// 스타일 상수들
const emptySectionStyle = {
  textAlign: "center",
  padding: "16px 10px",
  fontFamily: "var(--hand)",
  fontSize: 12,
  color: "var(--ink-3)",
  border: "1px dashed var(--ink-soft)",
  borderRadius: 10,
  background: "rgba(255, 255, 255, 0.3)",
  marginBottom: 10
};

// ===========================================================
// 6. 습관 분석 (인사이트) 컴포넌트
// ===========================================================
function HabitInsightsView({ habits }) {
  const [selectedHabitId, setSelectedHabitId] = useState("all");

  if (!habits || habits.length === 0) {
    return <div style={{ padding: 24, textAlign: "center", fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink-3)", background: "white", borderRadius: 12, border: "1.1px solid var(--ink)", boxShadow: "0 3px 0 var(--paper-3)" }}>분석할 습관이 아직 없습니다 🌱</div>;
  }

  const targetHabits = selectedHabitId === "all" ? habits : habits.filter(h => h.id === selectedHabitId);

  const currentStreak = selectedHabitId === "all"
    ? Math.max(...habits.map(h => h.streak ?? 0), 0)
    : (targetHabits[0]?.streak ?? 0);
  const maxStreak = selectedHabitId === "all"
    ? Math.max(...habits.map(h => h.maxStreak ?? 0), 0)
    : (targetHabits[0]?.maxStreak ?? 0);

  const todayStr = diary.today();
  const dateList30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayStr + "T00:00:00");
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dateList30.push(`${y}-${m}-${dd}`);
  }

  const dailySuccessRates = dateList30.map(date => {
    if (selectedHabitId === "all") {
      const doneCount = habits.filter(h => isDateSuccess(h, date)).length;
      return (doneCount / habits.length) * 100;
    } else {
      return isDateSuccess(targetHabits[0], date) ? 100 : 0;
    }
  });

  const doneDays30 = dateList30.filter(date => {
    if (selectedHabitId === "all") {
      return habits.some(h => isDateSuccess(h, date));
    } else {
      return isDateSuccess(targetHabits[0], date);
    }
  }).length;
  const ratio30 = Math.round((doneDays30 / 30) * 100);

  const movingAverages = [];
  for (let i = 6; i < 30; i++) {
    const subset = dailySuccessRates.slice(i - 6, i + 1);
    const avg = subset.reduce((sum, val) => sum + val, 0) / 7;
    movingAverages.push(Math.round(avg));
  }

  const dateList35 = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(todayStr + "T00:00:00");
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dateList35.push({
      dateStr: `${y}-${m}-${dd}`,
      dow: d.getDay()
    });
  }

  const dowNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dowSuccessRates = Array.from({ length: 7 }, (_, dowIndex) => {
    const datesOfDow = dateList35.filter(x => x.dow === dowIndex);
    const totalChance = datesOfDow.length;
    if (totalChance === 0) return 0;

    let successCount = 0;
    datesOfDow.forEach(item => {
      if (selectedHabitId === "all") {
        if (habits.some(h => isDateSuccess(h, item.dateStr))) {
          successCount++;
        }
      } else {
        if (isDateSuccess(targetHabits[0], item.dateStr)) {
          successCount++;
        }
      }
    });
    return Math.round((successCount / totalChance) * 100);
  });

  let coOccurHabit = null;
  let coOccurProb = 0;
  let chainSuccessText = null;

  if (selectedHabitId !== "all") {
    const activeHabit = targetHabits[0];
    const successDates = Object.keys(activeHabit.history).filter(d => isDateSuccess(activeHabit, d));
    
    if (successDates.length > 0) {
      let bestPartner = null;
      let bestProb = 0;
      habits.forEach(h => {
        if (h.id === activeHabit.id) return;
        const bothDoneCount = successDates.filter(d => isDateSuccess(h, d)).length;
        const prob = Math.round((bothDoneCount / successDates.length) * 100);
        if (prob > bestProb) {
          bestProb = prob;
          bestPartner = h;
        }
      });
      if (bestPartner && bestProb > 0) {
        coOccurHabit = bestPartner;
        coOccurProb = bestProb;
      }
    }

    let yesterdaySuccessTodayDone = 0;
    let yesterdaySuccessTotal = 0;
    let yesterdayFailTodayDone = 0;
    let yesterdayFailTotal = 0;

    for (let i = 1; i < 60; i++) {
      const d = new Date(todayStr + "T00:00:00");
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const checkDateStr = `${y}-${m}-${dd}`;

      const yesterday = new Date(d);
      yesterday.setDate(yesterday.getDate() - 1);
      const yy = yesterday.getFullYear();
      const ym = String(yesterday.getMonth() + 1).padStart(2, "0");
      const yd = String(yesterday.getDate()).padStart(2, "0");
      const yesterdayDateStr = `${yy}-${ym}-${yd}`;

      const isTodayDone = isDateSuccess(activeHabit, checkDateStr);
      const isYesterdayDone = isDateSuccess(activeHabit, yesterdayDateStr);

      if (isYesterdayDone) {
        yesterdaySuccessTotal++;
        if (isTodayDone) yesterdaySuccessTodayDone++;
      } else {
        yesterdayFailTotal++;
        if (isTodayDone) yesterdayFailTodayDone++;
      }
    }

    const probYesterdaySuccess = yesterdaySuccessTotal > 0 ? Math.round((yesterdaySuccessTodayDone / yesterdaySuccessTotal) * 100) : 0;
    const probYesterdayFail = yesterdayFailTotal > 0 ? Math.round((yesterdayFailTodayDone / yesterdayFailTotal) * 100) : 0;

    if (yesterdaySuccessTotal > 0 || yesterdayFailTotal > 0) {
      const diff = probYesterdaySuccess - probYesterdayFail;
      if (diff > 0) {
        chainSuccessText = `어제 성공했을 때 오늘 성공률은 ${probYesterdaySuccess}%인 반면, 어제 실패했을 땐 ${probYesterdayFail}%였습니다. 어제의 성공이 오늘 실천율을 ${diff}%p 높여주었어요! 🚀`;
      } else if (diff === 0 && probYesterdaySuccess > 0) {
        chainSuccessText = `어제의 성공 여부와 상관없이 꾸준히 성공하고 계시네요! 오늘 성공률은 약 ${probYesterdaySuccess}%입니다. 👍`;
      } else {
        chainSuccessText = `성공 주기가 불규칙할 수 있습니다. 매일 정해진 루틴을 설정해보세요. 😊`;
      }
    }
  }

  const chipStyle = (id) => ({
    all: "unset",
    cursor: "pointer",
    whiteSpace: "nowrap",
    padding: "5px 12px",
    borderRadius: 99,
    border: selectedHabitId === id ? "1.2px solid var(--ink)" : "1px solid var(--ink-soft)",
    background: selectedHabitId === id ? "var(--hi)" : "white",
    boxShadow: selectedHabitId === id ? "0 1.5px 0 var(--paper-3)" : "none",
    fontFamily: "var(--hand)",
    fontSize: 12,
    fontWeight: "bold",
    color: "var(--ink)",
    transition: "background 0.15s, border-color 0.15s",
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: "10px 14px 8px",
        background: "var(--paper-2)",
        borderBottom: "1.1px solid var(--ink-soft)",
        flexShrink: 0,
        scrollbarWidth: "none",
      }}>
        <button onClick={() => setSelectedHabitId("all")} style={chipStyle("all")}>
          📊 전체 통계
        </button>
        {habits.map(h => (
          <button key={h.id} onClick={() => setSelectedHabitId(h.id)} style={chipStyle(h.id)}>
            {h.emoji} {h.name}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 24px" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>🔥 {L("habit.streakLabel")}</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0" }}>
              <div style={{ fontSize: 28, fontWeight: "bold", fontFamily: "var(--mono)", color: "#e06a7a" }}>
                {currentStreak}<span style={{ fontSize: 13, fontFamily: "var(--hand)", fontWeight: "normal", color: "var(--ink-2)", marginLeft: 2 }}>일</span>
              </div>
              <div style={{ fontFamily: "var(--hand)", fontSize: 10, color: "var(--ink-3)", marginTop: 4 }}>
                {L("habit.bestStreak")} {maxStreak}일
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardHeaderStyle}>📈 달성 빈도</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0" }}>
              <div style={{ fontSize: 28, fontWeight: "bold", fontFamily: "var(--mono)", color: "#5b8fd6" }}>
                {ratio30}<span style={{ fontSize: 13, fontFamily: "var(--hand)", fontWeight: "normal", color: "var(--ink-2)", marginLeft: 2 }}>%</span>
              </div>
              <div style={{ fontFamily: "var(--hand)", fontSize: 10, color: "var(--ink-3)", marginTop: 4 }}>
                최근 30일 중 {doneDays30}일 실천
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={cardHeaderStyle}>📈 {L("habit.frequency30")} & 7일 이동평균 추이</div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: 4,
            padding: "8px 10px",
            background: "var(--paper-2)",
            borderRadius: 8,
            border: "1px solid var(--ink-soft)",
            marginBottom: 12,
            justifyItems: "center"
          }}>
            {dateList30.map((date, idx) => {
              let isSuccess = false;
              let tooltip = date;
              if (selectedHabitId === "all") {
                const count = habits.filter(h => isDateSuccess(h, date)).length;
                isSuccess = count > 0;
                tooltip = `${date} (${count}개 성공)`;
              } else {
                isSuccess = isDateSuccess(targetHabits[0], date);
                tooltip = `${date} (${isSuccess ? "성공" : "미완료"})`;
              }
              return (
                <div
                  key={idx}
                  title={tooltip}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: "1px solid var(--ink-soft)",
                    background: isSuccess ? "var(--hi)" : "#f0f0f0",
                  }}
                />
              );
            })}
          </div>

          {movingAverages.length > 0 ? (
            <div style={{ background: "white", padding: "10px 6px 6px", borderRadius: 8, border: "1px solid var(--ink-soft)" }}>
              <div style={{ fontFamily: "var(--hand)", fontSize: 10, color: "var(--ink-3)", marginBottom: 6, textAlign: "right" }}>
                * 7일 이동평균 달성률 (%)
              </div>
              <svg viewBox="0 0 230 65" style={{ width: "100%", height: "auto", overflow: "visible" }}>
                <line x1="0" y1="10" x2="230" y2="10" stroke="#f0f0f0" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="35" x2="230" y2="35" stroke="#f0f0f0" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="0" y1="60" x2="230" y2="60" stroke="#e0e0e0" strokeWidth="1" />
                
                <text x="2" y="14" fill="var(--ink-3)" fontSize="7" fontFamily="var(--mono)">100%</text>
                <text x="2" y="39" fill="var(--ink-3)" fontSize="7" fontFamily="var(--mono)">50%</text>
                <text x="2" y="58" fill="var(--ink-3)" fontSize="7" fontFamily="var(--mono)">0%</text>

                {(() => {
                  const points = movingAverages.map((val, idx) => {
                    const x = (idx / (movingAverages.length - 1)) * 210 + 15;
                    const y = 60 - (val / 100) * 50;
                    return `${x},${y}`;
                  }).join(" ");
                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="var(--hi)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />
                      {movingAverages.map((val, idx) => {
                        const x = (idx / (movingAverages.length - 1)) * 210 + 15;
                        const y = 60 - (val / 100) * 50;
                        return (
                          <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r="2"
                            fill="white"
                            stroke="var(--ink)"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 12, fontFamily: "var(--hand)", fontSize: 11, color: "var(--ink-3)" }}>
              데이터가 충분하지 않습니다.
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={cardHeaderStyle}>📅 {L("habit.weeklyStat")} (최근 5주)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 6px" }}>
            {dowNames.map((name, idx) => {
              const rate = dowSuccessRates[idx];
              const isWeekend = idx === 0 || idx === 6;
              const barColor = isWeekend ? "#ffd0d8" : "#d4e6fa";
              
              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    fontFamily: "var(--hand)",
                    fontSize: 12,
                    fontWeight: "bold",
                    color: idx === 0 ? "#e06a7a" : (idx === 6 ? "#5b8fd6" : "var(--ink)"),
                    width: 16,
                    textAlign: "center"
                  }}>
                    {name}
                  </span>
                  <div style={{
                    flex: 1,
                    height: 10,
                    background: "#f0f0f0",
                    borderRadius: 99,
                    border: "1px solid var(--ink-soft)",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${rate}%`,
                      height: "100%",
                      background: rate > 0 ? barColor : "transparent",
                      borderRight: rate > 0 ? "1px solid var(--ink)" : "none",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                  <span style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    fontWeight: "bold",
                    color: "var(--ink-2)",
                    width: 32,
                    textAlign: "right"
                  }}>
                    {rate}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {selectedHabitId !== "all" && (coOccurHabit || chainSuccessText) && (
          <div style={{ ...cardStyle, background: "#fbfcfe", borderColor: "var(--ink)" }}>
            <div style={{ ...cardHeaderStyle, borderBottom: "1.1px solid var(--ink)", paddingBottom: 6 }}>
              💡 스마트 분석 인사이트
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 2px", fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)" }}>
              {coOccurHabit && (
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14 }}>🔗</span>
                  <div>
                    <strong>동시 달성 루틴: </strong>
                    <div>
                      이 습관을 달성한 날에는 <strong>{coOccurHabit.emoji} {coOccurHabit.name}</strong> 습관도 함께 성공할 확률이 <strong>{coOccurProb}%</strong>로 가장 높았습니다! 두 습관을 연달아 실천하는 세트 루틴으로 묶어보세요.
                    </div>
                  </div>
                </div>
              )}
              {chainSuccessText && (
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start", borderTop: coOccurHabit ? "1px dashed var(--ink-soft)" : "none", paddingTop: coOccurHabit ? 10 : 0 }}>
                  <span style={{ fontSize: 14 }}>⛓</span>
                  <div>
                    <strong>어제 실천의 나비효과: </strong>
                    <div>{chainSuccessText}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const cardStyle = {
  background: "white",
  border: "1.1px solid var(--ink)",
  borderRadius: 12,
  padding: 12,
  boxShadow: "0 3px 0 var(--paper-3)",
};

const cardHeaderStyle = {
  fontFamily: "var(--hand)",
  fontSize: 13,
  fontWeight: "bold",
  color: "var(--ink)",
  marginBottom: 10,
};

window.HabitView = HabitView;
