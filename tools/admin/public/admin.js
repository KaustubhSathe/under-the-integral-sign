/**
 * Vault admin panel — client.
 *
 * Plain ES modules, no framework and no build step: the server serves this file
 * directly. The whole UI hangs off one `state` object and a re-render, which is
 * enough for a single-user editor.
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
  boot: null,
  /** { kind, path, isNew, mtime, frontmatter, body, dirty } */
  current: null,
  dirty: false,
  previewTimer: null,
  devUp: true,
};

/* -------------------------------------------------------------------- api -- */

async function api(pathname, { method = "GET", body } = {}) {
  const res = await fetch(pathname, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (res.status === 401) {
    showLogin();
    throw new Error(data.error ?? "Not signed in.");
  }
  if (!res.ok) {
    const err = new Error(data.error ?? `Request failed (${res.status})`);
    err.payload = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ------------------------------------------------------------------ toast -- */

let toastTimer = null;
function toast(message, kind = "ok", ms = 3200) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.dataset.kind = kind;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, ms);
}

/* ------------------------------------------------------------------ login -- */

function showLogin() {
  $("#login").style.display = "grid";
  $("#app").dataset.ready = "false";
}

function showApp() {
  $("#login").style.display = "none";
  $("#app").dataset.ready = "true";
}

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = $("#loginStatus");
  status.textContent = "";
  try {
    await api("/api/login", { method: "POST", body: { password: $("#password").value } });
    $("#password").value = "";
    await start();
  } catch (err) {
    status.textContent = err.message;
    status.dataset.kind = "err";
  }
});

$("#logoutBtn").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" }).catch(() => {});
  location.reload();
});

/* -------------------------------------------------------------- bootstrap -- */

async function start() {
  state.boot = await api("/api/bootstrap");
  showApp();

  $("#repoName").textContent = state.boot.config.repoRoot;
  renderHelp(state.boot.schema.markdownHelp);
  populateTopicSelect($("#newTopic"));
  renderSidebar();
  renderImages();
  renderGit(state.boot.git, state.boot.recentCommits);
  await probePreviewServer();
  refreshPreview();
}

function populateTopicSelect(select) {
  select.innerHTML = "";
  for (const t of state.boot.schema.topics) {
    const opt = document.createElement("option");
    opt.value = t.value;
    opt.textContent = t.label;
    select.appendChild(opt);
  }
}

function renderHelp(groups) {
  const box = $("#helpContent");
  box.innerHTML = "";
  for (const group of groups) {
    const h = document.createElement("p");
    h.innerHTML = `<strong>${esc(group.title)}</strong>`;
    h.style.margin = "0.6rem 0 0.2rem";
    box.appendChild(h);

    const table = document.createElement("table");
    for (const [code, desc] of group.items) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><code>${esc(code)}</code></td><td>${esc(desc)}</td>`;
      table.appendChild(tr);
    }
    box.appendChild(table);
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/* ---------------------------------------------------------------- sidebar -- */

function renderSidebar() {
  for (const kind of ["problems", "theory"]) {
    const host = kind === "problems" ? $("#listProblems") : $("#listTheory");
    const entries = state.boot.entries[kind] ?? [];
    host.innerHTML = "";

    if (entries.length === 0) {
      const p = document.createElement("div");
      p.className = "side__empty";
      p.textContent = "nothing yet";
      host.appendChild(p);
      continue;
    }

    // Group by topic folder so the list mirrors the tree on disk.
    const groups = new Map();
    for (const entry of entries) {
      const topic = entry.path.includes("/") ? entry.path.split("/")[0] : "(root)";
      if (!groups.has(topic)) groups.set(topic, []);
      groups.get(topic).push(entry);
    }

    for (const [topic, list] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const head = document.createElement("div");
      head.className = "side__head";
      head.style.borderTop = "0";
      head.style.paddingTop = "0.5rem";
      head.style.textTransform = "none";
      head.style.letterSpacing = "0";
      head.innerHTML = `<span style="color:var(--text-3)">${esc(topic)}</span>`;
      host.appendChild(head);

      for (const entry of list.sort((a, b) => a.title.localeCompare(b.title))) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `side__item${entry.draft ? " side__item--draft" : ""}`;
        btn.dataset.path = entry.path;
        btn.dataset.kind = kind;
        if (state.current?.path === entry.path && state.current?.kind === kind) {
          btn.setAttribute("aria-current", "true");
        }
        const marks = [];
        if (entry.difficulty) marks.push(entry.difficulty.slice(0, 3));
        if (entry.status === "stub") marks.push("stub");
        btn.innerHTML = `<span class="t">${esc(entry.title)}</span><span class="m">${esc(marks.join(" · "))}</span>`;
        if (entry.error) btn.title = entry.error;
        btn.addEventListener("click", () => openEntry(kind, entry.path));
        host.appendChild(btn);
      }
    }
  }
}

/* ----------------------------------------------------------- open an entry -- */

async function confirmDiscard() {
  if (!state.dirty) return true;
  return askConfirm(
    "Discard unsaved changes?",
    "The current entry has edits that have not been saved.",
    "Discard",
  );
}

async function openEntry(kind, path) {
  if (!(await confirmDiscard())) return;
  try {
    const entry = await api(`/api/entry?kind=${encodeURIComponent(kind)}&path=${encodeURIComponent(path)}`);
    state.current = {
      kind,
      path: entry.path,
      isNew: false,
      mtime: entry.mtime,
      frontmatter: entry.frontmatter,
      body: entry.body,
    };
    state.dirty = false;
    renderForm();
    renderSidebar();
    refreshPreview();
  } catch (err) {
    toast(err.message, "err");
  }
}

/* -------------------------------------------------------------- the form -- */

function fieldsFor(kind) {
  return state.boot.schema.kinds[kind].fields;
}

function renderForm() {
  const cur = state.current;
  if (!cur) return;

  $("#editorEmpty").hidden = true;
  $("#entryForm").hidden = false;
  $("#kindBadge").textContent = state.boot.schema.kinds[cur.kind].label;
  $("#pathBadge").textContent = cur.isNew ? "unsaved" : `content/${cur.kind}/${cur.path}`;
  $("#body").value = cur.body;
  setSaveState(cur.isNew ? "unsaved" : "saved");

  const host = $("#fields");
  host.innerHTML = "";

  /*
   * The file path is shown READ-ONLY rather than as an editable "slug" field.
   *
   * There are two reasons. A frontmatter `slug` would override Astro's entry id
   * and flatten the URL, so the path is the single source of truth; and an input
   * that looks editable but is ignored is worse than no input at all. Renaming
   * goes through "Rename file…", which actually moves the file.
   */
  const fileWrap = document.createElement("div");
  fileWrap.className = "field";
  fileWrap.innerHTML = '<div class="field__label">File</div>';
  const fileText = document.createElement("div");
  fileText.className = "mono";
  fileText.id = "field-file";
  fileText.style.cssText = "color:var(--text-2); font-size:0.85rem; word-break:break-all";
  fileText.textContent = cur.isNew
    ? "not saved yet — the file is named after the title"
    : `content/${cur.kind}/${cur.path}`;
  fileWrap.appendChild(fileText);
  const fileHint = document.createElement("div");
  fileHint.className = "field__hint";
  fileHint.textContent = cur.isNew
    ? "The topic decides the folder; the title decides the filename."
    : "This path is the entry's URL. Use “Rename file…” to change the filename.";
  fileWrap.appendChild(fileHint);
  host.appendChild(fileWrap);

  for (const f of fieldsFor(cur.kind)) {
    host.appendChild(renderField(f, cur.frontmatter[f.key]));
  }

  const wide = [
    ["hints", 3],
    ["keyIdea", 3],
    ["statement", 3],
    ["summary", 2],
  ];
  for (const [key, rows] of wide) {
    const el = $(`#field-${key}`);
    if (el) el.rows = rows;
  }
}

