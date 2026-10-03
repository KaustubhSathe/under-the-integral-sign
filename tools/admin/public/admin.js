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

  // Slug gets its own always-visible field at the top: it is the filename.
  const slugWrap = document.createElement("div");
  slugWrap.className = "field";
  slugWrap.innerHTML = '<div class="field__label">Filename slug</div>';
  const slugInput = document.createElement("input");
  slugInput.type = "text";
  slugInput.id = "field-slug";
  slugInput.value =
    cur.frontmatter.slug ??
    (cur.path ? cur.path.slice(cur.path.lastIndexOf("/") + 1).replace(/\.md$/, "") : "");
  slugInput.addEventListener("input", () => markDirty());
  slugWrap.appendChild(slugInput);
  const slugHint = document.createElement("div");
  slugHint.className = "field__hint";
  slugHint.textContent =
    "Lowercase, hyphenated. Changing this renames the file (and its URL) only when you use “Rename file…”.";
  slugWrap.appendChild(slugHint);
  host.appendChild(slugWrap);

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

  const slug = $("#field-slug")?.value.trim();
  if (slug) fm.slug = slug;

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

function setSaveState(kind) {
  const el = $("#saveState");
  el.textContent = kind;
  el.className = `badge ${kind === "saved" ? "badge--ok" : kind === "unsaved" ? "badge--warn" : "badge--err"}`;
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
      toast("Frontmatter is invalid — see the message under the editor.", "err", 6000);
    } else {
      toast(err.message, "err", 6000);
    }
    return false;
  }
}

$("#saveBtn").addEventListener("click", () => save());
$("#body").addEventListener("input", markDirty);

/* ------------------------------------------------------------- new / delete -- */

$("#newBtn").addEventListener("click", () => openNewDialog($("#newKind").value || "problems"));
$$("[data-new-kind]").forEach((btn) =>
  btn.addEventListener("click", () => openNewDialog(btn.dataset.newKind)),
);

function openNewDialog(kind) {
  $("#newKind").value = kind;
  $("#newTitle").value = "";
  $("#newTopic").value = state.boot.schema.topics[0].value;
  $("#newDialog").showModal();
  $("#newTitle").focus();
}

$("#newCancel").addEventListener("click", () => $("#newDialog").close());

$("#newForm").addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();

  const kind = $("#newKind").value;
  const title = $("#newTitle").value.trim() || "Untitled";
  const topic = $("#newTopic").value;

  if (!(await confirmDiscard())) return;
  $("#newDialog").close();

  // Start from an empty frontmatter bag, then let the schema defaults apply.
  state.current = {
    kind,
    path: "",
    isNew: true,
    mtime: null,
    frontmatter: { title, topic, status: "stub" },
    body: defaultBody(kind, title),
  };
  state.dirty = true;
  renderForm();
  setSaveState("unsaved");
  $("#status").textContent = "Not saved yet — press Save to create the file.";
  $("#body").focus();
});

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
