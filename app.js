/* ==========================================================================
9. UI CONTROLS & INITIAL SETUP
       ========================================================================== */
    function insertText(text) {
      const s = ed.selectionStart, e = ed.selectionEnd;
      ed.value = ed.value.substring(0, s) + text + ed.value.substring(e);
      ed.selectionStart = ed.selectionEnd = s + text.length;
      ed.focus();
      ed.dispatchEvent(new Event('input', { bubbles: true }));
      recompute();
    }

    function toggleTheme() { document.body.classList.toggle('light-theme'); }
    function adjustFontSize(delta) {
      const cur = parseFloat(getComputedStyle(ed).fontSize);
      const size = Math.max(9, Math.min(28, cur + delta));
      ed.style.fontSize = `${size}px`;
      document.getElementById('line-numbers').style.fontSize = `${size}px`;
      document.getElementById('editor-font-value').textContent = `${size}px`;
      try { localStorage.setItem('axiom-ui-editor-font', String(size)); } catch {}
    }
    function scrollEditorCaretIntoView() {
      const lineNumber = ed.value.slice(0, ed.selectionStart).split('\n').length - 1;
      const styles = getComputedStyle(ed);
      const lineHeight = parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.5;
      const paddingTop = parseFloat(styles.paddingTop) || 0;
      const paddingBottom = parseFloat(styles.paddingBottom) || 0;
      const caretTop = lineNumber * lineHeight;
      const visibleTop = ed.scrollTop;
      const visibleBottom = visibleTop + ed.clientHeight - paddingTop - paddingBottom;
      if (caretTop < visibleTop) ed.scrollTop = caretTop;
      else if (caretTop + lineHeight > visibleBottom) ed.scrollTop = caretTop + lineHeight - ed.clientHeight + paddingTop + paddingBottom;
      document.getElementById('line-numbers').scrollTop = ed.scrollTop;
    }
    function updateLineNumbers() {
      const c = ed.value.split('\n').length;
      document.getElementById('line-numbers').innerHTML = Array.from({length: c}, (_, i) => i + 1).join('<br>');
    }
    function toggleFullScreen(open) {
      const m = document.getElementById('fullscreen-modal');
      const animBar = document.getElementById('anim-bar');
      const animHome = document.getElementById('anim-bar-home');
      const animSlot = document.getElementById('fullscreen-anim-slot');
      if (open) {
        const mainTsInput = document.getElementById('time-span-input');
        const fsTsInput = document.getElementById('fs-time-span-input');
        if (mainTsInput && fsTsInput) fsTsInput.value = mainTsInput.value;
        const mainSelect = document.getElementById('channel-selector');
        const fsSelect = document.getElementById('fs-channel-selector');
        if (mainSelect && fsSelect) updateFullscreenChannelDropdown();
        if (animBar && animSlot) animSlot.appendChild(animBar);
        m.classList.add('active');
        renderActiveChannel();
        requestAnimationFrame(() => { fsTimeChart.resize(); fsFreqChart.resize(); });
      }
      else {
        m.classList.remove('active');
        if (animBar && animHome?.parentNode) animHome.parentNode.insertBefore(animBar, animHome.nextSibling);
      }
    }
    async function saveFile() {
      try {
        const savedToFile = await window.axiomSaveActiveFile?.(ed.value);
        if (savedToFile) return;
        window.axiomMarkSaved?.();
        appendTerminalOutput('Saved in this browser workspace. This browser does not support saving back to a selected file.');
      } catch (error) {
        if (error?.name === 'AbortError') return;
        appendTerminalOutput(`Could not save file: ${error.message}`);
      }
    }
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleFullScreen(false); });