function renderField(f, value) {
  const wrap = document.createElement("div");
  wrap.className = "field";

  const lab = document.createElement("div");
  lab.className = "field__label";
  lab.innerHTML = `${esc(f.label)}${f.required ? ' <span class="field__req">*</span>' : ""}`;
  wrap.appendChild(lab);

  const addHint = (hint = f.hint) => {
    if (!hint) return;
    const h = document.createElement("div");
    h.className = "field__hint";
    h.textContent = hint;
    wrap.appendChild(h);
  };

  const onInput = () => markDirty();

  switch (f.type) {
    case "textarea": {
      const ta = document.createElement("textarea");
      ta.id = `field-${f.key}`;
      ta.rows = f.rows ?? 3;
      ta.value = value ?? "";
      ta.placeholder = f.placeholder ?? "";
      ta.addEventListener("input", onInput);
      wrap.appendChild(ta);
      break;
    }

    case "select": {
      const sel = document.createElement("select");
      sel.id = `field-${f.key}`;
      const opts = f.key === "status" ? [] : [{ value: "", label: "— none —" }];
      for (const opt of [...opts, ...f.options]) {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        sel.appendChild(o);
      }
      sel.value = value ?? (f.key === "status" ? "stub" : "");
      sel.addEventListener("change", onInput);
      wrap.appendChild(sel);
      break;
    }

    case "multiselect": {
      const box = document.createElement("div");
      box.className = "checks";
      const chosen = new Set(Array.isArray(value) ? value : []);
      for (const opt of f.options) {
        const label = document.createElement("label");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = opt.value;
        cb.checked = chosen.has(opt.value);
        cb.dataset.field = f.key;
        cb.addEventListener("change", onInput);
        label.appendChild(cb);
        label.appendChild(document.createTextNode(opt.label));
        box.appendChild(label);
      }
      wrap.appendChild(box);
      break;
    }

    case "list": {
      const ta = document.createElement("textarea");
      ta.id = `field-${f.key}`;
      ta.rows = f.multiline ? 3 : 2;
      ta.value = Array.isArray(value) ? value.join("\n") : (value ?? "");
      ta.placeholder = "one per line";
      ta.addEventListener("input", onInput);
      wrap.appendChild(ta);
      addHint();
      return wrap;
    }

    case "boolean": {
      const label = document.createElement("label");
      label.className = "checks";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = `field-${f.key}`;
      cb.checked = value === true;
      cb.addEventListener("change", onInput);
      label.appendChild(cb);
      label.appendChild(document.createTextNode("yes"));
      wrap.appendChild(label);
      break;
    }

    case "number": {
      const input = document.createElement("input");
      input.type = "number";
      input.id = `field-${f.key}`;
      input.value = value ?? "";
      input.placeholder = f.placeholder ?? "";
      input.addEventListener("input", onInput);
      wrap.appendChild(input);
      break;
    }

    case "date": {
      const input = document.createElement("input");
      input.type = "date";
      input.id = `field-${f.key}`;
      input.value = toDateInput(value);
      input.addEventListener("input", onInput);
      wrap.appendChild(input);
      break;
    }

    default: {
      const input = document.createElement("input");
      input.type = "text";
      input.id = `field-${f.key}`;
      input.value = value ?? "";
      input.placeholder = f.placeholder ?? "";
      input.addEventListener("input", onInput);
      wrap.appendChild(input);
    }
  }

  addHint();
  return wrap;
}

function toDateInput(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1] : "";
}

/* ------------------------------------------------------------ collect form -- */

