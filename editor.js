/* ==========================================================================
8. INTELLISENSE AUTO-SUGGESTIONS & HOVER TOOLTIPS
       ========================================================================== */
    const ed = document.getElementById('editor');
    const popup = document.getElementById('suggest-popup');
    const hoverDoc = document.getElementById('hover-doc-tooltip');
    const editorHistory = { undo: [], redo: [], current: null, pending: null, lastInputType: '', lastInputAt: 0, applying: false };
    let activeSuggestIdx = 0;
    let currentSuggestions = [];
    let suggestionRange = null;

    function captureEditorState() {
      return {
        value: ed.value,
        selectionStart: ed.selectionStart,
        selectionEnd: ed.selectionEnd,
        fileName: document.getElementById('active-filename').textContent
      };
    }

    function updateEditorHistoryButtons() {
      document.getElementById('undo-button').disabled = editorHistory.undo.length === 0;
      document.getElementById('redo-button').disabled = editorHistory.redo.length === 0;
    }

    function resetEditorHistory() {
      editorHistory.undo.length = 0;
      editorHistory.redo.length = 0;
      editorHistory.current = captureEditorState();
      editorHistory.pending = null;
      editorHistory.lastInputType = '';
      updateEditorHistoryButtons();
    }

    function recordEditorInput(event) {
      const next = captureEditorState();
      if (editorHistory.applying) {
        editorHistory.current = next;
        return;
      }
      if (!editorHistory.current || next.fileName !== editorHistory.current.fileName) {
        resetEditorHistory();
        return;
      }
      const previous = editorHistory.pending || editorHistory.current;
      editorHistory.pending = null;
      if (previous.value === next.value) return;
      const inputType = event.inputType || '';
      const canGroup = ['insertText', 'deleteContentBackward', 'deleteContentForward'].includes(inputType) &&
        inputType === editorHistory.lastInputType && Date.now() - editorHistory.lastInputAt < 900 &&
        previous.selectionStart === previous.selectionEnd && next.selectionStart === next.selectionEnd;
      if (!canGroup) editorHistory.undo.push(previous);
      editorHistory.redo.length = 0;
      editorHistory.current = next;
      editorHistory.lastInputType = ['insertText', 'deleteContentBackward', 'deleteContentForward'].includes(inputType) ? inputType : '';
      editorHistory.lastInputAt = Date.now();
      updateEditorHistoryButtons();
    }

    function applyEditorHistory(fromStack, toStack) {
      const previous = fromStack.pop();
      if (!previous) return;
      toStack.push(captureEditorState());
      editorHistory.applying = true;
      ed.value = previous.value;
      ed.setSelectionRange(previous.selectionStart, previous.selectionEnd);
      editorHistory.current = previous;
      editorHistory.pending = null;
      editorHistory.lastInputType = '';
      ed.dispatchEvent(new Event('input', { bubbles: true }));
      editorHistory.applying = false;
      updateEditorHistoryButtons();
    }

    function undoEditor() { applyEditorHistory(editorHistory.undo, editorHistory.redo); }
    function redoEditor() { applyEditorHistory(editorHistory.redo, editorHistory.undo); }

    ed.addEventListener('beforeinput', () => { editorHistory.pending = captureEditorState(); });
    ed.addEventListener('input', recordEditorInput);
    ed.addEventListener('scroll', () => {
      document.getElementById('line-numbers').scrollTop = ed.scrollTop;
    });
    ed.addEventListener('wheel', (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      adjustFontSize(event.deltaY < 0 ? 1 : -1);
    }, { passive: false });
    document.getElementById('undo-button').addEventListener('click', undoEditor);
    document.getElementById('redo-button').addEventListener('click', redoEditor);

    ed.addEventListener('mousemove', (e) => {
      const text = ed.value;
      const offset = getCaretCharacterOffsetWithin(ed, e.clientX, e.clientY);
      if (offset === -1) return hideHoverDoc();

      let left = offset, right = offset;
      while (left > 0 && /[a-zA-Z_]/.test(text[left - 1])) left--;
      while (right < text.length && /[a-zA-Z_]/.test(text[right])) right++;
      const word = text.slice(left, right);

      const doc = DOCS[word] || DOCS[word.toLowerCase()];
      if (doc) {
        const d = doc;
        hoverDoc.innerHTML = `
          <div class="doc-sig">${d.sig}</div>
          <div class="doc-param">${d.param}</div>
          <div>${d.desc}</div>
          <div class="doc-example">Ex: ${d.example}</div>
        `;
        hoverDoc.style.display = 'block';
        const wrapper = ed.parentElement;
        const wrapperRect = wrapper.getBoundingClientRect();
        const pointerX = e.clientX - wrapperRect.left;
        const pointerY = e.clientY - wrapperRect.top;
        const gap = 10;
        let left = pointerX + gap;
        let top = pointerY + gap;
        if (left + hoverDoc.offsetWidth > wrapper.clientWidth - gap) left = pointerX - hoverDoc.offsetWidth - gap;
        if (top + hoverDoc.offsetHeight > wrapper.clientHeight - gap) top = pointerY - hoverDoc.offsetHeight - gap;
        hoverDoc.style.left = `${Math.max(gap, Math.min(left, wrapper.clientWidth - hoverDoc.offsetWidth - gap))}px`;
        hoverDoc.style.top = `${Math.max(gap, Math.min(top, wrapper.clientHeight - hoverDoc.offsetHeight - gap))}px`;
      } else {
        hideHoverDoc();
      }
    });

    ed.addEventListener('mouseleave', hideHoverDoc);
    function hideHoverDoc() { hoverDoc.style.display = 'none'; }

    function getCaretCharacterOffsetWithin(textarea, x, y) {
      const rect = textarea.getBoundingClientRect();
      const styles = getComputedStyle(textarea);
      const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
      const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
      const contentX = x - rect.left - paddingLeft + textarea.scrollLeft;
      const contentY = y - rect.top - paddingTop + textarea.scrollTop;
      if (contentX < 0 || contentY < 0 || x > rect.right || y > rect.bottom) return -1;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const fontSize = Number.parseFloat(styles.fontSize) || 13;
      if (context) context.font = `${fontSize}px ${styles.fontFamily}`;
      const charWidth = context?.measureText('M').width || fontSize * 0.6;
      const lineHeight = Number.parseFloat(styles.lineHeight) || fontSize * 1.5;
      const row = Math.floor(contentY / lineHeight);
      const col = Math.floor(contentX / charWidth);
      const lines = textarea.value.split('\n');
      if (row < 0 || row >= lines.length) return -1;
      let pos = 0;
      for (let i = 0; i < row; i++) pos += lines[i].length + 1;
      return pos + Math.min(col, lines[row].length);
    }

    function collectUserSuggestions(source) {
      const suggestions = new Map();
      const add = (name, type = 'variable') => {
        if (typeof name !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) || isReservedName(name)) return;
        const key = name.toLowerCase();
        if (suggestions.has(key)) return;
        suggestions.set(key, {
          name,
          type,
          snippet: type === 'function' || type === 'method' ? `${name}()` : name
        });
      };
      const visit = node => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          node.forEach(visit);
          return;
        }
        if (node.type === 'AssignStatement') add(node.name);
        if (node.type === 'SequenceExpression') node.assignments?.forEach(assignment => add(assignment.name));
        if (node.type === 'FunctionDeclaration') {
          add(node.name, 'function');
          node.parameters.forEach(parameter => add(parameter));
        }
        if (node.type === 'ClassDeclaration') {
          add(node.name, 'class');
          node.fields.forEach(field => add(field.name, 'field'));
        }
        if (node.type === 'MemberAssignStatement') add(node.name, 'field');
        if (node.type === 'ForInStatement') add(node.variable);
        if (node.type === 'RangeExpression') add(node.variable);
        Object.values(node).forEach(visit);
      };

      try {
        parseSource(source).forEach(visit);
      } catch {
        try {
          const tokens = new Lexer(source).tokenize();
          tokens.forEach((token, index) => {
            const next = tokens[index + 1];
            if (token.type === TT.CLASS && next?.type === TT.IDENTIFIER) add(next.value, 'class');
            if (token.type === TT.FUNCTION && next?.type === TT.IDENTIFIER) add(next.value, 'function');
            if (token.type === TT.LET && next?.type === TT.IDENTIFIER) add(next.value);
            const previous = tokens[index - 1];
            const startsStatement = !previous || previous.type === TT.SEMICOLON || previous.type === TT.LBRACE ||
              previous.type === TT.RBRACE || previous.line < token.line;
            if (startsStatement && token.type === TT.IDENTIFIER && next?.type === TT.ASSIGN) add(token.value);
          });
        } catch {}
      }

      terminalInterpreter.env && Object.keys(terminalInterpreter.env).forEach(name => {
        if (!name.endsWith('_ast')) add(name);
      });
      terminalInterpreter.functions.forEach(definition => add(definition.name, 'function'));
      terminalInterpreter.classes.forEach(definition => add(definition.name, 'class'));
      return Array.from(suggestions.values());
    }

    function updateSuggestPopup(force = false) {
      const isForced = force === true;
      const pos = ed.selectionStart;
      const val = ed.value;
      const textBefore = val.slice(0, pos);
      let match = textBefore.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
      let suggestionStart = match ? match.index : -1;

      if (!match && isForced) {
        const lineStart = textBefore.lastIndexOf('\n') + 1;
        const partial = textBefore.slice(lineStart).match(/([a-zA-Z_][a-zA-Z0-9_]*)[^a-zA-Z0-9_]*$/);
        if (partial) {
          match = partial;
          suggestionStart = lineStart + partial.index;
        }
      }

      if (!match || match[1].length < 1) {
        hideSuggestions();
        return;
      }

      const currentLine = textBefore.slice(textBefore.lastIndexOf('\n') + 1);
      if (currentLine.trimStart().startsWith('#') || ((currentLine.match(/"/g) || []).length % 2 === 1)) {
        hideSuggestions();
        return;
      }

      const prefix = match[1].toLowerCase();
      const matchesPrefix = suggestion =>
        suggestion.name.toLowerCase().startsWith(prefix) && suggestion.name.toLowerCase() !== prefix;
      const customSuggestions = collectUserSuggestions(val).filter(matchesPrefix);
      const customNames = new Set(customSuggestions.map(suggestion => suggestion.name.toLowerCase()));
      const builtInSuggestions = Array.from(suggestionCatalog.values())
        .filter(matchesPrefix)
        .filter(suggestion => !customNames.has(suggestion.name.toLowerCase()));
      currentSuggestions = [...customSuggestions, ...builtInSuggestions];
      suggestionRange = { start: suggestionStart, end: suggestionStart + match[1].length };

      if (currentSuggestions.length === 0) {
        hideSuggestions();
        return;
      }

      const wrapper = ed.parentElement;
      const lines = textBefore.split('\n');
      const row = lines.length - 1;
      const col = lines[lines.length - 1].length;
      const styles = getComputedStyle(ed);
      const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
      const fontSize = Number.parseFloat(styles.fontSize) || 13;
      const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
      const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
      popup.style.width = `${Math.min(280, wrapper.clientWidth - 12)}px`;
      activeSuggestIdx = 0;
      renderSuggestions();
      popup.style.display = 'block';
      const left = ed.offsetLeft + paddingLeft + col * fontSize * 0.6;
      const top = ed.offsetTop + paddingTop + (row + 1) * lineHeight;
      popup.style.left = `${Math.max(6, Math.min(left, wrapper.clientWidth - popup.offsetWidth - 6))}px`;
      popup.style.top = `${Math.max(6, Math.min(top, wrapper.clientHeight - popup.offsetHeight - 6))}px`;
    }

    function renderSuggestions() {
      popup.innerHTML = '';
      currentSuggestions.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = `suggest-item ${idx === activeSuggestIdx ? 'active' : ''}`;
        div.innerHTML = `<span><strong>${item.name}</strong></span><span class="suggest-type">${item.type}</span>`;
        div.onmousedown = (e) => {
          e.preventDefault();
          applySuggestion(item);
        };
        popup.appendChild(div);
      });
    }

    function hideSuggestions() {
      popup.style.display = 'none';
      currentSuggestions = [];
      suggestionRange = null;
    }

    function applySuggestion(item) {
      const val = ed.value;
      if (!suggestionRange || suggestionRange.end > val.length) return;
      const { start, end } = suggestionRange;
      const insertText = item.snippet;

      ed.value = val.slice(0, start) + insertText + val.slice(end);

      if (insertText.endsWith('()')) {
        ed.selectionStart = ed.selectionEnd = start + insertText.length - 1;
      } else {
        ed.selectionStart = ed.selectionEnd = start + insertText.length;
      }

      hideSuggestions();
      ed.focus();
      ed.dispatchEvent(new Event('input', { bubbles: true }));
      recompute();
    }

    ed.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveFile();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        updateSuggestPopup(true);
        recompute({ reportErrors: true });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey && ['z', 'y'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        if (e.key.toLowerCase() === 'y' || e.shiftKey) redoEditor();
        else undoEditor();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        toggleComment();
        return;
      }

      if (popup.style.display === 'block') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          activeSuggestIdx = (activeSuggestIdx + 1) % currentSuggestions.length;
          renderSuggestions();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          activeSuggestIdx = (activeSuggestIdx - 1 + currentSuggestions.length) % currentSuggestions.length;
          renderSuggestions();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          applySuggestion(currentSuggestions[activeSuggestIdx]);
          return;
        }
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          applySuggestion(currentSuggestions[activeSuggestIdx]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          hideSuggestions();
          return;
        }
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const start = ed.selectionStart;
        const end = ed.selectionEnd;
        const value = ed.value;
        const INDENT = '\t';

        if (start === end) {
          ed.value = value.slice(0, start) + INDENT + value.slice(end);
          const caret = start + INDENT.length;
          ed.setSelectionRange(caret, caret);
        } else {
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = value.indexOf('\n', end);
          const sliceEnd = lineEnd < 0 ? value.length : lineEnd;
          const block = value.slice(lineStart, sliceEnd);
          const lines = block.split('\n');

          let modified;
          if (e.shiftKey) {
            modified = lines.map(l => {
              if (l.startsWith(INDENT)) return l.slice(INDENT.length);
              if (l.startsWith('    ')) return l.slice(4);
              return l;
            });
          } else {
            modified = lines.map(l => INDENT + l);
          }

          const res = modified.join('\n');
          ed.value = value.slice(0, lineStart) + res + value.slice(sliceEnd);
          ed.selectionStart = lineStart;
          ed.selectionEnd = lineStart + res.length;
        }
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        recompute();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const start = ed.selectionStart;
      const end = ed.selectionEnd;
      const value = ed.value;

      if (e.key === 'Enter') {
        e.preventDefault();
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineBefore = value.slice(lineStart, start);
        const lineEnd = value.indexOf('\n', end);
        const lineAfter = value.slice(end, lineEnd < 0 ? value.length : lineEnd);
        const indent = (lineBefore.match(/^[\t ]*/) || [''])[0];
        const indentUnit = indent.includes('\t') ? '\t' : '    ';
        const trimmedBefore = lineBefore.trimEnd();
        const trimmedAfter = lineAfter.trimStart();
        let insertion;
        let caretOffset;

        if (trimmedBefore.endsWith('{') && trimmedAfter.startsWith('}')) {
          const innerIndent = indent + indentUnit;
          insertion = `\n${innerIndent}\n${indent}`;
          caretOffset = 1 + innerIndent.length;
        } else {
          let nextIndent = /^\}/.test(lineBefore.trimStart())
            ? (indent.includes('\t') ? indent.slice(0, -1) : indent.slice(0, Math.max(0, indent.length - indentUnit.length)))
            : indent;
          if (trimmedBefore.endsWith('{')) nextIndent += indentUnit;
          insertion = `\n${nextIndent}`;
          caretOffset = insertion.length;
        }

        ed.value = value.slice(0, start) + insertion + value.slice(end);
        const caret = start + caretOffset;
        ed.setSelectionRange(caret, caret);
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        updateLineNumbers();
        requestAnimationFrame(scrollEditorCaretIntoView);
        return;
      }

      const pairs = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };
      const closingToOpening = { ')': '(', '}': '{', ']': '[', '"': '"', "'": "'" };

      if (e.key === 'Backspace' && start === end && start > 0 && pairs[value[start - 1]] === value[start]) {
        e.preventDefault();
        ed.value = value.slice(0, start - 1) + value.slice(start + 1);
        ed.setSelectionRange(start - 1, start - 1);
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }

      if (closingToOpening[e.key] && start === end && value[start] === e.key) {
        e.preventDefault();
        ed.setSelectionRange(start + 1, start + 1);
        return;
      }

      const closing = pairs[e.key];
      if (closing) {
        e.preventDefault();
        const selectedText = value.slice(start, end);
        ed.value = value.slice(0, start) + e.key + selectedText + closing + value.slice(end);
        if (selectedText.length) ed.setSelectionRange(start + 1, start + 1 + selectedText.length);
        else ed.setSelectionRange(start + 1, start + 1);
        ed.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    ed.addEventListener('input', updateSuggestPopup);
    ed.addEventListener('click', hideSuggestions);

    function toggleComment() {
      const start = ed.selectionStart, end = ed.selectionEnd, val = ed.value;
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      let lineEnd = val.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = val.length;

      const lines = val.substring(lineStart, lineEnd).split('\n');
      const allCommented = lines.every(l => l.trim().startsWith('#'));
      const modified = allCommented 
        ? lines.map(l => l.replace(/^(\s*)#\s?/, '$1')) 
        : lines.map(l => l.replace(/^(\s*)/, '$1# '));

      const res = modified.join('\n');
      ed.value = val.substring(0, lineStart) + res + val.substring(lineEnd);
      ed.selectionStart = lineStart;
      ed.selectionEnd = lineStart + res.length;
      recompute();
    }
