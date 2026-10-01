(() => {
  const storageKeys = {
    theme: "axiom-ui-theme",
    zoom: "axiom-ui-zoom",
    editorFont: "axiom-ui-editor-font",
    terminalFont: "axiom-ui-terminal-font",
    code: "axiom-workbench-code",
    filename: "axiom-workbench-filename",
    tabs: "axiom-workbench-tabs",
    workspace: "axiom-workspace-tree",
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
  const explorerTree = document.getElementById("explorer-tree");
  const explorerPanel = document.getElementById("project-explorer");
  const filePicker = document.getElementById("file-picker");
  const findPanel = document.getElementById("editor-find");
  const findInput = document.getElementById("find-input");
  const findCount = document.getElementById("find-count");
  const reservedModal = document.getElementById("reserved-modal");
  const reservedSearch = document.getElementById("reserved-search");
  const reservedList = document.getElementById("reserved-list");
  const reservedPreviewLabel = document.getElementById("reserved-preview-label");
  const reservedPreviewValue = document.getElementById("reserved-preview-value");
  const mobileSymbolCatalog = document.getElementById("mobile-symbol-catalog");
  const symbolTooltip = document.getElementById("symbol-tooltip");
  let savedCodeSnapshot = "";
  let findMatches = [];
  let activeFindMatch = -1;
  let openTabs = [];
  let activeTabId = null;
  let tabSequence = 0;
  let workspaceFolders = [{ id: "workspace-root", name: "root", parentId: null, expanded: true }];
  let workspaceFiles = [];
  let activeFolderId = "workspace-root";
  let selectedExplorerItem = { kind: "folder", id: "workspace-root" };
  let explorerClipboard = null;
  let draggedExplorerItem = null;

  const activeTab = () => openTabs.find((tab) => tab.id === activeTabId) || null;

  const persistWorkspace = () => writeSetting(storageKeys.workspace, JSON.stringify({ folders: workspaceFolders, files: workspaceFiles }));

  const syncWorkspaceFile = (tab) => {
    if (!tab) return;
    let file = workspaceFiles.find((item) => item.id === tab.fileId);
    if (!file) {
      tab.fileId = tab.fileId || `file-${Date.now()}-${tabSequence++}`;
      file = { id: tab.fileId, name: tab.name, folderId: tab.folderId || "workspace-root", content: tab.content, savedContent: tab.savedContent };
      workspaceFiles.push(file);
    }
    file.name = tab.name;
    file.folderId = tab.folderId || file.folderId || "workspace-root";
    file.content = tab.content;
    file.savedContent = tab.savedContent;
  };

  const syncActiveBuffer = () => {
    const tab = activeTab();
    if (tab) {
      tab.content = editor.value;
      syncWorkspaceFile(tab);
    }
  };

  const persistTabs = () => {
    syncActiveBuffer();
    writeSetting(storageKeys.tabs, JSON.stringify({ tabs: openTabs, activeTabId }));
    persistWorkspace();
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
    renderExplorer();
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
    activeFolderId = tab.folderId || "workspace-root";
    selectExplorerItem("file", tab.fileId);
    renderTabs();
    persistTabs();
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.focus({ preventScroll: true });
  };

  const createTab = (name, content = "", savedContent = content, folderId = "workspace-root", fileId = null) => {
    syncActiveBuffer();
    if (fileId) {
      const existingTab = openTabs.find((item) => item.fileId === fileId);
      if (existingTab) {
        activateTab(existingTab.id);
        return existingTab;
      }
    }
    const tab = {
      id: `tab-${Date.now()}-${tabSequence++}`,
      name: name.trim() || "untitled.axiom",
      content,
      savedContent,
      fileId: fileId || `file-${Date.now()}-${tabSequence++}`,
      folderId
    };
    openTabs.push(tab);
    syncWorkspaceFile(tab);
    selectExplorerItem("file", tab.fileId);
    activeTabId = tab.id;
    activeFolderId = folderId;
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

  const createExplorerRow = (label, kind, depth, expanded = false) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `explorer-row explorer-${kind}`;
    row.setAttribute("role", "treeitem");
    row.style.paddingLeft = `${8 + depth * 14}px`;
    row.setAttribute("aria-expanded", String(expanded));
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if (kind === "folder") {
      path.setAttribute("d", expanded ? "m5 8 3 3 3-3M3 6h18v13H3zM3 9h18" : "m8 5 3 3-3 3M13 6h8v13H5V5h5z");
    } else {
      path.setAttribute("d", "M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v6h5");
    }
    icon.append(path);
    const name = document.createElement("span");
    name.className = "explorer-row-name";
    name.textContent = label;
    row.append(icon, name);
    return row;
  };

  const getExplorerItem = (kind, id) => kind === "folder"
    ? workspaceFolders.find((folder) => folder.id === id)
    : workspaceFiles.find((file) => file.id === id);

  const selectExplorerItem = (kind, id) => {
    selectedExplorerItem = { kind, id };
    activeFolderId = kind === "folder" ? id : getExplorerItem("file", id)?.folderId || activeFolderId;
  };

  const explorerParentForPaste = () => {
    if (selectedExplorerItem.kind === "folder") return selectedExplorerItem.id;
    return getExplorerItem("file", selectedExplorerItem.id)?.folderId || activeFolderId;
  };
  
  const isFolderWithin = (folderId, ancestorId) => {
    let folder = workspaceFolders.find((item) => item.id === folderId);
    while (folder) {
      if (folder.id === ancestorId) return true;
      folder = workspaceFolders.find((item) => item.id === folder.parentId);
    }
    return false;
  };

  const explorerNameExists = (kind, name, parentId, exceptId = null) => {
    const siblings = kind === "folder" ? workspaceFolders : workspaceFiles;
    return siblings.some((item) => item.id !== exceptId &&
      (kind === "folder" ? item.parentId : item.folderId) === parentId &&
      item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  };

  const uniqueCopiedName = (kind, originalName, parentId) => {
    const dot = kind === "file" ? originalName.lastIndexOf(".") : -1;
    const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
    const extension = dot > 0 ? originalName.slice(dot) : "";
    let candidate = `${stem} (copy)${extension}`;
    let suffix = 2;
    while (explorerNameExists(kind, candidate, parentId)) candidate = `${stem} (copy ${suffix++})${extension}`;
    return candidate;
  };

  const renameExplorerItem = (kind, id) => {
    const item = getExplorerItem(kind, id);
    if (!item || id === "workspace-root") return;
    const rawName = window.prompt(`Rename ${kind}`, item.name);
    if (rawName === null || !rawName.trim()) return;
    const name = sanitizeWorkspaceName(rawName, item.name);
    const parentId = kind === "folder" ? item.parentId : item.folderId;
    if (explorerNameExists(kind, name, parentId, id)) {
      window.alert(`An item named ${name} already exists in this folder.`);
      return;
    }
    item.name = name;
    if (kind === "file") openTabs.filter((tab) => tab.fileId === id).forEach((tab) => { tab.name = name; });
    if (activeTab()?.fileId === id) filenameLabel.textContent = name;
    renderTabs();
    persistTabs();
  };

  const copyExplorerItem = (kind, id) => {
    const item = getExplorerItem(kind, id);
    if (!item || id === "workspace-root") return;
    explorerClipboard = { kind, id };
  };

  const pasteExplorerItem = (targetFolderId = explorerParentForPaste()) => {
    const source = explorerClipboard && getExplorerItem(explorerClipboard.kind, explorerClipboard.id);
    const target = workspaceFolders.find((folder) => folder.id === targetFolderId);
    if (!source || !target) return;
    if (explorerClipboard.kind === "folder" && isFolderWithin(targetFolderId, source.id)) return;
    target.expanded = true;

    if (explorerClipboard.kind === "file") {
      workspaceFiles.push({
        ...source,
        id: `file-${Date.now()}-${tabSequence++}`,
        name: uniqueCopiedName("file", source.name, targetFolderId),
        folderId: targetFolderId
      });
    } else {
      const cloneFolder = (sourceFolder, parentId) => {
        const copy = {
          id: `folder-${Date.now()}-${tabSequence++}`,
          name: uniqueCopiedName("folder", sourceFolder.name, parentId),
          parentId,
          expanded: true
        };
        workspaceFolders.push(copy);
        workspaceFiles.filter((file) => file.folderId === sourceFolder.id).forEach((file) => {
          workspaceFiles.push({
            ...file,
            id: `file-${Date.now()}-${tabSequence++}`,
            name: uniqueCopiedName("file", file.name, copy.id),
            folderId: copy.id
          });
        });
        workspaceFolders.filter((folder) => folder.parentId === sourceFolder.id).forEach((folder) => cloneFolder(folder, copy.id));
      };
      cloneFolder(source, targetFolderId);
      target.expanded = true;
    }
    selectExplorerItem("folder", targetFolderId);
    persistWorkspace();
    renderExplorer();
  };

  const deleteExplorerItem = (kind, id) => {
    const item = getExplorerItem(kind, id);
    if (!item || id === "workspace-root") return;
    const folderIds = new Set();
    if (kind === "folder") {
      const collect = (folderId) => {
        folderIds.add(folderId);
        workspaceFolders.filter((folder) => folder.parentId === folderId).forEach((folder) => collect(folder.id));
      };
      collect(id);
    }
    const deletedFiles = workspaceFiles.filter((file) => kind === "file" ? file.id === id : folderIds.has(file.folderId));
    const deletedFileIds = new Set(deletedFiles.map((file) => file.id));
    const affectedTabs = openTabs.filter((tab) => deletedFileIds.has(tab.fileId));
    const hasUnsavedTabs = affectedTabs.some((tab) => tab.content !== tab.savedContent);
    const warning = hasUnsavedTabs ? " Some open files have unsaved changes." : "";
    const noun = kind === "folder" ? "folder and all its contents" : "file";
    if (!window.confirm(`Delete ${noun} '${item.name}'?${warning}`)) return;

    const activeWasDeleted = deletedFileIds.has(activeTab()?.fileId);
    const activeIndex = openTabs.findIndex((tab) => tab.id === activeTabId);
    openTabs = openTabs.filter((tab) => !deletedFileIds.has(tab.fileId));
    workspaceFiles = workspaceFiles.filter((file) => !deletedFileIds.has(file.id));
    workspaceFolders = workspaceFolders.filter((folder) => !folderIds.has(folder.id));
    if (activeWasDeleted) {
      activeTabId = null;
      const nextTab = openTabs[Math.min(activeIndex, openTabs.length - 1)];
      if (nextTab) activateTab(nextTab.id);
      else createTab(nextUntitledName());
    } else {
      selectExplorerItem("folder", kind === "folder" ? item.parentId : item.folderId);
    }
    persistTabs();
    renderTabs();
  };

  const moveExplorerItem = (kind, id, targetFolderId) => {
    const item = getExplorerItem(kind, id);
    const target = workspaceFolders.find((folder) => folder.id === targetFolderId);
    if (!item || !target || id === "workspace-root") return false;
    if (kind === "folder") {
      let ancestor = target;
      while (ancestor) {
        if (ancestor.id === id) return false;
        ancestor = workspaceFolders.find((folder) => folder.id === ancestor.parentId);
      }
    }
    const currentParent = kind === "folder" ? item.parentId : item.folderId;
    if (currentParent === targetFolderId) return false;
    if (explorerNameExists(kind, item.name, targetFolderId)) {
      window.alert(`An item named ${item.name} already exists in the destination folder.`);
      return false;
    }
    if (kind === "folder") item.parentId = targetFolderId;
    else {
      item.folderId = targetFolderId;
      openTabs.filter((tab) => tab.fileId === id).forEach((tab) => { tab.folderId = targetFolderId; });
    }
    target.expanded = true;
    selectExplorerItem("folder", targetFolderId);
    persistTabs();
    renderExplorer();
    return true;
  };

  const createExplorerContextMenu = () => {
    const contextMenu = document.createElement("div");
    contextMenu.id = "explorer-context-menu";
    contextMenu.setAttribute("role", "menu");
    contextMenu.hidden = true;
    document.body.append(contextMenu);
    return contextMenu;
  };
  const explorerContextMenu = createExplorerContextMenu();

  const showExplorerContextMenu = (event, kind, id) => {
    event.preventDefault();
    selectExplorerItem(kind, id);
    renderExplorer();
    const isRoot = id === "workspace-root";
    const targetFolderId = kind === "folder" ? id : getExplorerItem("file", id)?.folderId;
    const canPaste = !!explorerClipboard && workspaceFolders.some((folder) => folder.id === targetFolderId) &&
      !(explorerClipboard.kind === "folder" && isFolderWithin(targetFolderId, explorerClipboard.id));
    const actions = [
      { label: "Open", run: () => { if (kind === "file") openExplorerFile(getExplorerItem(kind, id)); else { const folder = getExplorerItem(kind, id); folder.expanded = !folder.expanded; persistWorkspace(); renderExplorer(); } }, disabled: kind === "folder" },
      { label: "New File Here", run: () => { activeFolderId = kind === "folder" ? id : getExplorerItem("file", id)?.folderId || activeFolderId; promptForWorkspaceFile(); }, disabled: false },
      { label: "New Folder Here", run: () => { activeFolderId = kind === "folder" ? id : getExplorerItem("file", id)?.folderId || activeFolderId; promptForWorkspaceFolder(); }, disabled: false },
      { label: "Rename", run: () => renameExplorerItem(kind, id), disabled: isRoot },
      { label: "Copy", run: () => copyExplorerItem(kind, id), disabled: isRoot },
      { label: "Paste Into", run: () => pasteExplorerItem(targetFolderId), disabled: !canPaste },
      { label: "Duplicate", run: () => { copyExplorerItem(kind, id); pasteExplorerItem(kind === "folder" ? getExplorerItem("folder", id)?.parentId : targetFolderId); }, disabled: isRoot },
      { label: "Delete", run: () => deleteExplorerItem(kind, id), disabled: isRoot, danger: true }
    ];
    explorerContextMenu.replaceChildren();
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.textContent = action.label;
      button.disabled = action.disabled;
      if (action.danger) button.classList.add("explorer-menu-danger");
      button.addEventListener("click", () => {
        explorerContextMenu.hidden = true;
        action.run();
      });
      explorerContextMenu.append(button);
    });
    explorerContextMenu.hidden = false;
    const left = Math.min(event.clientX, window.innerWidth - explorerContextMenu.offsetWidth - 8);
    const top = Math.min(event.clientY, window.innerHeight - explorerContextMenu.offsetHeight - 8);
    explorerContextMenu.style.left = `${Math.max(8, left)}px`;
    explorerContextMenu.style.top = `${Math.max(8, top)}px`;
    explorerContextMenu.querySelector("button:not(:disabled)")?.focus();
  };

  const bindExplorerRow = (row, kind, id, onClick) => {
    row.dataset.itemId = id;
    row.dataset.kind = kind;
    row.draggable = id !== "workspace-root";
    row.addEventListener("click", onClick);
    row.addEventListener("contextmenu", (event) => showExplorerContextMenu(event, kind, id));
    row.addEventListener("keydown", (event) => {
      if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
      const bounds = row.getBoundingClientRect();
      showExplorerContextMenu({ preventDefault: () => event.preventDefault(), clientX: bounds.left + 12, clientY: bounds.bottom }, kind, id);
    });
    row.addEventListener("dragstart", (event) => {
      draggedExplorerItem = { kind, id };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
      row.classList.add("is-dragging");
    });
    row.addEventListener("dragend", () => {
      draggedExplorerItem = null;
      explorerTree.querySelectorAll(".is-dragging, .is-drop-target").forEach((element) => element.classList.remove("is-dragging", "is-drop-target"));
    });
    return row;
  };

  explorerTree.addEventListener("dragover", (event) => {
    const folderRow = event.target.closest(".explorer-folder");
    if (!folderRow || !draggedExplorerItem || draggedExplorerItem.id === folderRow.dataset.itemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    folderRow.classList.add("is-drop-target");
  });
  explorerTree.addEventListener("dragleave", (event) => {
    const folderRow = event.target.closest(".explorer-folder");
    if (folderRow && !folderRow.contains(event.relatedTarget)) folderRow.classList.remove("is-drop-target");
  });
  explorerTree.addEventListener("drop", (event) => {
    const folderRow = event.target.closest(".explorer-folder");
    if (!folderRow || !draggedExplorerItem) return;
    event.preventDefault();
    folderRow.classList.remove("is-drop-target");
    moveExplorerItem(draggedExplorerItem.kind, draggedExplorerItem.id, folderRow.dataset.itemId);
  });

  const openExplorerFile = (file) => {
    if (!file) return;
    selectExplorerItem("file", file.id);
    const existing = openTabs.find((tab) => tab.fileId === file.id);
    if (existing?.id === activeTabId) renderExplorer();
    else if (existing) activateTab(existing.id);
    else createTab(file.name, file.content, file.savedContent, file.folderId, file.id);
    if (window.matchMedia("(max-width: 820px)").matches) document.body.classList.remove("explorer-open");
  };

  function renderExplorer() {
    if (!explorerTree) return;
    explorerTree.replaceChildren();
    const renderChildren = (parentId, depth) => {
      const folders = workspaceFolders
        .filter((folder) => folder.parentId === parentId)
        .sort((left, right) => left.name.localeCompare(right.name));
      const files = workspaceFiles
        .filter((file) => file.folderId === parentId)
        .sort((left, right) => left.name.localeCompare(right.name));
      folders.forEach((folder) => {
        const row = createExplorerRow(folder.name, "folder", depth, folder.expanded);
        row.setAttribute("aria-selected", String(selectedExplorerItem.kind === "folder" && selectedExplorerItem.id === folder.id));
        bindExplorerRow(row, "folder", folder.id, () => {
          selectExplorerItem("folder", folder.id);
          folder.expanded = !folder.expanded;
          persistWorkspace();
          renderExplorer();
        });
        explorerTree.append(row);
        if (folder.expanded) renderChildren(folder.id, depth + 1);
      });
      files.forEach((file) => {
        const row = createExplorerRow(file.name, "file", depth);
        row.title = file.name;
        row.classList.toggle("is-dirty", file.content !== file.savedContent);
        row.setAttribute("aria-selected", String(selectedExplorerItem.kind === "file" && selectedExplorerItem.id === file.id));
        bindExplorerRow(row, "file", file.id, () => openExplorerFile(file));
        explorerTree.append(row);
      });
    };

    const root = workspaceFolders.find((folder) => folder.id === "workspace-root");
    if (!root) return;
    const rootRow = createExplorerRow(root.name, "folder", 0, root.expanded);
    rootRow.classList.add("explorer-root");
    rootRow.setAttribute("aria-selected", String(selectedExplorerItem.kind === "folder" && selectedExplorerItem.id === root.id));
    bindExplorerRow(rootRow, "folder", root.id, () => {
      selectExplorerItem("folder", root.id);
      root.expanded = !root.expanded;
      persistWorkspace();
      renderExplorer();
    });
    explorerTree.append(rootRow);
    if (root.expanded) renderChildren(root.id, 1);
  }

  const sanitizeWorkspaceName = (name, fallback) =>
    name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") || fallback;

  const createWorkspaceFolder = (rawName, parentId = activeFolderId) => {
    const name = sanitizeWorkspaceName(rawName, "New Folder");
    if (workspaceFolders.some((folder) => folder.parentId === parentId && folder.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      window.alert(`A folder named ${name} already exists here.`);
      return;
    }
    const folder = { id: `folder-${Date.now()}-${tabSequence++}`, name, parentId, expanded: true };
    workspaceFolders.push(folder);
    const parent = workspaceFolders.find((item) => item.id === parentId);
    if (parent) parent.expanded = true;
    activeFolderId = folder.id;
    persistWorkspace();
    renderExplorer();
  };

  const createWorkspaceFile = (rawName, folderId = activeFolderId) => {
    const name = sanitizeWorkspaceName(rawName, "untitled.axiom");
    if (workspaceFiles.some((file) => file.folderId === folderId && file.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      window.alert(`A file named ${name} already exists in this folder.`);
      return;
    }
    const file = { id: `file-${Date.now()}-${tabSequence++}`, name, folderId, content: "", savedContent: "" };
    workspaceFiles.push(file);
    const folder = workspaceFolders.find((item) => item.id === folderId);
    if (folder) folder.expanded = true;
    persistWorkspace();
    createTab(file.name, file.content, file.savedContent, file.folderId, file.id);
  };

  const promptForWorkspaceFile = () => {
    const name = window.prompt("New file name", "untitled.axiom");
    if (name !== null && name.trim()) createWorkspaceFile(name);
  };

  const promptForWorkspaceFolder = () => {
    const name = window.prompt("New folder name", "New Folder");
    if (name !== null && name.trim()) createWorkspaceFolder(name);
  };

  const setFilename = (name) => {
    const safeName = name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") || "untitled.axiom";
    filenameLabel.textContent = safeName;
    writeSetting(storageKeys.filename, safeName);
    const tab = activeTab();
    if (tab) {
      tab.name = safeName;
      syncWorkspaceFile(tab);
    }
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
    } else if (groupTitle === "Language keywords and operators" && lowerName === "constructor") {
      insertion = "function constructor() {\n  \n}";
      caretOffset = insertion.indexOf("\n") + 3;
    } else if (groupTitle === "Language keywords and operators" && ["function", "class", "new", "if", "else", "while", "for", "switch", "case", "default", "return", "break", "continue"].includes(lowerName)) {
      insertion = SUGGESTIONS.find((item) => item.name === lowerName)?.snippet || `${token} `;
      if (lowerName === "function") caretOffset = insertion.indexOf("name");
      else if (lowerName === "class") caretOffset = insertion.indexOf("Name") + "Name".length;
      else if (lowerName === "new") caretOffset = insertion.indexOf("ClassName") + "ClassName".length;
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

  const describeReservedName = (groupTitle, displayName) => {
    const name = displayName.toLocaleLowerCase();
    const symbolDescriptions = {
      colon: "Separates range bounds and named arguments.",
      ternary: "Starts a conditional expression: condition ? value-if-true : value-if-false.",
      "less-than-or-equal": "Comparison operator that is true when the left value is less than or equal to the right value.",
      "greater-than-or-equal": "Comparison operator that is true when the left value is greater than or equal to the right value."
    };
    if (Object.prototype.hasOwnProperty.call(symbolDescriptions, name)) return symbolDescriptions[name];
    const docs = DOCS[name];
    const suggestion = SUGGESTIONS.find((item) => item.name.toLocaleLowerCase() === name);
    const description = docs?.desc || `${displayName} is a reserved ${groupTitle.toLocaleLowerCase()} name`;
    const signature = docs?.sig || suggestion?.snippet;
    return [description, signature].filter(Boolean).join("\n");
  };

  const bindSymbolHint = (button, groupTitle, displayName, insertOnClick = false) => {
    let longPressTimer = null;
    let didLongPress = false;
    const show = () => {
      const rect = button.getBoundingClientRect();
      symbolTooltip.textContent = `${displayName}\n${describeReservedName(groupTitle, displayName)}`;
      symbolTooltip.hidden = false;
      const gap = 8;
      const left = Math.min(Math.max(gap, rect.left), window.innerWidth - symbolTooltip.offsetWidth - gap);
      const below = rect.bottom + gap;
      const top = below + symbolTooltip.offsetHeight <= window.innerHeight
        ? below
        : Math.max(gap, rect.top - symbolTooltip.offsetHeight - gap);
      symbolTooltip.style.left = `${left}px`;
      symbolTooltip.style.top = `${top}px`;
    };
    const hide = () => {
      if (longPressTimer !== null) window.clearTimeout(longPressTimer);
      longPressTimer = null;
      if (!didLongPress) symbolTooltip.hidden = true;
    };
    button.title = `${displayName}: ${describeReservedName(groupTitle, displayName).split("\n").join("; ")}`;
    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") show();
    });
    button.addEventListener("pointerleave", hide);
    button.addEventListener("focus", show);
    button.addEventListener("blur", () => { symbolTooltip.hidden = true; });
    button.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch") return;
      didLongPress = false;
      longPressTimer = window.setTimeout(() => {
        didLongPress = true;
        show();
      }, 550);
    });
    button.addEventListener("pointerup", () => {
      if (longPressTimer !== null) window.clearTimeout(longPressTimer);
      longPressTimer = null;
    });
    button.addEventListener("pointercancel", hide);
    button.addEventListener("click", (event) => {
      if (!didLongPress) {
        if (insertOnClick) insertReservedName(groupTitle, displayName);
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      didLongPress = false;
      symbolTooltip.hidden = true;
    }, true);
  };

  const renderMobileSymbolCatalog = () => {
    mobileSymbolCatalog.replaceChildren();
    RESERVED_NAME_GROUPS.forEach((group) => {
      const section = document.createElement("section");
      section.className = "symbol-name-list";
      const heading = document.createElement("strong");
      heading.className = "symbol-group-title";
      heading.textContent = group.title;
      section.append(heading);
      group.names.forEach((name) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "symbol-catalog-button";
        item.textContent = name;
        bindSymbolHint(item, group.title, name, true);
        section.append(item);
      });
      mobileSymbolCatalog.append(section);
    });
  };

  const toolbarSymbolDetails = new Map([
    ["diff()", ["Built-in functions", "diff"]],
    ["integrate()", ["Built-in functions", "integrate"]],
    ["union", ["Built-in functions", "union"]],
    ["intersect", ["Built-in functions", "intersect"]],
    [":", ["Language keywords and operators", "colon"]],
    ["?", ["Language keywords and operators", "ternary"]],
    ["pi", ["Immutable constants", "pi"]],
    ["omega", ["Immutable constants", "omega"]],
    ["tau", ["Immutable constants", "tau"]],
    ["≤", ["Language keywords and operators", "less-than-or-equal"]],
    ["≥", ["Language keywords and operators", "greater-than-or-equal"]],
    ["rect", ["Built-in functions", "rect"]],
    ["sinc", ["Built-in functions", "sinc"]],
    ["u(t)", ["Built-in functions", "u"]],
    ["i", ["Immutable constants", "i"]]
  ]);
  document.querySelectorAll(".symbol-bar .sym-btn:not(#reserved-open)").forEach((button) => {
    const details = toolbarSymbolDetails.get(button.textContent.trim());
    if (details) bindSymbolHint(button, ...details);
  });

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
    if (!event.target.closest("#explorer-context-menu")) explorerContextMenu.hidden = true;
    if (!event.target.closest(".settings-wrap")) {
      menu.hidden = true;
      settingsToggle.setAttribute("aria-expanded", "false");
    }
    if (window.matchMedia("(max-width: 820px)").matches &&
        document.body.classList.contains("explorer-open") &&
        !event.target.closest("#project-explorer") &&
        !event.target.closest("#explorer-toggle")) {
      document.body.classList.remove("explorer-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      explorerContextMenu.hidden = true;
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

  document.getElementById("new-file").addEventListener("click", promptForWorkspaceFile);
  document.getElementById("explorer-new-file").addEventListener("click", promptForWorkspaceFile);
  document.getElementById("explorer-new-folder").addEventListener("click", promptForWorkspaceFolder);
  document.getElementById("explorer-toggle").addEventListener("click", () => {
    document.body.classList.toggle("explorer-open");
  });
  explorerTree.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        copyExplorerItem(selectedExplorerItem.kind, selectedExplorerItem.id);
      } else if (event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteExplorerItem();
      }
    }
    if (event.key === "F2") {
      event.preventDefault();
      renameExplorerItem(selectedExplorerItem.kind, selectedExplorerItem.id);
    } else if (event.key === "Delete") {
      event.preventDefault();
      deleteExplorerItem(selectedExplorerItem.kind, selectedExplorerItem.id);
    }
  });

  document.getElementById("new-tab").addEventListener("click", () => createWorkspaceFile(nextUntitledName(), activeFolderId));
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
  renderMobileSymbolCatalog();
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
    if (tab) {
      tab.savedContent = tab.content;
      syncWorkspaceFile(tab);
    }
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
    const serializedWorkspace = readSetting(storageKeys.workspace);
    let persistedWorkspace = null;
    try {
      persistedWorkspace = serializedWorkspace ? JSON.parse(serializedWorkspace) : null;
    } catch {
      persistedWorkspace = null;
    }
    if (Array.isArray(persistedWorkspace?.folders)) {
      workspaceFolders = persistedWorkspace.folders.filter((folder) => folder && typeof folder.id === "string" && typeof folder.name === "string");
    }
    if (!workspaceFolders.some((folder) => folder.id === "workspace-root")) {
      workspaceFolders.unshift({ id: "workspace-root", name: "SS", parentId: null, expanded: true });
    }
    if (Array.isArray(persistedWorkspace?.files)) {
      workspaceFiles = persistedWorkspace.files.filter((file) => file && typeof file.id === "string" && typeof file.name === "string" && typeof file.content === "string");
    }

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
          savedContent: typeof tab.savedContent === "string" ? tab.savedContent : tab.content,
          fileId: typeof tab.fileId === "string" ? tab.fileId : null,
          folderId: typeof tab.folderId === "string" ? tab.folderId : "workspace-root"
        }));
      activeTabId = openTabs.some((tab) => tab.id === persistedTabs.activeTabId)
        ? persistedTabs.activeTabId
        : openTabs[0]?.id;
      openTabs.forEach(syncWorkspaceFile);
    }
    if (!openTabs.length) {
      const savedCode = readSetting(storageKeys.code);
      if (savedCode !== null) editor.value = savedCode;
      const initialName = readSetting(storageKeys.filename) || "workbench.axiom";
      openTabs = [{ id: `tab-${Date.now()}-${tabSequence++}`, name: initialName, content: editor.value, savedContent: editor.value }];
      activeTabId = openTabs[0].id;
      openTabs.forEach(syncWorkspaceFile);
    }
    const currentTab = activeTab();
    editor.value = currentTab.content;
    filenameLabel.textContent = currentTab.name;
    savedCodeSnapshot = currentTab.savedContent;
    if (currentTab.fileId) selectExplorerItem("file", currentTab.fileId);
    renderTabs();
    persistTabs();
    editor.dispatchEvent(new Event("input", { bubbles: true }));

    if (window.matchMedia("(max-width: 820px)").matches) {
      document.body.classList.add("mobile-view-editor");
    }
    resizeCharts();
  });
})();