function collect() {
  const cur = state.current;
  const fm = {};

  /*
   * Deliberately no `slug` key. Astro's glob loader treats a frontmatter slug as
   * the entry's entire id, which collapses its URL and loses the topic folder.
   * The file path is the single source of truth; renaming goes through
   * "Rename file…", which actually moves the file.
   */
  for (const f of fieldsFor(cur.kind)) {
    const el = $(`#field-${f.key}`);
    switch (f.type) {
      case "multiselect":
        fm[f.key] = $$(`input[data-field="${f.key}"]:checked`).map((c) => c.value);
        break;
      case "boolean":
        fm[f.key] = Boolean(el?.checked);
        break;
      case "list":
        fm[f.key] = (el?.value ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "number":
        fm[f.key] = el?.value === "" ? "" : Number(el.value);
        break;
      default:
        fm[f.key] = el?.value ?? "";
    }
  }

  return { frontmatter: fm, body: $("#body").value };
}

function markDirty() {
  state.dirty = true;
  setSaveState("unsaved");
}

/*
 * Saved / unsaved / error is the single source of truth for whether Save can be
 * pressed.
 *
 * The button used to start `disabled` in the markup and nothing ever enabled it,
 * so it was dead for any entry the user had not typed into. That is exactly an
 * AI draft: the body arrives already filled, no input event fires, and Save stays
 * greyed out with no explanation. Manual entries appeared to work only because
 * typing in the body happened to flip it.
 */
function setSaveState(kind) {
  const el = $("#saveState");
  el.textContent = kind;
  el.className = `badge ${kind === "saved" ? "badge--ok" : kind === "unsaved" ? "badge--warn" : "badge--err"}`;

  const save = $("#saveBtn");
  if (save) {
    const canSave = kind !== "saved";
    save.disabled = !canSave;
    // Say why it is unavailable, rather than leaving a dead-looking control.
    save.title = canSave ? "Write the entry to disk" : "No changes to save";
  }
}

/* ------------------------------------------------------------------- save -- */

async function save({ renameFile = false, force = false } = {}) {
  const cur = state.current;
  if (!cur) return false;

  const { frontmatter, body } = collect();
  try {
    const res = await api("/api/save", {
      method: "POST",
      body: {
        kind: cur.kind,
        path: cur.isNew ? null : cur.path,
        frontmatter,
        body,
        expectedMtime: cur.isNew ? null : cur.mtime,
        renameFile,
        force,
      },
    });

    const wasNew = cur.isNew;
    state.current = {
      kind: cur.kind,
      path: res.path,
      isNew: false,
      mtime: res.mtime,
      frontmatter: res.frontmatter,
      body,
    };
    state.dirty = false;
    setSaveState("saved");
    $("#pathBadge").textContent = `content/${cur.kind}/${res.path}`;
    $("#status").textContent = `Saved to content/${cur.kind}/${res.path}`;
    $("#status").dataset.kind = "ok";
    toast(wasNew ? `Created ${res.path}` : `Saved ${res.path}`);

    await refreshLists();
    renderSidebar();
    refreshPreview();
    return true;
  } catch (err) {
    const details = err.payload?.errors?.length ? `\n• ${err.payload.errors.join("\n• ")}` : "";
    $("#status").textContent = `${err.message}${details}`;
    $("#status").dataset.kind = "err";
    setSaveState("error");

    if (err.payload?.conflict) {
      const overwrite = await askConfirm(
        "Conflict",
        `${err.message}\n\nOverwrite anyway?`,
        "Overwrite",
      );
      if (overwrite) return save({ renameFile, force: true });
    } else if (err.payload?.errors?.length) {
      /*
       * Point at the offending fields, and flash them, rather than leaving the
       * reader to work out which of twenty inputs the server objected to.
       */
      const keys = fieldsNamedIn(err.payload.errors);
      for (const key of keys) {
        const el = $(`#field-${key}`);
        if (!el) continue;
        el.classList.add("field--invalid");
        setTimeout(() => el.classList.remove("field--invalid"), 4000);
      }
      const where = keys.length ? ` Check: ${keys.join(", ")}.` : "";
      toast(`Frontmatter is invalid.${where}`, "err", 8000);
      $("#status").scrollIntoView({ block: "nearest" });
    } else {
      toast(err.message, "err", 6000);
    }
    return false;
  }
}

/**
 * Which form fields does a list of validation errors refer to?
 *
 * The server phrases errors by label ("Difficulty is required."), so the label is
 * matched back to its field key. Label text is compared case-insensitively and by
 * prefix, because messages vary ("Exam source: ... is not one of ...").
 */
function fieldsNamedIn(errors) {
  const cur = state.current;
  if (!cur) return [];
  const fields = fieldsFor(cur.kind);
  const keys = new Set();
  for (const message of errors) {
    const lower = String(message).toLowerCase();
    for (const f of fields) {
      const label = String(f.label ?? f.key).toLowerCase();
      if (lower.startsWith(label) || lower.includes(`${label}:`) || lower.includes(`${label} is`)) {
        keys.add(f.key);
      }
    }
  }
  return [...keys];
}

$("#saveBtn").addEventListener("click", () => save());
$("#body").addEventListener("input", markDirty);

/* ------------------------------------------------------------- new / delete -- */

/**
 * New-entry dialog: two modes.
 *
 *  - Manual: pick kind/topic and a title, get an empty template.
 *  - AI: describe the entry or attach a photo, DeepSeek drafts the frontmatter
 *    and the body, and the result opens in the normal editor for review. Nothing
 *    is written to disk until Save is pressed.
 */
const ai = {
  /** data: URL of the attached photo, or null. */
  image: null,
  imageName: "",
  busy: false,
  /** AbortController for an in-flight generation, so Cancel can stop it. */
  controller: null,
  /** null = not asked yet, so the status line is fetched once per session. */
  configured: null,
  model: "",
};

/**
 * A difficulty the schema will accept.
 *
 * `difficulty` is required, so leaving it unset makes the entry unsaveable. A
 * model that returns something off-list ("medium", "easy") would otherwise be
 * silently dropped and the select left on "— none —", which is what broke
 * saving with no visible cause.
 */
function validDifficulty(preferred) {
  const valid = state.boot.schema.difficulties.map((x) => x.value);
  if (valid.includes(preferred)) return preferred;
  return valid.includes("standard") ? "standard" : valid[0];
}

/** The single subtopic of a topic: a PATH segment, never frontmatter. */
function soleSubtopicFor(topic) {
  const subs = state.boot.schema.subtopicsByTopic?.[topic] ?? [];
  return subs[0]?.value ?? topic;
}

$("#newBtn").addEventListener("click", () => openNewDialog($("#newKind").value || "problems"));
$$("[data-new-kind]").forEach((btn) =>
  btn.addEventListener("click", () => openNewDialog(btn.dataset.newKind)),
);

function openNewDialog(kind) {
  $("#newKind").value = kind;
  $("#newTitle").value = "";
  $("#newTopic").value = state.boot.schema.topics[0].value;
  $("#aiPrompt").value = "";
  clearAiImage();
  setNewMode("manual");
  $("#newDialog").showModal();
  $("#newTitle").focus();
  // Ask the server once whether a key is configured, so the AI tab can say so
  // honestly rather than failing only after a prompt has been written.
  void loadAiStatus();
}

async function loadAiStatus() {
  if (ai.configured !== null) return;
  try {
    const s = await api("/api/ai-status");
    ai.configured = Boolean(s.configured);
    ai.model = s.model ?? "";
  } catch {
    ai.configured = false;
  }
  renderAiStatus();
}

function renderAiStatus() {
  const box = $("#aiStatus");
  if ($("#newMode").value !== "ai") {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  if (ai.configured) {
    box.className = "aistatus aistatus--ok";
    box.textContent = `DeepSeek is configured (${ai.model}). The draft opens in the editor for you to check before saving.`;
  } else {
    box.className = "aistatus aistatus--warn";
    box.textContent =
      "No DEEPSEEK_API_KEY found. Add it to .env and restart the admin panel to use AI entry. Manual entry still works.";
  }
}

function setNewMode(mode) {
  $("#newMode").value = mode;
  const isAi = mode === "ai";
  $$("#newForm .modebar__opt").forEach((btn) => {
    const on = btn.dataset.mode === mode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-checked", String(on));
  });
  $("#aiPanel").hidden = !isAi;
  // With AI the title comes back from the model, so the field is not needed.
  $("#newTitleField").hidden = isAi;
  $("#newSubmit").textContent = isAi ? "Generate draft" : "Create";
  $("#newDialogTitle").textContent = isAi ? "New entry — AI draft" : "New entry";
  renderAiStatus();
  if (!isAi) $("#newTitle").focus();
}

$$("#newForm .modebar__opt").forEach((btn) =>
  btn.addEventListener("click", () => setNewMode(btn.dataset.mode)),
);

/* ------------------------------------------------------------- photo input -- */

/*
 * One path in for every way of supplying a photo: the file picker, a drag onto
 * the drop zone, and a paste from the clipboard. All three produce a File, so
 * they share setAiImage().
 */

const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_MIME = /^image\/(png|jpeg|gif|webp)$/;

async function setAiImage(file) {
  if (!file) return;

  if (!IMAGE_MIME.test(file.type)) {
    // A clipboard image sometimes arrives as image/bmp or has no type at all.
    toast(
      file.type
        ? `${file.type} is not supported — use PNG, JPEG, GIF or WebP.`
        : "That clipboard item is not a PNG, JPEG, GIF or WebP image.",
      "err",
      7000,
    );
    return;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    toast(`That image is ${(file.size / 1048576).toFixed(1)} MB; the limit is 8 MB.`, "err", 6000);
    return;
  }

  try {
    ai.image = await readAsDataUrl(file);
    ai.imageName = file.name || "pasted image";
    $("#aiImageThumb").src = ai.image;
    $("#aiImageInfo").textContent =
      `${ai.imageName} — ${(file.size / 1048576).toFixed(2)} MB`;
    $("#aiImagePreview").hidden = false;
    toast("Photo attached. Press Generate draft when ready.", "ok", 3500);
  } catch (err) {
    toast(`Could not read that image: ${err.message}`, "err");
    clearAiImage();
  }
}

$("#aiImage").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) void setAiImage(file);
});

