const state = {
  reviewQueue: null,
  decisions: null,
  memory: null,
  dashboard: null,
  schema: null,
};

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.view).classList.add("active");
  });
});

document.getElementById("refreshButton").addEventListener("click", () => {
  refresh().catch(showError);
});

document.getElementById("saveSchemaButton").addEventListener("click", async () => {
  try {
    const schema = JSON.parse(document.getElementById("schemaEditor").value || "{}");
    await loadJson("/api/custom-schema", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(schema),
    });
    setStatus("Schema saved.");
    await refresh();
  } catch (error) {
    showError(error);
  }
});

document.getElementById("resetSchemaButton").addEventListener("click", () => {
  renderSchemaEditor();
  setStatus("Schema reverted.");
});

async function loadJson(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

function renderList(element, items, emptyText, renderItem) {
  element.innerHTML = "";
  if (!items || items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = emptyText;
    element.appendChild(empty);
    return;
  }
  items.forEach((item) => element.appendChild(renderItem(item)));
}

function row(title, detail) {
  const item = document.createElement("article");
  item.className = "row";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const text = document.createElement("p");
  text.textContent = detail || "";
  item.append(heading, text);
  return item;
}

function button(label, onClick) {
  const control = document.createElement("button");
  control.type = "button";
  control.textContent = label;
  control.addEventListener("click", onClick);
  return control;
}

function actions(...controls) {
  const wrapper = document.createElement("div");
  wrapper.className = "actions";
  wrapper.append(...controls);
  return wrapper;
}

function field(label, control) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const text = document.createElement("span");
  text.textContent = label;
  wrapper.append(text, control);
  return wrapper;
}

function input(value = "") {
  const control = document.createElement("input");
  control.value = Array.isArray(value) ? value.join(", ") : String(value || "");
  return control;
}

function textarea(value = "", rows = 4) {
  const control = document.createElement("textarea");
  control.rows = rows;
  control.value = Array.isArray(value) ? value.join("\n") : String(value || "");
  return control;
}

async function applyReviewOperation(operation) {
  await loadJson("/api/review-operations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operations: [operation] }),
  });
  setStatus("Review operation applied.");
  await refresh();
}

async function refresh() {
  setStatus("Loading...");
  state.reviewQueue = await loadJson("/api/review-queue");
  state.decisions = await loadJson("/api/decisions");
  state.memory = await loadJson("/api/memory");
  state.dashboard = await loadJson("/api/dashboard");
  state.schema = await loadJson("/api/custom-schema");

  renderList(
    document.getElementById("reviewQueue"),
    state.reviewQueue.events,
    "No pending review items.",
    renderReviewEvent
  );
  renderList(
    document.getElementById("decisionList"),
    state.decisions.items,
    "No decision records.",
    renderDecision
  );
  renderList(
    document.getElementById("memoryList"),
    state.memory.items,
    "No long-term memory items.",
    renderMemory
  );
  renderDashboard();
  renderList(
    document.getElementById("schemaList"),
    state.schema.fields,
    "No custom event fields.",
    (schemaField) => row(schemaField.label || schemaField.id, schemaField.type)
  );
  renderSchemaEditor();
  setStatus("Ready.");
}

function renderReviewEvent(event) {
  const item = row(event.summary || event.raw || event.id, event.status);
  const note = textarea(event.meta?.review_note || "", 3);
  item.append(
    field("Review note", note),
    actions(
      button("Confirm", () => applyReviewOperation({
        targetType: "event",
        targetId: event.id,
        action: "confirm",
        note: note.value,
      }).catch(showError)),
      button("Ignore", () => applyReviewOperation({
        targetType: "event",
        targetId: event.id,
        action: "ignore",
        note: note.value,
      }).catch(showError)),
      button("Clarify", () => applyReviewOperation({
        targetType: "event",
        targetId: event.id,
        action: "needs_clarification",
        note: note.value,
      }).catch(showError)),
      button("Keep Draft", () => applyReviewOperation({
        targetType: "event",
        targetId: event.id,
        action: "keep_draft",
        note: note.value,
      }).catch(showError))
    )
  );
  return item;
}

function renderDecision(decision) {
  const item = row(decision.title || decision.id, decision.status || "draft");
  const title = input(decision.title);
  const decisionText = textarea(decision.decision, 3);
  const rationale = textarea(decision.rationale || [], 4);
  const linkedMaterials = input(decision.linked_materials || []);
  const status = document.createElement("select");
  ["draft", "accepted", "superseded", "needs_clarification"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = (decision.status || "draft") === value;
    status.appendChild(option);
  });

  item.append(
    field("Title", title),
    field("Decision", decisionText),
    field("Rationale", rationale),
    field("Linked materials", linkedMaterials),
    field("Status", status),
    actions(
      button("Save", async () => {
        try {
          await loadJson(`/api/decisions/${encodeURIComponent(decision.id)}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              patch: {
                title: title.value,
                decision: decisionText.value,
                rationale: lines(rationale.value),
                linked_materials: commaList(linkedMaterials.value),
                status: status.value,
              },
            }),
          });
          setStatus("Decision saved.");
          await refresh();
        } catch (error) {
          showError(error);
        }
      }),
      button("Revert", () => refresh().catch(showError))
    )
  );
  return item;
}

function renderMemory(memory) {
  const item = row(memory.summary || memory.id, memory.disabled ? "disabled" : memory.review_policy || "active");
  const summary = textarea(memory.summary, 4);
  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `confidence: ${memory.confidence || "unknown"} · review policy: ${memory.review_policy || "default"}`;
  item.append(
    field("Summary", summary),
    meta,
    actions(
      button("Save", () => applyMemory({ action: "update", memoryId: memory.id, summary: summary.value })),
      button(memory.disabled ? "Enable" : "Disable", () => applyMemory({
        action: memory.disabled ? "enable" : "disable",
        memoryId: memory.id,
      })),
      button("Delete", () => applyMemory({ action: "delete", memoryId: memory.id }))
    )
  );
  return item;
}

async function applyMemory(operation) {
  try {
    await loadJson("/api/memory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(operation),
    });
    setStatus("Memory updated.");
    await refresh();
  } catch (error) {
    showError(error);
  }
}

function renderDashboard() {
  const counts = state.dashboard?.counts || {};
  const metrics = document.getElementById("dashboardCounts");
  metrics.innerHTML = "";
  [
    ["Dirty", counts.dirtyItems || 0],
    ["Threads", counts.activeThreads || 0],
    ["Decisions", counts.draftDecisions || 0],
    ["Memory", counts.activeMemoryItems || 0],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "metric";
    const number = document.createElement("strong");
    number.textContent = value;
    const caption = document.createElement("span");
    caption.textContent = label;
    item.append(number, caption);
    metrics.appendChild(item);
  });
  document.getElementById("dashboardJson").textContent = JSON.stringify(state.dashboard, null, 2);
}

function renderSchemaEditor() {
  document.getElementById("schemaEditor").value = JSON.stringify(state.schema || { fields: [] }, null, 2);
}

function lines(value) {
  return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function commaList(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function setStatus(message) {
  document.getElementById("status").textContent = message;
}

function showError(error) {
  const message = error instanceof Error ? error.message : String(error);
  setStatus(message);
}

refresh().catch(showError);
