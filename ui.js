(() => {
  const storageKeys = {
    theme: "axiom-ui-theme",
    zoom: "axiom-ui-zoom",
    editorFont: "axiom-ui-editor-font",
    terminalFont: "axiom-ui-terminal-font",
    code: "axiom-workbench-code",
    filename: "axiom-workbench-filename",
    tabs: "axiom-workbench-tabs",
    signalsCollapsed: "axiom-ui-signals-collapsed"
  };

  const readSetting = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const writeSetting = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage may be disabled for local files or private browsing.
    }
  };

  const editor = document.getElementById("editor");
  const lineNumbers = document.getElementById("line-numbers");
  const consoleOutput = document.getElementById("console");
  const menu = document.getElementById("settings-menu");
  const settingsToggle = document.getElementById("settings-toggle");
  const themeSelect = document.getElementById("theme-setting");
  const zoomSelect = document.getElementById("zoom-setting");
  const signalsDock = document.getElementById("signals-dock");
  const signalsToggle = document.getElementById("signals-toggle");
  const filenameLabel = document.getElementById("active-filename");
  const tabsElement = document.getElementById("editor-tabs");
  const filePicker = document.getElementById("file-picker");
  const findPanel = document.getElementById("editor-find");
  const findInput = document.getElementById("find-input");
  const findCount = document.getElementById("find-count");
  const reservedModal = document.getElementById("reserved-modal");
  const reservedSearch = document.getElementById("reserved-search");
  const reservedList = document.getElementById("reserved-list");
  const reservedPreviewLabel = document.getElementById("reserved-preview-label");
  const reservedPreviewValue = document.getElementById("reserved-preview-value");
  let savedCodeSnapshot = "";
  let findMatches = [];
  let activeFindMatch = -1;
  let openTabs = [];
  let activeTabId = null;
  let tabSequence = 0;

  const activeTab = () => openTabs.find((tab) => tab.id === activeTabId) || null;

  const syncActiveBuffer = () => {
    const tab = activeTab();
    if (tab) tab.content = editor.value;
  };

  const persistTabs = () => {
    syncActiveBuffer();
    writeSetting(storageKeys.tabs, JSON.stringify({ tabs: openTabs, activeTabId }));
  };

  const renderTabs = () => {
    tabsElement.replaceChildren();
    openTabs.forEach((tab) => {
      const item = document.createElement("div");
      item.className = `file-tab${tab.content !== tab.savedContent ? " is-dirty" : ""}`;
      item.setAttribute("role", "presentation");

      const select = document.createElement("button");
      select.type = "button";
      select.className = "file-tab-select";
      select.setAttribute("role", "tab");
      select.setAttribute("aria-selected", String(tab.id === activeTabId));
      select.title = tab.name;
      select.textContent = tab.name;
      select.addEventListener("click", () => activateTab(tab.id));

      const close = document.createElement("button");
      close.type = "button";
      close.className = "file-tab-close";
      close.setAttribute("aria-label", `Close ${tab.name}`);
      close.title = `Close ${tab.name}`;
      close.textContent = "×";
      close.addEventListener("click", () => closeTab(tab.id));

      item.append(select, close);
      tabsElement.append(item);
    });
  };

  const activateTab = (tabId) => {
    if (tabId === activeTabId) return;
    syncActiveBuffer();
    const tab = openTabs.find((item) => item.id === tabId);
    if (!tab) return;
    activeTabId = tabId;
    editor.value = tab.content;
    filenameLabel.textContent = tab.name;
    savedCodeSnapshot = tab.savedContent;
    renderTabs();
    persistTabs();
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.focus({ preventScroll: true });
  };

  const createTab = (name, content = "", savedContent = content) => {
    syncActiveBuffer();
    const tab = {
      id: `tab-${Date.now()}-${tabSequence++}`,
      name: name.trim() || "untitled.axiom",
      content,
      savedContent
    };
    openTabs.push(tab);
    activeTabId = tab.id;
    editor.value = content;
    filenameLabel.textContent = tab.name;
    savedCodeSnapshot = savedContent;
    renderTabs();
    persistTabs();
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.focus({ preventScroll: true });
  };

  const closeTab = (tabId) => {
    syncActiveBuffer();
    const index = openTabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) return;
    const tab = openTabs[index];
    if (tab.content !== tab.savedContent && !window.confirm(`Close ${tab.name} with unsaved changes?`)) return;
    openTabs.splice(index, 1);
    if (tabId === activeTabId) {
      const nextTab = openTabs[Math.min(index, openTabs.length - 1)];
      if (nextTab) {
        activeTabId = null;
        activateTab(nextTab.id);
      } else {
        activeTabId = null;
        createTab("untitled.axiom");
      }
    } else {
      renderTabs();
      persistTabs();
    }
  };

  const nextUntitledName = () => {
    let number = 1;
    let name = "untitled.axiom";
    while (openTabs.some((tab) => tab.name === name)) {
      number += 1;
      name = `untitled-${number}.axiom`;
    }
    return name;
  };

  const setFilename = (name) => {
    const safeName = name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") || "untitled.axiom";
    filenameLabel.textContent = safeName;
    writeSetting(storageKeys.filename, safeName);
    const tab = activeTab();
    if (tab) tab.name = safeName;
    renderTabs();
    persistTabs();
  };

  const updateFindMatches = () => {
    const query = findInput.value;
    const needle = query.toLocaleLowerCase();
    const source = editor.value.toLocaleLowerCase();
    findMatches = [];
    activeFindMatch = -1;
    if (needle) {
      let position = 0;
      while ((position = source.indexOf(needle, position)) !== -1) {
        findMatches.push(position);
        position += needle.length;
      }
    }
    findCount.textContent = !needle ? "" : findMatches.length ? `${findMatches.length} match${findMatches.length === 1 ? "" : "es"}` : "No results";
    if (findMatches.length) moveFind(1, false);
  };

  const moveFind = (direction, advance = true, focusEditor = false) => {
    if (!findMatches.length) return;
    if (advance || activeFindMatch < 0) {
      const cursor = direction > 0 ? editor.selectionEnd : editor.selectionStart;
      const next = findMatches.findIndex((position) => direction > 0 ? position >= cursor : position < cursor);
      activeFindMatch = next < 0 ? (direction > 0 ? 0 : findMatches.length - 1) : next;
    }
    const position = findMatches[activeFindMatch];
    if (focusEditor) editor.focus();
    editor.setSelectionRange(position, position + findInput.value.length);
    findCount.textContent = `${activeFindMatch + 1} of ${findMatches.length}`;
  };

  const openFind = () => {
    findPanel.hidden = false;
    if (editor.selectionStart !== editor.selectionEnd) findInput.value = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    findInput.focus();
    findInput.select();
    updateFindMatches();
  };

  const reservedAliases = {
    "π": { name: "pi", constant: true },
    "τ": { name: "tau", constant: true },
    "φ": { name: "phi", constant: true },
    "ℯ": { name: "e", constant: true }
  };

  const showReservedHint = (groupTitle, displayName) => {
    const token = displayName.includes(" (") ? displayName.slice(0, displayName.indexOf(" (")) : displayName;
    const lowerName = token.toLocaleLowerCase();
    const alias = reservedAliases[token];
    const canonicalName = alias?.name || lowerName;
    const isConstant = groupTitle === "Immutable constants" || alias?.constant === true;
    if (isConstant) {
      const value = new Interpreter().env[canonicalName];
      reservedPreviewLabel.textContent = `${displayName} is an immutable constant`;
      reservedPreviewValue.textContent = value === undefined ? "" : String(value);
      return;
    }

    const docs = DOCS[canonicalName];
    const suggestion = SUGGESTIONS.find((item) => item.name.toLocaleLowerCase() === canonicalName);
    reservedPreviewLabel.textContent = docs?.desc || `${displayName} is a reserved ${groupTitle.toLocaleLowerCase()} name`;
    reservedPreviewValue.textContent = docs?.sig || suggestion?.snippet || token;
  };

  const renderReservedNames = () => {
    const query = reservedSearch.value.trim().toLocaleLowerCase();
    reservedList.replaceChildren();
    let visibleCount = 0;
    RESERVED_NAME_GROUPS.forEach((group) => {
      const names = group.names.filter((name) => name.toLocaleLowerCase().includes(query));
      if (!names.length) return;
      const section = document.createElement("section");
      section.className = "reserved-group";
      const heading = document.createElement("h3");
      heading.textContent = group.title;
      const items = document.createElement("div");
      items.className = "reserved-name-list";
      names.forEach((name) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "reserved-name";
        item.textContent = name;
        item.title = `Click to insert ${name}; hover or long press for details`;
        let longPressTimer = null;
        let didLongPress = false;
        item.addEventListener("pointerenter", () => showReservedHint(group.title, name));
        item.addEventListener("focus", () => showReservedHint(group.title, name));
        item.addEventListener("pointerdown", (event) => {
          if (event.pointerType !== "touch") return;
          didLongPress = false;
          longPressTimer = window.setTimeout(() => {
            didLongPress = true;
            showReservedHint(group.title, name);
          }, 550);
        });
        const cancelLongPress = () => {
          if (longPressTimer !== null) window.clearTimeout(longPressTimer);
          longPressTimer = null;
        };
        item.addEventListener("pointerup", cancelLongPress);
        item.addEventListener("pointercancel", cancelLongPress);
        item.addEventListener("pointerleave", cancelLongPress);
        item.addEventListener("click", () => {
          if (didLongPress) {
            didLongPress = false;
            return;
          }
          insertReservedName(group.title, name);
        });
        items.append(item);
      });
      visibleCount += names.length;
      section.append(heading, items);
      reservedList.append(section);
    });
    if (!visibleCount) reservedList.textContent = "No reserved names match.";
  };

  const insertReservedName = (groupTitle, displayName) => {
    const token = displayName.includes(" (") ? displayName.slice(0, displayName.indexOf(" (")) : displayName;
    const lowerName = token.toLocaleLowerCase();
    const isFunction = groupTitle === "Built-in functions";
    const isOperator = groupTitle === "Language keywords and operators";
    let insertion = token;
    let caretOffset = token.length;

    if (isFunction) {
      const suggestion = SUGGESTIONS.find((item) => item.name.toLocaleLowerCase() === lowerName);
      insertion = suggestion?.snippet || `${token}()`;
      const openParen = insertion.indexOf("(");
      caretOffset = openParen >= 0 ? openParen + 1 : insertion.length;
    } else if (groupTitle === "Language keywords and operators" && ["function", "if", "else", "while", "for", "switch", "case", "default", "return", "break", "continue"].includes(lowerName)) {
      insertion = SUGGESTIONS.find((item) => item.name === lowerName)?.snippet || `${token} `;
      if (lowerName === "function") caretOffset = insertion.indexOf("name");
      else if (["if", "while", "switch", "for"].includes(lowerName)) caretOffset = insertion.indexOf("(") + 1;
      else if (lowerName === "case") caretOffset = insertion.indexOf(":");
      else if (lowerName === "default" || lowerName === "else") caretOffset = insertion.indexOf("{") + 1;
      else caretOffset = insertion.indexOf("\n") < 0 ? insertion.length : insertion.indexOf("\n");
    } else if (isOperator && ["and", "or", "not", "in", "union", "intersect", "mod", "belongsto"].includes(lowerName)) {
      insertion = ` ${token} `;
      caretOffset = insertion.length;
    } else if (isOperator && lowerName === "diff") {
      insertion = " diff ";
      caretOffset = insertion.length;
    } else if (lowerName === "let") {
      insertion = "let ";
      caretOffset = insertion.length;
    } else if (lowerName === "print") {
      insertion = "print()";
      caretOffset = insertion.indexOf("(") + 1;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.slice(0, start) + insertion + editor.value.slice(end);
    const caret = start + caretOffset;
    editor.setSelectionRange(caret, caret);
    editor.dispatchEvent(new Event("input", { bubbles: true }));

    showReservedHint(groupTitle, displayName);
  };

  const closeReservedNames = () => {
    reservedModal.hidden = true;
    document.getElementById("reserved-open").focus({ preventScroll: true });
  };

  const applyTheme = (theme) => {
    document.body.classList.toggle("light-theme", theme === "light");
    themeSelect.value = theme === "light" ? "light" : "dark";
  };

  const applyZoom = (zoom) => {
    const supportedZooms = ["0.8", "0.9", "1", "1.1", "1.25"];
    const normalizedZoom = supportedZooms.includes(zoom) ? zoom : "1";
    document.documentElement.style.setProperty("--view-zoom", normalizedZoom);
    zoomSelect.value = normalizedZoom;
  };

  const applyFontSize = (target, size) => {
    const minimum = 9;
    const maximum = 28;
    const normalizedSize = Math.min(maximum, Math.max(minimum, Number(size)));
    if (!Number.isFinite(normalizedSize)) return;

    if (target === "editor") {
      editor.style.fontSize = `${normalizedSize}px`;
      lineNumbers.style.fontSize = `${normalizedSize}px`;
      document.getElementById("editor-font-value").textContent = `${normalizedSize} px`;
      writeSetting(storageKeys.editorFont, String(normalizedSize));
    } else {
      consoleOutput.style.fontSize = `${normalizedSize}px`;
      document.getElementById("terminal-font-value").textContent = `${normalizedSize} px`;
      writeSetting(storageKeys.terminalFont, String(normalizedSize));
    }
  };

  const resizeCharts = () => {
    if (signalsDock.hidden || getComputedStyle(signalsDock).display === "none") return;
    requestAnimationFrame(() => {
      ["timeChart", "freqChart"].forEach((canvasId) => {
        const canvas = document.getElementById(canvasId);
        const chart = window.Chart?.getChart(canvas);
        chart?.resize();
      });
    });
  };

  applyTheme(readSetting(storageKeys.theme) || (document.body.classList.contains("light-theme") ? "light" : "dark"));
  applyZoom(readSetting(storageKeys.zoom) || "1");
  applyFontSize("editor", readSetting(storageKeys.editorFont) || "13.5");
  applyFontSize("terminal", readSetting(storageKeys.terminalFont) || "12");

  const signalsCollapsed = readSetting(storageKeys.signalsCollapsed) === "true";
  signalsDock.classList.toggle("is-collapsed", signalsCollapsed);
  signalsToggle.setAttribute("aria-pressed", String(signalsCollapsed));
  signalsToggle.setAttribute("aria-label", signalsCollapsed ? "Show signal panel" : "Hide signal panel");
  signalsToggle.title = signalsCollapsed ? "Show signal panel" : "Hide signal panel";

  settingsToggle.addEventListener("click", () => {
    const isOpen = settingsToggle.getAttribute("aria-expanded") === "true";
    settingsToggle.setAttribute("aria-expanded", String(!isOpen));
    menu.hidden = isOpen;
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".settings-wrap")) {
      menu.hidden = true;
      settingsToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      menu.hidden = true;
      settingsToggle.setAttribute("aria-expanded", "false");
      if (!reservedModal.hidden) closeReservedNames();
    }
  });

  themeSelect.addEventListener("change", () => {
    applyTheme(themeSelect.value);
    writeSetting(storageKeys.theme, themeSelect.value);
  });

  zoomSelect.addEventListener("change", () => {
    applyZoom(zoomSelect.value);
    writeSetting(storageKeys.zoom, zoomSelect.value);
    resizeCharts();
  });

  menu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-font-target]");
    if (!button) return;
    const target = button.dataset.fontTarget;
    const current = target === "editor"
      ? Number.parseFloat(editor.style.fontSize)
      : Number.parseFloat(consoleOutput.style.fontSize);
    applyFontSize(target, current + Number(button.dataset.fontStep));
  });

  document.getElementById("new-file").addEventListener("click", () => {
    createTab(nextUntitledName());
  });

  document.getElementById("new-tab").addEventListener("click", () => createTab(nextUntitledName()));
  document.getElementById("open-file").addEventListener("click", () => filePicker.click());
  filePicker.addEventListener("change", async () => {
    const file = filePicker.files?.[0];
    filePicker.value = "";
    if (!file) return;
    try {
      const content = await file.text();
      createTab(file.name, content, content);
    } catch (error) {
      window.alert(`Could not open file: ${error.message}`);
    }
  });

  document.getElementById("rename-file").addEventListener("click", () => {
    const name = window.prompt("Rename file", filenameLabel.textContent);
    if (name !== null && name.trim()) setFilename(name);
  });

  document.getElementById("find-file").addEventListener("click", openFind);
  document.getElementById("reserved-open").addEventListener("click", () => {
    reservedModal.hidden = false;
    renderReservedNames();
    reservedSearch.focus();
  });
  document.getElementById("reserved-close").addEventListener("click", closeReservedNames);
  reservedModal.addEventListener("click", (event) => {
    if (event.target === reservedModal) closeReservedNames();
  });
  reservedSearch.addEventListener("input", renderReservedNames);
  document.getElementById("find-close").addEventListener("click", () => {
    findPanel.hidden = true;
    editor.focus();
  });
  document.getElementById("find-next").addEventListener("click", () => moveFind(1, true, true));
  document.getElementById("find-previous").addEventListener("click", () => moveFind(-1, true, true));
  findInput.addEventListener("input", updateFindMatches);
  findInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      moveFind(event.shiftKey ? -1 : 1, true, true);
    } else if (event.key === "Escape") {
      findPanel.hidden = true;
      editor.focus();
    }
  });
  editor.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      openFind();
    }
  });
  window.axiomMarkSaved = () => {
    syncActiveBuffer();
    const tab = activeTab();
    if (tab) tab.savedContent = tab.content;
    savedCodeSnapshot = editor.value;
    renderTabs();
    persistTabs();
  };

  signalsToggle.addEventListener("click", () => {
    const isCollapsed = signalsDock.classList.toggle("is-collapsed");
    signalsToggle.setAttribute("aria-pressed", String(isCollapsed));
    signalsToggle.setAttribute("aria-label", isCollapsed ? "Show signal panel" : "Hide signal panel");
    signalsToggle.title = isCollapsed ? "Show signal panel" : "Hide signal panel";
    writeSetting(storageKeys.signalsCollapsed, String(isCollapsed));
    resizeCharts();
  });

  document.querySelectorAll("[data-mobile-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.mobileView;
      ["editor", "signals", "terminal", "symbols"].forEach((name) => {
        document.body.classList.toggle(`mobile-view-${name}`, name === view);
      });
      document.querySelectorAll("[data-mobile-view]").forEach((tab) => {
        if (tab === button) tab.setAttribute("aria-current", "page");
        else tab.removeAttribute("aria-current");
      });
      resizeCharts();
      if (view === "editor") editor.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll("[data-chart-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const frequency = button.dataset.chartView === "frequency";
      document.body.classList.toggle("mobile-chart-frequency", frequency);
      document.querySelectorAll("[data-chart-view]").forEach((tab) => {
        tab.setAttribute("aria-pressed", String(tab === button));
      });
      resizeCharts();
    });
  });

  editor.addEventListener("input", () => writeSetting(storageKeys.code, editor.value));
  editor.addEventListener("input", () => {
    syncActiveBuffer();
    persistTabs();
    renderTabs();
  });
  window.addEventListener("resize", resizeCharts);

  window.addEventListener("load", () => {
    const serializedTabs = readSetting(storageKeys.tabs);
    let persistedTabs = null;
    try {
      persistedTabs = serializedTabs ? JSON.parse(serializedTabs) : null;
    } catch {
      persistedTabs = null;
    }
    if (Array.isArray(persistedTabs?.tabs) && persistedTabs.tabs.length) {
      openTabs = persistedTabs.tabs
        .filter((tab) => tab && typeof tab.name === "string" && typeof tab.content === "string")
        .map((tab, index) => ({
          id: typeof tab.id === "string" ? tab.id : `restored-${index}`,
          name: tab.name,
          content: tab.content,
          savedContent: typeof tab.savedContent === "string" ? tab.savedContent : tab.content
        }));
      activeTabId = openTabs.some((tab) => tab.id === persistedTabs.activeTabId)
        ? persistedTabs.activeTabId
        : openTabs[0]?.id;
    }
    if (!openTabs.length) {
      const savedCode = readSetting(storageKeys.code);
      if (savedCode !== null) editor.value = savedCode;
      const initialName = readSetting(storageKeys.filename) || "workbench.axiom";
      openTabs = [{ id: `tab-${Date.now()}-${tabSequence++}`, name: initialName, content: editor.value, savedContent: editor.value }];
      activeTabId = openTabs[0].id;
    }
    const currentTab = activeTab();
    editor.value = currentTab.content;
    filenameLabel.textContent = currentTab.name;
    savedCodeSnapshot = currentTab.savedContent;
    renderTabs();
    persistTabs();
    editor.dispatchEvent(new Event("input", { bubbles: true }));

    if (window.matchMedia("(max-width: 820px)").matches) {
      document.body.classList.add("mobile-view-editor");
    }
    resizeCharts();
  });
})();