/* Click anywhere on the zone to browse; the file input is visually hidden. */
$("#aiDropZone").addEventListener("click", (event) => {
  if (event.target.closest("#aiImageClear")) return;
  $("#aiImage").click();
});
$("#aiDropZone").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    $("#aiImage").click();
  }
});

/* Drag and drop onto the zone. */
["dragenter", "dragover"].forEach((type) =>
  $("#aiDropZone").addEventListener(type, (event) => {
    event.preventDefault();
    $("#aiDropZone").classList.add("is-dragging");
  }),
);
["dragleave", "drop"].forEach((type) =>
  $("#aiDropZone").addEventListener(type, () => {
    $("#aiDropZone").classList.remove("is-dragging");
  }),
);
$("#aiDropZone").addEventListener("drop", (event) => {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (file) void setAiImage(file);
});

/**
 * Paste an image from the clipboard.
 *
 * Bound to the document rather than the drop zone, because a paste event fires on
 * whatever has focus — and after switching to AI mode that is the prompt box, not
 * the drop zone. A paste carrying a file is unambiguous (text pastes have no
 * `files`), so acting on it even while the user is in the textarea is the
 * behaviour they are asking for. The AI panel must be open for this to apply.
 */
document.addEventListener("paste", (event) => {
  if ($("#newDialog")?.open !== true) return;
  if ($("#newMode")?.value !== "ai") return;

  const items = [...(event.clipboardData?.items ?? [])];
  const image = items.find((i) => i.kind === "file" && i.type.startsWith("image/"));
  if (image) {
    const file = image.getAsFile();
    if (!file) return;
    event.preventDefault();
    void setAiImage(file);
    return;
  }

  /*
   * A file that is not an image. Text pastes (a screenshot's file, a copied
   * problem statement) have `kind === "string"` and must fall through so the
   * browser can paste them into whichever field has focus, so only a non-image
   * FILE is worth complaining about.
   */
  const otherFile = items.find((i) => i.kind === "file");
  if (otherFile?.type) {
    event.preventDefault();
    toast(`${otherFile.type} is not an image — use PNG, JPEG, GIF or WebP.`, "err", 6000);
  }
});

$("#aiImageClear").addEventListener("click", (event) => {
  event.stopPropagation();
  clearAiImage();
});

function clearAiImage() {
  ai.image = null;
  ai.imageName = "";
  const input = $("#aiImage");
  if (input) input.value = "";
  const preview = $("#aiImagePreview");
  if (preview) preview.hidden = true;
  const thumb = $("#aiImageThumb");
  if (thumb) thumb.removeAttribute("src");
  const info = $("#aiImageInfo");
  if (info) info.textContent = "";
}

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });

/* ------------------------------------------------------------------ submit -- */

$("#newCancel").addEventListener("click", () => {
  // Cancelling mid-generation should also stop the request, not leave it running.
  if (ai.controller) ai.controller.abort();
  $("#newDialog").close();
});

/** Stop generating, but keep the dialog open so the prompt is not lost. */
$("#aiCancel").addEventListener("click", () => {
  if (ai.controller) ai.controller.abort();
});

$("#newForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const mode = $("#newMode").value;
  const kind = $("#newKind").value;
  const topic = $("#newTopic").value;

  if (mode === "ai") return generateAiDraft({ kind, topic });

  const title = $("#newTitle").value.trim() || "Untitled";
  if (!(await confirmDiscard())) return;
  $("#newDialog").close();

  // Start from an empty frontmatter bag, then let the schema defaults apply.
  // No `subtopic` key: it is a folder, not a field. `difficulty` is required, so
  // it is seeded rather than left blank and rejected at save time.
  state.current = {
    kind,
    path: "",
    isNew: true,
    mtime: null,
    frontmatter: {
      title,
      topic,
      status: "stub",
      ...(kind === "problems" ? { difficulty: validDifficulty("standard") } : {}),
    },
    body: defaultBody(kind, title),
  };
  state.dirty = true;
  renderForm();
  setSaveState("unsaved");
  $("#status").textContent = "Not saved yet — press Save to create the file.";
  $("#body").focus();
});

/**
 * Send the prompt (and any photo) to the server, then open the result in the
 * editor. Deliberately does NOT save: model output always needs a human pass,
 * especially the mathematics.
 *
 * The response is an SSE stream, so the panel shows the solution being written
 * rather than an unexplained wait. A long entry takes tens of seconds.
 */
async function generateAiDraft({ kind, topic }) {
  const prompt = $("#aiPrompt").value.trim();
  if (!prompt && !ai.image) {
    toast("Describe the entry, or attach a photo of the problem.", "warn", 6000);
    return;
  }
  if (ai.busy) return;

  const button = $("#newSubmit");
  const label = button.textContent;
  const status = $("#aiStatus");
  const log = $("#aiLog");
  const progress = $("#aiProgress");

  ai.busy = true;
  button.disabled = true;
  button.textContent = "Generating…";
  $("#aiCancel").hidden = false;
  status.hidden = true;
  progress.hidden = false;
  log.textContent = "";
  log.hidden = false;

  const startedAt = Date.now();
  const say = (line) => {
    const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
    log.textContent += `[${secs.padStart(5)}s] ${line}\n`;
    log.scrollTop = log.scrollHeight;
  };
  say(ai.image ? "Sending the prompt and the photo…" : "Sending the prompt…");

  ai.controller = new AbortController();
  let result = null;
  let failure = null;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, prompt, image: ai.image }),
      signal: ai.controller.signal,
    });

    if (!res.ok || !res.body) {
      // A non-stream failure (auth, unknown kind) still answers with JSON.
      const text = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        msg = JSON.parse(text).error ?? msg;
      } catch {
        /* keep the status line */
      }
      throw new Error(msg);
    }

    await readSse(res.body, (event) => {
      if (event.type === "progress") {
        const p = event.phase;
        if (p === "connecting") say("Connected. The model is reading your request…");
        else if (p === "retrying") say(`Empty reply from the API — retrying (attempt ${event.attempt + 1})…`);
        else if (p === "streaming") {
          say(`Writing… ${event.chars} characters (~${event.tokens} tokens)`);
        } else if (p === "parsing") {
          say(`Reply complete (${event.chars} characters). Parsing the entry…`);
        }
      } else if (event.type === "done") {
        result = event;
        say(`Done in ${(event.elapsedMs / 1000).toFixed(1)}s.`);
      } else if (event.type === "error") {
        failure = event.error;
      }
    });

    if (failure) throw new Error(failure);
    if (!result) throw new Error("The server closed the stream without a result.");

    const d = result.entry ?? {};

    if (!(await confirmDiscard())) return;
    // Fold the log away on success; it exists to explain the wait, which is over.
    progress.hidden = true;
    $("#newDialog").close();

    const title = d.title || "Untitled";
    // No `subtopic`: the schema has no such field. `topic` alone is the contract.
    const fm = { title, topic, status: "stub" };
    if (d.summary) fm.summary = d.summary;
    if (d.keyIdea) fm.keyIdea = d.keyIdea;
    if (d.answer) fm.answer = d.answer;
    if (Array.isArray(d.tags) && d.tags.length) fm.tags = d.tags;

    if (kind === "problems") {
      // Required, so it is always seeded with something valid: the model's choice
      // when it is one the schema knows, otherwise a sensible default.
      fm.difficulty = validDifficulty(d.difficulty);
      // Only accept an exam the schema knows, and never override "own" silently:
      // a wrong competition label is worse than a blank one.
      const exams = state.boot.schema.examTypes.map((x) => x.value);
      if (exams.includes(d.exam) && d.exam !== "own") fm.exam = d.exam;
    } else {
      const valid = state.boot.schema.theorySections.map((x) => x.value);
      if (valid.includes(d.section)) fm.section = d.section;
    }

    state.current = {
      kind,
      path: "",
      isNew: true,
      mtime: null,
      frontmatter: fm,
      body: d.body || defaultBody(kind, title),
    };
    state.dirty = true;
    renderForm();
    setSaveState("unsaved");

    const secs = (result.elapsedMs / 1000).toFixed(1);
    if (result.partial) {
      /*
       * The reply hit the model's output limit and was salvaged. The fields that
       * arrived are usable, but something is missing, so this is said plainly
       * rather than presented as a finished draft.
       */
      $("#status").textContent = d.body
        ? `PARTIAL draft (${secs}s) — the reply was cut off, so the end of the body may be missing. Check it carefully.`
        : `PARTIAL draft (${secs}s) — the reply was cut off before the body was written. Generate again, or ask for something shorter.`;
      toast("The reply was cut off. The draft is incomplete — check it.", "warn", 9000);
    } else {
      const used = result.usage?.outputTokens;
      $("#status").textContent =
        `AI draft ready in ${secs}s — check the maths, then press Save to create the file.` +
        (used ? ` (${used} output tokens)` : "");
      toast("Draft generated. Review it before saving.", "ok", 6000);
    }
    $("#body").focus();
  } catch (err) {
    const cancelled = err.name === "AbortError" || /cancelled/i.test(err.message);
    if (cancelled) {
      say("Cancelled.");
      status.hidden = false;
      status.className = "aistatus aistatus--warn";
      status.textContent = "Cancelled. Nothing was saved.";
    } else {
      say(`Failed: ${err.message}`);
      status.hidden = false;
      status.className = "aistatus aistatus--error";
      status.textContent = err.message;
      toast(err.message, "err", 8000);
    }
  } finally {
    ai.busy = false;
    ai.controller = null;
    button.disabled = false;
    button.textContent = label;
    $("#aiCancel").hidden = true;
  }
}

/**
 * Read a `text/event-stream` body and hand each parsed event to `onEvent`.
 * Split from the caller so the framing rules live in one place.
 */
async function readSse(body, onEvent) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let split;
    while ((split = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue; // ": keep-alive" comments
        try {
          onEvent(JSON.parse(line.slice(5).trim()));
        } catch {
          /* ignore a malformed frame rather than losing the whole stream */
        }
      }
    }
  }
}

function defaultBody(kind, title) {
  if (kind === "theory") {
    return [
      `## Statement`,
      ``,
      `Write the precise statement here.`,
      ``,
      `## Proof`,
      ``,
      `$$`,
      ``,
      `$$`,
      ``,
      `## Why it works, and when to reach for it`,
      ``,
      `## Common failure modes`,
      ``,
    ].join("\n");
  }
  return [
    `State the problem here.`,
    ``,
    `$$`,
    ``,
    `$$`,
    ``,
    `<details>`,
    `<summary>Hint</summary>`,
    ``,
    `A nudge that does not give the game away.`,
    ``,
    `</details>`,
    ``,
    `## Solution`,
    ``,
    `$$`,
    ``,
    `$$`,
    ``,
    `## The reusable idea`,
    ``,
  ].join("\n");
}

$("#deleteBtn").addEventListener("click", async () => {
  const cur = state.current;
  if (!cur || cur.isNew) {
    if (cur?.isNew) {
      state.current = null;
      state.dirty = false;
      $("#entryForm").hidden = true;
      $("#editorEmpty").hidden = false;
    }
    return;
  }
  const yes = await askConfirm(
    "Delete this entry?",
    `content/${cur.kind}/${cur.path} will be deleted from disk. This is recoverable from git until you commit.`,
    "Delete",
  );
  if (!yes) return;
  try {
    await api("/api/delete", { method: "POST", body: { kind: cur.kind, path: cur.path } });
    toast(`Deleted ${cur.path}`);
    state.current = null;
    state.dirty = false;
    $("#entryForm").hidden = true;
    $("#editorEmpty").hidden = false;
    await refreshLists();
    renderSidebar();
  } catch (err) {
    toast(err.message, "err");
  }
});

/* ----------------------------------------------------------------- rename -- */

$("#renameBtn").addEventListener("click", () => {
  const cur = state.current;
  if (!cur || cur.isNew) return;
  $("#renameSlug").value = cur.path.slice(cur.path.lastIndexOf("/") + 1).replace(/\.md$/, "");
  $("#renameDialog").showModal();
  $("#renameSlug").focus();
});

$("#renameCancel").addEventListener("click", () => $("#renameDialog").close());

$("#renameForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const cur = state.current;
  const slug = $("#renameSlug").value.trim();
  $("#renameDialog").close();
  if (!slug) return;
  try {
    const res = await api("/api/rename", {
      method: "POST",
      body: { kind: cur.kind, path: cur.path, newSlug: slug },
    });
    state.current.path = res.path;
    toast(`Renamed to ${res.path}`);
    await refreshLists();
    renderSidebar();
    renderForm();
    refreshPreview();
  } catch (err) {
    toast(err.message, "err");
  }
});

/* ---------------------------------------------------------------- toolbar -- */

$("#bodyToolbar").addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;
  const ta = $("#body");

  if (btn.dataset.wrap) {
    wrapSelection(ta, btn.dataset.wrap);
  } else if (btn.dataset.insert) {
    insertAtCursor(ta, btn.dataset.insert);
  } else if (btn.id === "imageBtn") {
    $("#filePicker").click();
  }
  markDirty();
});

function wrapSelection(ta, token) {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const selected = value.slice(s, e) || "text";
  ta.value = `${value.slice(0, s)}${token}${selected}${token}${value.slice(e)}`;
  ta.selectionStart = s + token.length;
  ta.selectionEnd = s + token.length + selected.length;
  ta.focus();
}

function insertAtCursor(ta, text) {
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const needsLeadingNewline = s > 0 && value[s - 1] !== "\n";
  const block = `${needsLeadingNewline ? "\n" : ""}${text}\n`;
  ta.value = value.slice(0, s) + block + value.slice(e);
  const caret = s + block.length;
  ta.selectionStart = caret;
  ta.selectionEnd = caret;
  ta.focus();
}

/* ----------------------------------------------------------------- images -- */

$("#filePicker").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (file) await uploadImage(file);
  event.target.value = "";
});

const dropzone = $("#dropzone");
["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.dataset.over = "true";
  }),
);
["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, () => {
    dropzone.dataset.over = "false";
  }),
);
dropzone.addEventListener("drop", async (event) => {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (file) await uploadImage(file);
});

// Paste an image straight into the editor and it gets uploaded + linked.
$("#body").addEventListener("paste", async (event) => {
  const item = [...(event.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
  if (!item) return;
  event.preventDefault();
  const file = item.getAsFile();
  if (file) await uploadImage(file);
});

async function uploadImage(file) {
  if (!file.type.startsWith("image/")) {
    toast("That is not an image.", "err");
    return;
  }
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read the file."));
      reader.readAsDataURL(file);
    });
    const res = await api("/api/images", { method: "POST", body: { name: file.name || "pasted.png", dataUrl } });
    insertAtCursor($("#body"), `![${file.name || "figure"}](${res.url})`);
    markDirty();
    renderImages();
    toast(`Uploaded ${res.name}`);
  } catch (err) {
    toast(err.message, "err");
  }
}

async function renderImages() {
  const host = $("#imageList");
  let images = state.boot.images ?? [];
  try {
    images = (await api("/api/images")).images;
    state.boot.images = images;
  } catch {
    /* keep whatever we had */
  }
  host.innerHTML = "";
  for (const img of images) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = `Insert ${img.name}`;
    const el = document.createElement("img");
    el.src = img.url;
    el.alt = img.name;
    el.loading = "lazy";
    btn.appendChild(el);
    btn.addEventListener("click", () => {
      const alt = img.name.replace(/\.[a-z0-9]+$/i, "");
      insertAtCursor($("#body"), `![${alt}](${img.url})`);
      markDirty();
    });
    host.appendChild(btn);
  }
}

/* ---------------------------------------------------------------- preview -- */

/**
 * Is the Astro dev server listening? A cross-origin fetch cannot tell us: with
 * mode "no-cors" a dead port and a live one both look the same. Loading the URL
 * in an iframe and waiting for `load` is a reliable probe, because a refused
 * connection never fires it.
 */
function probePreviewServer() {
  const url = state.boot.config.devUrl;
  return new Promise((resolve) => {
    const probe = document.createElement("iframe");
    probe.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0";
    let settled = false;
    const finish = (up) => {
      if (settled) return;
      settled = true;
      state.devUp = up;
      probe.remove();
      resolve(up);
    };
    probe.addEventListener("load", () => finish(true));
    probe.addEventListener("error", () => finish(false));
    setTimeout(() => finish(false), 2500);
    probe.src = url;
    document.body.appendChild(probe);
  });
}

function previewUrlFor(cur) {
  if (!cur || cur.isNew) return null;
  const slug = cur.path.replace(/\.md$/, "");
  return `${state.boot.config.devUrl}/${cur.kind}/${slug}/`;
}

/**
 * Explain what the preview pane is showing, and why it might be empty.
 *
 * `state.devUp` comes from probePreviewServer(). It is checked FIRST and the
 * messages are distinct on purpose: telling someone to "run pnpm dev" when it is
 * already running sends them chasing a problem that does not exist, and hiding
 * the pane when the server is down avoids an unexplained connection error inside
 * the iframe.
 */
function refreshPreview() {
  const cur = state.current;
  const iframe = $("#preview");
  const empty = $("#previewEmpty");
  const url = previewUrlFor(cur);

  const show = (message) => {
    iframe.hidden = true;
    iframe.removeAttribute("src");
    empty.hidden = false;
    empty.textContent = message;
  };

  if (!state.devUp) {
    show(
      "The Astro dev server is not running, so there is nothing to render. " +
        "Run `pnpm dev` in another terminal, then press Refresh.",
    );
    return;
  }

  if (!url) {
    show(
      cur
        ? "Unsaved entry — save it and the rendered page will appear here."
        : "Select an entry from the list to see its rendered page here.",
    );
    return;
  }

  iframe.hidden = false;
  empty.hidden = true;
  $("#previewLabel").textContent = url.replace(state.boot.config.devUrl, "");
  iframe.src = url;
}

$("#refreshPreview").addEventListener("click", refreshPreview);

// After a successful save, refresh the preview shortly afterwards — the dev
// server needs a moment to notice the file changed.
async function saveAndMaybeRefresh(opts) {
  const ok = await save(opts);
  if (ok && $("#autoRefresh").checked) {
    clearTimeout(state.previewTimer);
    state.previewTimer = setTimeout(refreshPreview, 900);
  }
  return ok;
}
$("#saveBtn").addEventListener("click", () => saveAndMaybeRefresh());

$("#openSiteBtn").addEventListener("click", () => {
  const url = previewUrlFor(state.current);
  if (!url) {
    toast("Save the entry first.", "warn");
    return;
  }
  window.open(url, "_blank", "noopener");
});

/* -------------------------------------------------------------------- git -- */

async function refreshLists() {
  const fresh = await api("/api/bootstrap");
  state.boot.entries = fresh.entries;
  state.boot.images = fresh.images;
  state.boot.git = fresh.git;
  state.boot.recentCommits = fresh.recentCommits;
  renderGit(fresh.git, fresh.recentCommits);
  renderImages();
}

function renderGit(status, commits) {
  $("#gitBranch").textContent = status.isRepo ? status.branch : "no repository";
  $("#gitRemote").textContent = status.remote || (status.isRepo ? "no remote" : "—");
  $("#gitRemote").title = status.remote || "";

  const ahead = status.isRepo && status.hasUpstream ? `${status.ahead}↑ ${status.behind}↓` : "";
  const files = status.files ?? [];
  const host = $("#gitFiles");
  host.innerHTML = "";
  if (files.length === 0) {
    const span = document.createElement("span");
    span.className = "git__file";
    span.textContent = status.isRepo ? "working tree clean" : "not a git repository yet";
    host.appendChild(span);
  } else {
    for (const f of files) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "git__file";
      btn.innerHTML = `<b>${esc(f.status[0].toUpperCase())}</b> ${esc(f.file)}`;
      btn.title = "Show diff";
      btn.addEventListener("click", () => showDiff(f.file));
      host.appendChild(btn);
    }
  }
  $("#commitMsg").placeholder = files.length
    ? `Commit message (${files.length} file${files.length === 1 ? "" : "s"} changed)`
    : "Commit message";

  const log = $("#gitLog");
  log.innerHTML = "";
  const header = document.createElement("div");
  header.style.color = "var(--text-3)";
  header.textContent = [ahead, status.isRepo ? "recent commits:" : ""].filter(Boolean).join(" ");
  log.appendChild(header);
  for (const c of commits ?? []) {
    const div = document.createElement("div");
    div.innerHTML = `<b>${esc(c.hash)}</b> ${esc(c.date)} ${esc(c.subject)}`;
    log.appendChild(div);
  }
}

async function showDiff(file) {
  try {
    const res = await api(`/api/git/diff?file=${encodeURIComponent(file)}`);
    $("#diffText").textContent = res.text || "(no diff — the file may be untracked)";
    $("#diffBox").hidden = false;
    $("#diffBox").open = true;
  } catch (err) {
    toast(err.message, "err");
  }
}

$("#refreshGit").addEventListener("click", async () => {
  try {
    const status = await api("/api/git/status");
    renderGit(status, status.recentCommits);
    toast("Git status refreshed");
  } catch (err) {
    toast(err.message, "err");
  }
});

$("#commitBtn").addEventListener("click", async () => {
  const message = $("#commitMsg").value.trim();
  if (!message) {
    toast("Write a commit message first.", "warn");
    $("#commitMsg").focus();
    return;
  }
  try {
    const res = await api("/api/git/commit", { method: "POST", body: { message } });
    if (!res.ok) {
      toast(res.message || "Commit failed.", "err", 6000);
      return;
    }
    $("#commitMsg").value = "";
    toast(`Committed ${res.hash ?? ""}`.trim());
    await refreshLists();
  } catch (err) {
    toast(err.message, "err", 6000);
  }
});

$("#pushBtn").addEventListener("click", async () => {
  try {
    const res = await api("/api/git/push", { method: "POST" });
    toast(res.message || (res.ok ? "Pushed." : "Push failed."), res.ok ? "ok" : "err", res.ok ? 3200 : 9000);
    await refreshLists();
  } catch (err) {
    toast(err.message, "err", 9000);
  }
});

/* ----------------------------------------------------------------- modals -- */

function askConfirm(title, text, confirmLabel = "Confirm") {
  return new Promise((resolve) => {
    const dlg = $("#confirmDialog");
    $("#confirmTitle").textContent = title;
    $("#confirmText").textContent = text;
    $("#confirmYes").textContent = confirmLabel;

    const cleanup = (value) => {
      $("#confirmYes").removeEventListener("click", onYes);
      $("#confirmNo").removeEventListener("click", onNo);
      dlg.removeEventListener("close", onNo);
      if (dlg.open) dlg.close();
      resolve(value);
    };
    const onYes = () => cleanup(true);
    const onNo = () => cleanup(false);

    $("#confirmYes").addEventListener("click", onYes);
    $("#confirmNo").addEventListener("click", onNo);
    dlg.addEventListener("close", onNo);
    dlg.showModal();
  });
}

/* -------------------------------------------------------------- shortcuts -- */

document.addEventListener("keydown", (event) => {
  const mod = event.metaKey || event.ctrlKey;
  if (mod && event.key === "s") {
    event.preventDefault();
    if (state.current) saveAndMaybeRefresh();
  }
  if (mod && event.key === "Enter") {
    event.preventDefault();
    $("#commitBtn").click();
  }
  if (mod && event.key === "k") {
    event.preventDefault();
    $("#newBtn").click();
  }
});

window.addEventListener("beforeunload", (event) => {
  if (state.dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});

/* ------------------------------------------------------------------- boot -- */

(async () => {
  try {
    const auth = await api("/api/auth");
    if (auth.authenticated) await start();
    else showLogin();
  } catch {
    showLogin();
  }
})();
