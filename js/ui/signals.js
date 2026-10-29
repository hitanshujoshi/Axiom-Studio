    let tSpan = 10.0;
    let N_TIME = 800;
    let timeAxis, freqAxis, dt, df;
    let timeChart, freqChart, fsTimeChart, fsFreqChart;
    let registeredSignals = {};
    let registeredPlots = [];

    const chartViewports = {
      time: { xMin: null, xMax: null, yMin: null, yMax: null, autoY: true },
      freq: { xMin: null, xMax: null, yMin: null, yMax: null, autoY: true }
    };
    let isPanning = false;
    let panStart = { x: 0, y: 0, xMin: 0, xMax: 0, yMin: 0, yMax: 0, chartKey: 'time', isFreq: false };

    const CHANNEL_COLORS = [
      { border: '#00d2ff', bg: 'rgba(0, 210, 255, 0.12)' },
      { border: '#ff007f', bg: 'rgba(255, 0, 127, 0.12)' },
      { border: '#00ff66', bg: 'rgba(0, 255, 102, 0.12)' },
      { border: '#ffb700', bg: 'rgba(255, 183, 0, 0.12)' },
      { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' }
    ];

    function updateTimeSpan() {
      const val = parseFloat(document.getElementById('time-span-input').value);
      if (!isNaN(val) && val >= 1) {
        tSpan = val;
        const fsInput = document.getElementById('fs-time-span-input');
        if (fsInput) fsInput.value = val;
        recalculateAxes();
        recompute();
      }
    }

    function recalculateAxes() {
      dt = (2 * tSpan) / (N_TIME - 1);
      timeAxis = Float64Array.from({ length: N_TIME }, (_, i) => -tSpan + i * dt);

      const nyquistFrequency = 1 / (2 * dt);
      const fMax = Math.min(nyquistFrequency, Math.max(10, 50 / tSpan));
      df = (2 * fMax) / 599;
      freqAxis = Float64Array.from({ length: 600 }, (_, i) => -fMax + i * df);
    }

    function setSignalsWidth(percent) {
      document.documentElement.style.setProperty('--signals-width', percent + '%');
      const label = document.getElementById('signals-width-label');
      if (label) label.textContent = percent + '%';
      [timeChart, freqChart, fsTimeChart, fsFreqChart].forEach(c => { if (c) c.resize(); });
    }

    function setTerminalHeight(percent) {
      document.documentElement.style.setProperty('--terminal-height', percent + '%');
      const label = document.getElementById('terminal-height-label');
      if (label) label.textContent = percent + '%';
    }

    function getActiveViewport(isFreq, isFullscreen = false) {
      if (isFullscreen) return isFreq ? chartViewports.freq : chartViewports.time;
      return isFreq ? chartViewports.freq : chartViewports.time;
    }

    function zoomChartX(factor, isFreq = null) {
      const apply = (vp, baseXMin, baseXMax) => {
        const xMin = vp.xMin != null ? vp.xMin : baseXMin;
        const xMax = vp.xMax != null ? vp.xMax : baseXMax;
        const center = (xMin + xMax) / 2;
        const half = ((xMax - xMin) / 2) / factor;
        vp.xMin = center - half;
        vp.xMax = center + half;
      };
      if (isFreq === null || isFreq === false) apply(chartViewports.time, -tSpan, tSpan);
      if (isFreq === null || isFreq === true) apply(chartViewports.freq, freqAxis[0], freqAxis[freqAxis.length - 1]);
      renderActiveChannel();
    }

    function zoomChartY(factor, isFreq = null) {
      const apply = (vp, datasets = []) => {
        if (vp.yMin == null || vp.yMax == null) {
          let globalMin = Infinity, globalMax = -Infinity;
          datasets.forEach(ds => ds.data?.forEach(p => {
            if (p.y < globalMin) globalMin = p.y;
            if (p.y > globalMax) globalMax = p.y;
          }));
          if (!isFinite(globalMin) || !isFinite(globalMax) || globalMin === globalMax) {
            globalMin = -1; globalMax = 1;
          }
          const pad = (globalMax - globalMin) * 0.1;
          vp.yMin = globalMin - pad;
          vp.yMax = globalMax + pad;
          vp.autoY = false;
        }
        const center = (vp.yMin + vp.yMax) / 2;
        const half = ((vp.yMax - vp.yMin) / 2) / factor;
        vp.yMin = center - half;
        vp.yMax = center + half;
      };
      apply(chartViewports.time, timeChart?.data?.datasets || []);
      apply(chartViewports.freq, freqChart?.data?.datasets || []);
      renderActiveChannel();
    }

    function resetChartViewports() {
      chartViewports.time = { xMin: null, xMax: null, yMin: null, yMax: null, autoY: true };
      chartViewports.freq = { xMin: null, xMax: null, yMin: null, yMax: null, autoY: true };
      renderActiveChannel();
    }

    function buildChartConfig(isFreq = false, isFullscreen = false, chartId = 'timeChart') {
      return {
        type: 'scatter',
        data: { datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { display: true, labels: { color: '#abb2bf', font: { size: 10 } } },
            tooltip: { enabled: false }
          },
          interaction: { mode: 'nearest', intersect: false },
          onHover(evt, activeEls, chart) {
            const { scales: { x, y }, chartArea: { left, right, top, bottom } } = chart;
            if (!x || !y) return;

            const mouseX = evt.x;
            const mouseY = evt.y;

            if (mouseX < left || mouseX > right || mouseY < top || mouseY > bottom) {
              activeHoverPoint = null;
              chart.draw();
              return;
            }

            const mouseXVal = x.getValueForPixel(mouseX);
            const snapXMin = Math.min(x.getValueForPixel(mouseX - 34), x.getValueForPixel(mouseX + 34));
            const snapXMax = Math.max(x.getValueForPixel(mouseX - 34), x.getValueForPixel(mouseX + 34));
            let bestSmoothPoint = null;
            let minSmoothDistSq = Infinity;
            let bestSnapPoint = null;
            let minSnapDistSq = Infinity;

            chart.data.datasets.forEach(ds => {
              if (!ds.data || ds.data.length === 0) return;
              const data = ds.data;
              let interpolatedY;
              if (data.length === 1) {
                interpolatedY = data[0].y;
              } else {
                let lowerIndex = 0;
                let upperIndex = data.length - 1;
                while (upperIndex - lowerIndex > 1) {
                  const middleIndex = Math.floor((lowerIndex + upperIndex) / 2);
                  if (data[middleIndex].x <= mouseXVal) lowerIndex = middleIndex;
                  else upperIndex = middleIndex;
                }
                const leftPoint = data[lowerIndex];
                const rightPoint = data[upperIndex];
                if (mouseXVal < leftPoint.x || mouseXVal > rightPoint.x) return;
                const fraction = rightPoint.x === leftPoint.x ? 0 : (mouseXVal - leftPoint.x) / (rightPoint.x - leftPoint.x);
                interpolatedY = leftPoint.y + (rightPoint.y - leftPoint.y) * fraction;
              }
              const smoothX = x.getPixelForValue(mouseXVal);
              const smoothY = y.getPixelForValue(interpolatedY);
              const smoothDx = smoothX - mouseX;
              const smoothDy = smoothY - mouseY;
              const smoothDistSq = smoothDx * smoothDx + smoothDy * smoothDy;
              if (smoothDistSq < minSmoothDistSq) {
                minSmoothDistSq = smoothDistSq;
                bestSmoothPoint = {
                  chartId: chart.canvas.id,
                  name: ds.label || 'Trace',
                  x: mouseXVal,
                  y: interpolatedY,
                  color: ds.borderColor,
                  isFreq
                };
              }

              if (!signalSnapEnabled) return;
              const snapPoints = ds.snapPoints || [];
              let snapStart = 0;
              let snapEnd = snapPoints.length;
              while (snapStart < snapEnd) {
                const middleIndex = Math.floor((snapStart + snapEnd) / 2);
                if (snapPoints[middleIndex].x < snapXMin) snapStart = middleIndex + 1;
                else snapEnd = middleIndex;
              }
              for (let index = snapStart; index < snapPoints.length && snapPoints[index].x <= snapXMax; index++) {
                const point = snapPoints[index];
                const px = x.getPixelForValue(point.x);
                const py = y.getPixelForValue(point.y);
                const dx = px - mouseX;
                const dy = py - mouseY;
                const distSq = dx * dx + dy * dy;
                if (distSq < minSnapDistSq) {
                  minSnapDistSq = distSq;
                  bestSnapPoint = {
                    chartId: chart.canvas.id,
                    name: ds.label || 'Trace',
                    x: point.x,
                    y: point.y,
                    color: ds.borderColor,
                    isFreq,
                    snapType: point.snapType
                  };
                }
              }
            });

            const selectedPoint = signalSnapEnabled && bestSnapPoint && minSnapDistSq <= 34 * 34
              ? bestSnapPoint
              : bestSmoothPoint && minSmoothDistSq < 65 * 65 ? bestSmoothPoint : null;
            if (selectedPoint) {
              activeHoverPoint = selectedPoint;
              const snapLabel = selectedPoint.snapType ? ` | ${selectedPoint.snapType}` : '';
              const text = isFreq
                ? `Cursor: ${selectedPoint.name} | f = ${selectedPoint.x.toFixed(3)}Hz | Mag = ${selectedPoint.y.toFixed(4)}${snapLabel}`
                : `Cursor: ${selectedPoint.name} | t = ${selectedPoint.x.toFixed(3)}s | Amp = ${selectedPoint.y.toFixed(4)}V${snapLabel}`;
              document.getElementById('cursor-pos').innerText = text;
              const fsCp = document.getElementById('fs-cursor-pos');
              if (fsCp) fsCp.innerText = text;
            } else {
              activeHoverPoint = null;
            }

            chart.draw();
          },
          scales: {
            x: {
              type: 'linear',
              min: isFreq ? freqAxis[0] : -tSpan,
              max: isFreq ? freqAxis[freqAxis.length - 1] : tSpan,
              grid: { color: 'rgba(92, 99, 112, 0.15)' },
              ticks: { color: '#5c6370', font: { size: 10 }, maxTicksLimit: 10 }
            },
            y: {
              grid: { color: 'rgba(92, 99, 112, 0.15)' },
              ticks: { color: '#5c6370', font: { size: 10 }, maxTicksLimit: 8 }
            }
          }
        }
      };
    }

    function initCharts() {
      recalculateAxes();
      timeChart = new Chart(document.getElementById('timeChart'), buildChartConfig(false, false, 'timeChart'));
      freqChart = new Chart(document.getElementById('freqChart'), buildChartConfig(true, false, 'freqChart'));
      fsTimeChart = new Chart(document.getElementById('fsTimeChart'), buildChartConfig(false, true, 'fsTimeChart'));
      fsFreqChart = new Chart(document.getElementById('fsFreqChart'), buildChartConfig(true, true, 'fsFreqChart'));
      attachChartInteraction(timeChart, false);
      attachChartInteraction(freqChart, true);
      attachChartInteraction(fsTimeChart, false);
      attachChartInteraction(fsFreqChart, true);
      PlotWindowManager.attachGlobalHandlers();
    }

    const PlotWindowManager = {
      windows: new Map(),
      zBase: 460,
      zCounter: 460,
      allHidden: false,
      _nextOffset: { x: 60, y: 60 },

      attachGlobalHandlers() {
        window.addEventListener('mousemove', (e) => {
          if (this.dragState) this._applyDrag(e);
          if (this.resizeState) this._applyResize(e);
        });
        window.addEventListener('mouseup', () => {
          this.dragState = null;
          this.resizeState = null;
          document.body.classList.remove('pw-dragging', 'pw-resizing');
        });
      },

      updateBadge() {
        const badge = document.getElementById('figures-count-badge');
        if (badge) badge.textContent = this.windows.size;
        const btn = document.getElementById('figures-toggle');
        if (btn) btn.setAttribute('aria-pressed', !this.allHidden);
      },

      toggleAllVisible() {
        this.allHidden = !this.allHidden;
        document.body.classList.toggle('plot-windows-hidden', this.allHidden);
        this.updateBadge();
      },

      closeAll() {
        [...this.windows.keys()].forEach(id => this.close(id));
      },

      renderPlots(plots) {
        const seen = new Set();
        (plots || []).forEach((plot, i) => {
          const figureKey = String(plot.figure || ('Figure_' + (i + 1)));
          seen.add(figureKey);
          this.upsert(figureKey, plot.points);
        });
        [...this.windows.keys()].forEach(k => {
          if (!seen.has(k)) {
            const w = this.windows.get(k);
            if (w && w.autoOwned) this.close(k);
          }
        });
        this.updateBadge();
      },

      upsert(figureName, sortedPoints) {
        let entry = this.windows.get(figureName);
        if (!entry) entry = this._createWindow(figureName);
        entry.points = sortedPoints.slice();
        this._renderChart(entry);
        return entry;
      },

      _buildChartConfig() {
        return {
          type: 'scatter',
          data: { datasets: [] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: true, mode: 'nearest', intersect: false }
            },
            scales: {
              x: { type: 'linear', position: 'bottom', title: { display: false }, grid: { color: 'rgba(130,140,150,0.12)' }, ticks: { color: '#7a8390', font: { size: 9 } } },
              y: { grid: { color: 'rgba(130,140,150,0.12)' }, ticks: { color: '#7a8390', font: { size: 9 } } }
            }
          }
        };
      },

      _renderChart(entry) {
        const dataset = {
          type: 'line',
          label: 'Figure ' + entry.figure,
          data: entry.points.map(p => ({ x: p.x, y: p.y })),
          borderColor: '#61afef',
          backgroundColor: 'rgba(97,175,239,0.1)',
          fill: true,
          tension: 0.15,
          pointRadius: entry.points.length <= 30 ? 2.2 : 0,
          pointHoverRadius: 4,
          borderWidth: 1.5
        };
        if (!entry.chart) {
          entry.chart = new Chart(entry.canvas, this._buildChartConfig());
        }
        entry.chart.data.datasets = [dataset];
        const xs = entry.points.map(p => p.x);
        const ys = entry.points.map(p => p.y);
        if (xs.length) {
          entry.chart.options.scales.x.min = Math.min(...xs);
          entry.chart.options.scales.x.max = Math.max(...xs);
        }
        entry.chart.update();
      },

      _createWindow(figureName) {
        const layer = document.getElementById('plot-windows-layer');
        const template = document.getElementById('plot-window-template');
        const node = template.content.firstElementChild.cloneNode(true);
        node.setAttribute('data-figure', figureName);
        node.querySelector('.plot-window-title').textContent = 'Figure ' + figureName;
        node.style.left = this._nextOffset.x + 'px';
        node.style.top = this._nextOffset.y + 'px';
        const vw = Math.max(480, window.innerWidth || 1280);
        const vh = Math.max(360, window.innerHeight || 800);
        this._nextOffset.x = (this._nextOffset.x + 32) % Math.max(60, vw - 520);
        this._nextOffset.y = (this._nextOffset.y + 32) % Math.max(60, vh - 360);
        layer.appendChild(node);
        const canvas = node.querySelector('canvas.plot-canvas');
        const header = node.querySelector('[data-drag-handle]');
        const resizer = node.querySelector('[data-resize-handle]');
        const btnMin = node.querySelector('.pw-minimize');
        const btnToggle = node.querySelector('.pw-toggle');
        const btnClose = node.querySelector('.pw-close');
        const entry = {
          id: figureName,
          figure: figureName,
          el: node, canvas, chart: null,
          points: [], minimized: false, collapsed: false,
          autoOwned: true
        };
        node.style.zIndex = ++this.zCounter;
        header.addEventListener('mousedown', (e) => {
          if (e.target.closest('.pw-btn')) return;
          this._bringToFront(entry);
          if (entry.minimized) return;
          const rect = node.getBoundingClientRect();
          this.dragState = { entry, offX: e.clientX - rect.left, offY: e.clientY - rect.top };
          document.body.classList.add('pw-dragging');
          e.preventDefault();
        });
        header.addEventListener('dblclick', (e) => {
          if (e.target.closest('.pw-btn')) return;
          this.toggleCollapse(entry);
        });
        resizer.addEventListener('mousedown', (e) => {
          this._bringToFront(entry);
          if (entry.minimized || entry.collapsed) return;
          const rect = node.getBoundingClientRect();
          this.resizeState = { entry, offX: rect.right - e.clientX, offY: rect.bottom - e.clientY };
          document.body.classList.add('pw-resizing');
          e.preventDefault();
        });
        btnMin.addEventListener('click', () => this.toggleMinimize(entry));
        btnToggle.addEventListener('click', () => this.toggleCollapse(entry));
        btnClose.addEventListener('click', () => this.close(figureName));
        this.windows.set(figureName, entry);
        this.updateBadge();
        return entry;
      },

      _applyDrag(e) {
        const { entry, offX, offY } = this.dragState;
        const layer = document.getElementById('plot-windows-layer');
        const layerRect = layer.getBoundingClientRect();
        entry.el.style.left = Math.max(0, Math.min(layerRect.width - 120, e.clientX - layerRect.left - offX)) + 'px';
        entry.el.style.top = Math.max(0, Math.min(layerRect.height - 40, e.clientY - layerRect.top - offY)) + 'px';
      },

      _applyResize(e) {
        const { entry, offX, offY } = this.resizeState;
        const layer = document.getElementById('plot-windows-layer');
        const layerRect = layer.getBoundingClientRect();
        const rect = entry.el.getBoundingClientRect();
        const newW = Math.max(220, e.clientX - layerRect.left - (rect.left - layerRect.left) + offX);
        const newH = Math.max(160, e.clientY - layerRect.top - (rect.top - layerRect.top) + offY);
        entry.el.style.width = Math.round(newW) + 'px';
        entry.el.style.height = Math.round(newH) + 'px';
        if (entry.chart) entry.chart.resize();
      },

      _bringToFront(entry) {
        [...this.windows.values()].forEach(w => w.el.classList.remove('active'));
        entry.el.classList.add('active');
        entry.el.style.zIndex = ++this.zCounter;
      },

      toggleCollapse(entry) {
        entry.collapsed = !entry.collapsed;
        entry.el.classList.toggle('collapsed', entry.collapsed);
        if (entry.chart) requestAnimationFrame(() => entry.chart.resize());
      },

      toggleMinimize(entry) {
        entry.minimized = !entry.minimized;
        entry.el.classList.toggle('minimized', entry.minimized);
        if (entry.chart && !entry.minimized) requestAnimationFrame(() => entry.chart.resize());
      },

      close(figureName) {
        const entry = this.windows.get(figureName);
        if (!entry) return;
        if (entry.chart) entry.chart.destroy();
        entry.el.remove();
        this.windows.delete(figureName);
        this.updateBadge();
      }
    };

    window.addEventListener('resize', () => {
      PlotWindowManager.windows.forEach(w => { if (w.chart && !w.minimized && !w.collapsed) w.chart.resize(); });
    });

    function dependsOnTime(node, assignments = null, visited = new Set(), boundName = null) {
      if (!node) return false;
      if (node.type === 'Variable') {
        if (node.name === boundName) return false;
        if (node.name === 't') return true;
        if (!assignments || !assignments[node.name] || visited.has(node.name)) return false;
        const nextVisited = new Set(visited);
        nextVisited.add(node.name);
        return dependsOnTime(assignments[node.name], assignments, nextVisited);
      }
      if (node.type === 'SequenceExpression') {
        if (node.assignments) {
          for (const a of node.assignments) {
            if (dependsOnTime(a.value, assignments, visited, boundName)) return true;
          }
        }
        return dependsOnTime(node.result, assignments, visited, boundName);
      }
      if (node.type === 'BinaryExpression') return dependsOnTime(node.left, assignments, visited, boundName) || dependsOnTime(node.right, assignments, visited, boundName);
      if (node.type === 'UnaryExpression') return dependsOnTime(node.operand, assignments, visited, boundName);
      if (node.type === 'TernaryExpression') return dependsOnTime(node.cond, assignments, visited, boundName) || dependsOnTime(node.trueBranch, assignments, visited, boundName) || dependsOnTime(node.falseBranch, assignments, visited, boundName);
      if (node.type === 'ChainComparison') return node.operands.some(op => dependsOnTime(op, assignments, visited, boundName));
      if (node.type === 'SetLiteral') return node.items.some(it => dependsOnTime(it, assignments, visited, boundName));
      if (node.type === 'FunctionCall') {
        if (node.name.toLowerCase() === 'diff') {
          const hasNoEvaluationPoint = node.args.length < 3 || node.args[2]?.type === 'NullLiteral';
          return hasNoEvaluationPoint && dependsOnTime(node.args[0], assignments, visited, boundName);
        }
        if (['integrate', 'ft', 'fouriertransform', 'fs', 'fourierseries'].includes(node.name.toLowerCase())) {
          const integrationVariable = node.args[1]?.name || 't';
          return dependsOnTime(node.args[0], assignments, visited, integrationVariable) ||
            node.args.slice(2).some(arg => dependsOnTime(arg, assignments, visited, boundName));
        }
        return node.args.some(arg => dependsOnTime(arg, assignments, visited, boundName));
      }
      return false;
    }

    let recomputeVersion = 0;
    let activeFourierJob = null;
    const terminalHistory = [];
    const terminalCommandHistory = [];
    const terminalInterpreter = new Interpreter();
    let terminalCommandIndex = 0;
    let latestEditorOutput = 'Ready.';

    function renderTerminalOutput() {
      const consoleBox = document.getElementById('console');
      consoleBox.innerText = [...terminalHistory, latestEditorOutput].filter(Boolean).join('\n');
      consoleBox.scrollTop = consoleBox.scrollHeight;
    }

    function appendTerminalOutput(line) {
      terminalHistory.push(line);
      if (terminalHistory.length > 500) terminalHistory.shift();
      latestEditorOutput = '';
      renderTerminalOutput();
    }

    function formatTerminalValue(value) {
      if (value === null || value === undefined) return value === null ? 'null' : 'undefined';
      if (isComplexNumber(value)) return value.toString();
      if (value?.isSet) return `{${Array.from(value.elements).join(', ')}}`;
      if (Array.isArray(value)) return `[${value.join(', ')}]`;
      if (value instanceof SymbolicFunction) return value.toString();
      if (value?.isAxiomObject) return `<${value.className} instance>`;
      return String(value);
    }

    function runTerminalCommand(source) {
      const command = source.trim();
      if (!command) return;
      if (/^(cls|clear)$/i.test(command)) {
        terminalHistory.length = 0;
        latestEditorOutput = 'Terminal cleared.';
        renderTerminalOutput();
        return;
      }

      terminalCommandHistory.push(command);
      terminalCommandIndex = terminalCommandHistory.length;
      appendTerminalOutput(`> ${command}`);
      try {
        const statements = parseSource(command);
        statements.forEach(statement => {
          if (statement.type === 'AssignStatement') {
            terminalInterpreter.env[`${statement.name}_ast`] = statement.expr;
          }
        });
        const output = [];
        for (const statement of statements) {
          let result;
          try {
            result = terminalInterpreter.execute(statement);
          } catch (error) {
            throw attachSourceLocation(error, statement.sourceLocation);
          }
          if (statement.type === 'AssignStatement') output.push(`${statement.name} = ${formatTerminalValue(result)}`);
          else if (statement.type === 'PrintStatement') output.push(...terminalInterpreter.logs.splice(0));
          else if (result !== null && result !== undefined) output.push(formatTerminalValue(result));
        }
        if (output.length) appendTerminalOutput(output.join('\n'));
      } catch (error) {
        appendTerminalOutput(`Error: ${error.message}`);
      }
    }

    document.getElementById('terminal-command-form').addEventListener('submit', event => {
      event.preventDefault();
      const input = document.getElementById('terminal-command');
      runTerminalCommand(input.value);
      input.value = '';
      input.focus();
    });

    document.getElementById('terminal-command').addEventListener('keydown', event => {
      if (event.key === 'ArrowUp' && terminalCommandHistory.length) {
        event.preventDefault();
        terminalCommandIndex = Math.max(0, terminalCommandIndex - 1);
        event.currentTarget.value = terminalCommandHistory[terminalCommandIndex];
      } else if (event.key === 'ArrowDown' && terminalCommandIndex < terminalCommandHistory.length - 1) {
        event.preventDefault();
        terminalCommandIndex++;
        event.currentTarget.value = terminalCommandHistory[terminalCommandIndex];
      } else if (event.key === 'ArrowDown' && terminalCommandIndex === terminalCommandHistory.length - 1) {
        event.preventDefault();
        terminalCommandIndex = terminalCommandHistory.length;
        event.currentTarget.value = '';
      }
    });

    function cancelFourierJob() {
      if (!activeFourierJob) return;
      const job = activeFourierJob;
      activeFourierJob = null;
      job.worker.terminate();
      URL.revokeObjectURL(job.url);
      job.resolve(null);
    }

    function computeFourierInWorker(signals, hannWindow) {
      if (signals.length === 0) return Promise.resolve([]);
      return new Promise((resolve, reject) => {
        const source = `self.onmessage = ({ data }) => {
          const { signals, frequencies, hannWindow, sampleCount, startTime, dt } = data;
          const results = signals.map(({ name, samples }) => {
            const weightedSamples = Float64Array.from(samples, (value, index) => value * hannWindow[index] * dt);
            const magnitudes = new Float64Array(frequencies.length);
            for (let i = 0; i < frequencies.length; i++) {
              const frequency = frequencies[i];
              const phaseStep = -2 * Math.PI * frequency * dt;
              const stepRe = Math.cos(phaseStep);
              const stepIm = Math.sin(phaseStep);
              const initialPhase = -2 * Math.PI * frequency * startTime;
              let phaseRe = Math.cos(initialPhase);
              let phaseIm = Math.sin(initialPhase);
              let re = 0;
              let im = 0;
              for (let j = 0; j < sampleCount; j++) {
                const sample = weightedSamples[j];
                re += sample * phaseRe;
                im += sample * phaseIm;
                const nextPhaseRe = phaseRe * stepRe - phaseIm * stepIm;
                phaseIm = phaseRe * stepIm + phaseIm * stepRe;
                phaseRe = nextPhaseRe;
              }
              magnitudes[i] = Math.sqrt(re * re + im * im);
            }
            return { name, yFreq: magnitudes };
          });
          self.postMessage(results);
        };`;
        const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        let worker;
        try {
          worker = new Worker(url);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
          return;
        }

        const job = {
          worker,
          url,
          resolve: value => {
            if (activeFourierJob === job) activeFourierJob = null;
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve(value);
          }
        };
        activeFourierJob = job;
        worker.onmessage = event => job.resolve(event.data);
        worker.onerror = event => {
          if (activeFourierJob === job) activeFourierJob = null;
          worker.terminate();
          URL.revokeObjectURL(url);
          reject(event.error || new Error(event.message || 'Fourier worker failed'));
        };
        worker.postMessage({
          signals,
          frequencies: freqAxis,
          hannWindow,
          sampleCount: N_TIME,
          startTime: timeAxis[0],
          dt
        });
      });
    }

    async function recompute({ reportErrors = false } = {}) {
      cancelFourierJob();
      const version = ++recomputeVersion;
      updateLineNumbers();
      const code = ed.value;
      const consoleBox = document.getElementById('console');
      let parsedSuccessfully = false;

      try {
        const stmts = parseSource(code);
        parsedSuccessfully = true;

        const interp = new Interpreter();

        stmts.forEach(s => {
          if (s.type === 'AssignStatement') {
            interp.env[s.name + '_ast'] = s.expr;
          }
        });

        for (const s of stmts) {
          try {
            interp.execute(s);
          } catch (error) {
            throw attachSourceLocation(error, s.sourceLocation);
          }
        }

        let out = "";
        if (interp.logs.length > 0) out += interp.logs.join('\n') + '\n---\n';
        for (const [k, v] of Object.entries(interp.env)) {
          if (['pi', 'tau', 'e', 'c', 't', 'w', 'omega'].includes(k) || k.endsWith('_ast')) continue;
          if (v && v.isSet) out += `${k} = {${Array.from(v.elements).join(', ')}} (Set)\n`;
          else out += `${k} = ${formatTerminalValue(v)}\n`;
        }
        latestEditorOutput = out || "Executed successfully.";
        renderTerminalOutput();
        consoleBox.style.color = "var(--text-main)";

        const divTime = (2 * tSpan / 8).toFixed(1);
        document.getElementById('grid-scale-readout').innerText = `Ruler: ${divTime} s/div`;

        const assignmentAsts = Object.create(null);
        stmts.forEach(stmt => {
          if (stmt.type === 'AssignStatement') assignmentAsts[stmt.name] = stmt.expr;
        });
        const sigStmts = stmts.filter(stmt => stmt.type === 'AssignStatement' && dependsOnTime(stmt.expr, assignmentAsts));
        const dynamicNames = new Set(Object.keys(assignmentAsts).filter(name => dependsOnTime(assignmentAsts[name], assignmentAsts, new Set([name]))));
        const nextSignals = {};
        const hannWindow = Float64Array.from({ length: N_TIME }, (_, index) =>
          0.5 * (1 - Math.cos((2 * Math.PI * index) / (N_TIME - 1)))
        );

        const collectVariables = (node, names = new Set()) => {
          if (!node || typeof node !== 'object') return names;
          if (node.type === 'Variable') {
            names.add(node.name);
            return names;
          }
          if (Array.isArray(node)) {
            node.forEach(child => collectVariables(child, names));
            return names;
          }
          Object.values(node).forEach(child => collectVariables(child, names));
          return names;
        };

        const refreshDynamicVariable = (name, evalEnv, visiting = new Set()) => {
          if (!dynamicNames.has(name) || visiting.has(name)) return;
          visiting.add(name);
          for (const dependency of collectVariables(assignmentAsts[name])) {
            refreshDynamicVariable(dependency, evalEnv, visiting);
          }
          evalEnv.env[name] = evalEnv.execute(assignmentAsts[name]);
          visiting.delete(name);
        };

        const sampleSignal = (expression, evalEnv, timeValue) => {
          evalEnv.env.t = timeValue;
          for (const name of dynamicNames) refreshDynamicVariable(name, evalEnv);
          const value = evalEnv.execute(expression);
          return value instanceof SymbolicFunction ? value.evaluate(evalEnv, timeValue) : value;
        };

        for (const [idx, stmt] of sigStmts.entries()) {
          const colorObj = CHANNEL_COLORS[idx % CHANNEL_COLORS.length];
          const evalEnv = new Interpreter();
          Object.assign(evalEnv.env, interp.env);
          evalEnv.functions = interp.functions;
          evalEnv.deltaWidth = 2 * dt;

          const probeIndices = [0, Math.floor(N_TIME / 2), N_TIME - 1];
          const hasNumericSamples = probeIndices.some(index => {
            const value = sampleSignal(stmt.expr, evalEnv, timeAxis[index]);
            return typeof value === 'number' && Number.isFinite(value);
          });
          if (!hasNumericSamples) continue;

          const yTime = new Float64Array(N_TIME);
          for (let i = 0; i < N_TIME; i++) {
            const value = sampleSignal(stmt.expr, evalEnv, timeAxis[i]);
            yTime[i] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
          }

          nextSignals[stmt.name] = { name: `${stmt.name}(t)`, yTime, yFreq: null, color: colorObj };
        }

        const transformedSignals = await computeFourierInWorker(
          Object.entries(nextSignals).map(([name, signal]) => ({ name, samples: signal.yTime })),
          hannWindow
        );
        if (version !== recomputeVersion) return;
        if (!transformedSignals) return;
        transformedSignals.forEach(result => {
          if (nextSignals[result.name]) nextSignals[result.name].yFreq = result.yFreq;
        });
        registeredSignals = nextSignals;
        registeredPlots = interp.plots;
        updateChannelDropdown();
        renderActiveChannel();

      } catch (err) {
        if (version !== recomputeVersion) return;
        if (!reportErrors && !parsedSuccessfully) return;
        latestEditorOutput = `Editor error: ${err.message}`;
        renderTerminalOutput();
        consoleBox.style.color = "#f43f5e";
      } finally {
        if (version === recomputeVersion) {
          try { PlotWindowManager.renderPlots(registeredPlots || []); } catch (e) {}
        }
      }
    }

    function updateChannelDropdown() {
      const dropdown = document.getElementById('channel-selector');
      const fsDropdown = document.getElementById('fs-channel-selector');
      const prevVal = dropdown.value;
      const figureValues = new Set(registeredPlots.map(plot => `plot:${encodeURIComponent(plot.figure)}`));

      const buildOptions = (select) => {
        select.innerHTML = `<option value="ALL">Show All Traces (${Object.keys(registeredSignals).length + registeredPlots.length})</option>`;
        for (const sigName of Object.keys(registeredSignals)) {
          const opt = document.createElement('option');
          opt.value = sigName;
          opt.innerText = `Trace: ${sigName}(t)`;
          select.appendChild(opt);
        }
        const figures = [...new Set(registeredPlots.map(plot => plot.figure))];
        figures.forEach(figure => {
          const option = document.createElement('option');
          option.value = `plot:${encodeURIComponent(figure)}`;
          option.innerText = `Figure ${figure}`;
          select.appendChild(option);
        });
      };

      buildOptions(dropdown);
      dropdown.value = registeredSignals[prevVal] || prevVal === 'ALL' || figureValues.has(prevVal) ? prevVal : 'ALL';
      if (fsDropdown) {
        buildOptions(fsDropdown);
        fsDropdown.value = dropdown.value;
      }
    }

    function computeAutoYRange(datasets, xMin, xMax) {
      let minY = Infinity, maxY = -Infinity;
      datasets.forEach(ds => {
        if (!ds.data) return;
        ds.data.forEach(p => {
          if (p.x >= xMin && p.x <= xMax) {
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          }
        });
      });
      if (!isFinite(minY) || !isFinite(maxY) || minY === maxY) {
        minY = -1; maxY = 1;
      }
      const pad = Math.max((maxY - minY) * 0.1, 0.05);
      return { yMin: minY - pad, yMax: maxY + pad };
    }

    function applyViewportToChart(chart, vp, baseXMin, baseXMax, datasets) {
      if (!chart) return;
      const xMin = vp.xMin != null ? vp.xMin : baseXMin;
      const xMax = vp.xMax != null ? vp.xMax : baseXMax;
      chart.options.scales.x.min = xMin;
      chart.options.scales.x.max = xMax;

      let yMin, yMax;
      if (vp.yMin != null && vp.yMax != null) {
        yMin = vp.yMin;
        yMax = vp.yMax;
      } else {
        const r = computeAutoYRange(datasets, xMin, xMax);
        yMin = r.yMin; yMax = r.yMax;
        if (!vp.autoY) { vp.yMin = yMin; vp.yMax = yMax; }
      }
      chart.options.scales.y.min = yMin;
      chart.options.scales.y.max = yMax;
    }

    function renderActiveChannel() {
      const mainSelect = document.getElementById('channel-selector');
      const fsSelect = document.getElementById('fs-channel-selector');
      const isFsActive = document.getElementById('fullscreen-modal')?.classList.contains('active');
      const activeSelect = (isFsActive && fsSelect) ? fsSelect : mainSelect;
      if (activeSelect && activeSelect !== mainSelect && mainSelect) mainSelect.value = activeSelect.value;
      const mode = activeSelect ? activeSelect.value : 'ALL';
      const selectedFigure = mode.startsWith('plot:') ? decodeURIComponent(mode.slice(5)) : null;
      const timeDatasets = [];
      const freqDatasets = [];
      const keys = mode === 'ALL' ? Object.keys(registeredSignals) : (selectedFigure === null && registeredSignals[mode] ? [mode] : []);

      keys.forEach(key => {
        const sig = registeredSignals[key];
        const timePts = Array.from(timeAxis, (t, i) => ({ x: t, y: sig.yTime[i] }));
        const freqPts = Array.from(freqAxis, (f, i) => ({ x: f, y: sig.yFreq[i] }));

        timeDatasets.push({
          type: 'line',
          label: sig.name,
          data: timePts,
          snapPoints: getSignalSnapPoints(timePts),
          borderColor: sig.color.border,
          borderWidth: 1.8,
          pointRadius: 0
        });

        freqDatasets.push({
          type: 'line',
          label: `|${sig.name}|`,
          data: freqPts,
          snapPoints: getSignalSnapPoints(freqPts),
          borderColor: sig.color.border,
          backgroundColor: sig.color.bg,
          borderWidth: 1.8,
          fill: mode !== 'ALL',
          pointRadius: 0
        });
      });

      const figurePlotCounts = new Map();
      registeredPlots
        .filter(plot => selectedFigure === null ? mode === 'ALL' : plot.figure === selectedFigure)
        .forEach(plot => {
          const plotNumber = (figurePlotCounts.get(plot.figure) || 0) + 1;
          figurePlotCounts.set(plot.figure, plotNumber);
          const figureHash = Array.from(plot.figure).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) | 0, 7);
          const color = CHANNEL_COLORS[Math.abs(figureHash) % CHANNEL_COLORS.length];
          const data = plot.points;
          timeDatasets.push({
            type: 'line',
            label: `Figure ${plot.figure} Â· Plot ${plotNumber}`,
            data,
            snapPoints: data.map(point => ({ ...point, snapType: 'Point' })),
            borderColor: color.border,
            backgroundColor: color.bg,
            borderWidth: 1.8,
            pointRadius: 4,
            pointHoverRadius: 6,
            showLine: data.length > 1,
            fill: false
          });
        });

      timeChart.data.datasets = timeDatasets;
      applyViewportToChart(timeChart, chartViewports.time, -tSpan, tSpan, timeDatasets);
      timeChart.update();

      freqChart.data.datasets = freqDatasets;
      applyViewportToChart(freqChart, chartViewports.freq, freqAxis[0], freqAxis[freqAxis.length - 1], freqDatasets);
      freqChart.update();

      if (document.getElementById('fullscreen-modal').classList.contains('active')) {
        fsTimeChart.data.datasets = timeDatasets;
        applyViewportToChart(fsTimeChart, chartViewports.time, -tSpan, tSpan, timeDatasets);
        fsTimeChart.update();

        fsFreqChart.data.datasets = freqDatasets;
        applyViewportToChart(fsFreqChart, chartViewports.freq, freqAxis[0], freqAxis[freqAxis.length - 1], freqDatasets);
        fsFreqChart.update();
      }
    }

    const touchChartPointers = new Map();
    let pinchStart = null;

    function startChartPan(chart, isFreq, clientX, clientY) {
      const rect = chart.canvas.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;
      const viewport = isFreq ? chartViewports.freq : chartViewports.time;
      const baseXMin = isFreq ? freqAxis[0] : -tSpan;
      const baseXMax = isFreq ? freqAxis[freqAxis.length - 1] : tSpan;
      const xMin = viewport.xMin ?? baseXMin;
      const xMax = viewport.xMax ?? baseXMax;
      const yRange = viewport.yMin != null && viewport.yMax != null
        ? { yMin: viewport.yMin, yMax: viewport.yMax }
        : computeAutoYRange(chart.data.datasets, xMin, xMax);
      isPanning = true;
      panStart = {
        x: clientX, y: clientY, xMin, xMax,
        yMin: yRange.yMin, yMax: yRange.yMax,
        chart, isFreq
      };
      chart.canvas.style.cursor = 'grabbing';
      return true;
    }

    function updateChartPan(clientX, clientY) {
      if (!isPanning || !panStart.chart) return;
      const { chart, x, y, xMin, xMax, yMin, yMax, isFreq } = panStart;
      const viewport = isFreq ? chartViewports.freq : chartViewports.time;
      const area = chart.chartArea;
      if (!area) return;
      const pixelPerX = (area.right - area.left) / (xMax - xMin);
      const pixelPerY = (area.bottom - area.top) / (yMax - yMin);
      const dx = (clientX - x) / pixelPerX;
      const dy = (clientY - y) / pixelPerY;
      viewport.xMin = xMin - dx;
      viewport.xMax = xMax - dx;
      viewport.yMin = yMin + dy;
      viewport.yMax = yMax + dy;
      viewport.autoY = false;
      renderActiveChannel();
    }

    function beginChartPinch(chart, isFreq, pointers) {
      const [first, second] = pointers;
      const rect = chart.canvas.getBoundingClientRect();
      const centerX = (first.x + second.x) / 2;
      const centerY = (first.y + second.y) / 2;
      const viewport = isFreq ? chartViewports.freq : chartViewports.time;
      const baseXMin = isFreq ? freqAxis[0] : -tSpan;
      const baseXMax = isFreq ? freqAxis[freqAxis.length - 1] : tSpan;
      const xMin = viewport.xMin ?? baseXMin;
      const xMax = viewport.xMax ?? baseXMax;
      const yRange = viewport.yMin != null && viewport.yMax != null
        ? { yMin: viewport.yMin, yMax: viewport.yMax }
        : computeAutoYRange(chart.data.datasets, xMin, xMax);
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      pinchStart = {
        chart, isFreq, pointerIds: [first.id, second.id], distance,
        xMin, xMax, yMin: yRange.yMin, yMax: yRange.yMax,
        anchorX: chart.scales.x.getValueForPixel(centerX - rect.left),
        anchorY: chart.scales.y.getValueForPixel(centerY - rect.top)
      };
    }

    function updateChartPinch() {
      if (!pinchStart) return;
      const first = touchChartPointers.get(pinchStart.pointerIds[0]);
      const second = touchChartPointers.get(pinchStart.pointerIds[1]);
      if (!first || !second) return;
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const factor = Math.max(0.1, Math.min(10, distance / Math.max(1, pinchStart.distance)));
      const viewport = pinchStart.isFreq ? chartViewports.freq : chartViewports.time;
      const xSpan = (pinchStart.xMax - pinchStart.xMin) / factor;
      const ySpan = (pinchStart.yMax - pinchStart.yMin) / factor;
      const xRatio = (pinchStart.anchorX - pinchStart.xMin) / (pinchStart.xMax - pinchStart.xMin);
      const yRatio = (pinchStart.anchorY - pinchStart.yMin) / (pinchStart.yMax - pinchStart.yMin);
      viewport.xMin = pinchStart.anchorX - xRatio * xSpan;
      viewport.xMax = viewport.xMin + xSpan;
      viewport.yMin = pinchStart.anchorY - yRatio * ySpan;
      viewport.yMax = viewport.yMin + ySpan;
      viewport.autoY = false;
      renderActiveChannel();
    }

    function attachChartInteraction(chart, isFreq) {
      const canvas = chart.canvas;
      if (!canvas) return;
      canvas._isFreq = isFreq;

      canvas.addEventListener('wheel', (evt) => {
        evt.preventDefault();
        const rect = canvas.getBoundingClientRect();
        if (evt.clientX < rect.left || evt.clientX > rect.right || evt.clientY < rect.top || evt.clientY > rect.bottom) return;

        const vp = isFreq ? chartViewports.freq : chartViewports.time;
        const baseXMin = isFreq ? freqAxis[0] : -tSpan;
        const baseXMax = isFreq ? freqAxis[freqAxis.length - 1] : tSpan;

        const factor = evt.deltaY < 0 ? 1.2 : 1 / 1.2;

        if (evt.ctrlKey || evt.metaKey) {
          zoomChartY(factor, isFreq);
        } else {
          const xMin = vp.xMin != null ? vp.xMin : baseXMin;
          const xMax = vp.xMax != null ? vp.xMax : baseXMax;
          const { scales: { x } } = chart;
          if (!x) { zoomChartX(factor, isFreq); return; }
          const mouseXVal = x.getValueForPixel(evt.clientX - rect.left) || (xMin + xMax) / 2;
          const ratio = (mouseXVal - xMin) / (xMax - xMin);
          const newHalf = ((xMax - xMin) / 2) / factor;
          const newCenter = mouseXVal - (ratio - 0.5) * 2 * newHalf;
          vp.xMin = newCenter - newHalf;
          vp.xMax = newCenter + newHalf;
          renderActiveChannel();
        }
      }, { passive: false });

      canvas.addEventListener('pointerdown', (evt) => {
        if (evt.pointerType === 'mouse') {
          if (evt.button !== 0) return;
          startChartPan(chart, isFreq, evt.clientX, evt.clientY);
          return;
        }
        if (evt.pointerType !== 'touch') return;
        evt.preventDefault();
        try { canvas.setPointerCapture?.(evt.pointerId); } catch {}
        touchChartPointers.set(evt.pointerId, { id: evt.pointerId, x: evt.clientX, y: evt.clientY, chart, isFreq });
        const pointers = Array.from(touchChartPointers.values()).filter(pointer => pointer.chart === chart);
        if (pointers.length === 1) startChartPan(chart, isFreq, evt.clientX, evt.clientY);
        else if (pointers.length === 2) {
          isPanning = false;
          beginChartPinch(chart, isFreq, pointers);
        }
      });

      canvas.addEventListener('dblclick', () => {
        resetChartViewports();
      });

      canvas.addEventListener('mouseenter', () => { canvas.style.cursor = isPanning ? 'grabbing' : 'crosshair'; });
    }

    window.addEventListener('mousemove', (evt) => {
      updateChartPan(evt.clientX, evt.clientY);
    });

    window.addEventListener('pointermove', event => {
      const pointer = touchChartPointers.get(event.pointerId);
      if (!pointer) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      const activePointers = Array.from(touchChartPointers.values()).filter(item => item.chart === pointer.chart);
      if (activePointers.length >= 2) updateChartPinch();
      else updateChartPan(event.clientX, event.clientY);
    });

    const endChartPointer = event => {
      const pointer = touchChartPointers.get(event.pointerId);
      if (!pointer) return;
      touchChartPointers.delete(event.pointerId);
      if (pinchStart?.pointerIds.includes(event.pointerId)) pinchStart = null;
      isPanning = false;
      pointer.chart.canvas.style.cursor = 'crosshair';
    };
    window.addEventListener('pointerup', endChartPointer);
    window.addEventListener('pointercancel', endChartPointer);

    window.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        if (timeChart) timeChart.canvas.style.cursor = 'crosshair';
        if (freqChart) freqChart.canvas.style.cursor = 'crosshair';
      }
    });

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

      const doc = DOCS[word.toLowerCase()];
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

      if (!match || match[1].length < (isForced ? 1 : 2)) {
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
      if (open) {
        const mainTsInput = document.getElementById('time-span-input');
        const fsTsInput = document.getElementById('fs-time-span-input');
        if (mainTsInput && fsTsInput) fsTsInput.value = mainTsInput.value;
        const mainSelect = document.getElementById('channel-selector');
        const fsSelect = document.getElementById('fs-channel-selector');
        if (mainSelect && fsSelect) updateFullscreenChannelDropdown();
        m.classList.add('active');
        renderActiveChannel();
        requestAnimationFrame(() => { fsTimeChart.resize(); fsFreqChart.resize(); });
      }
      else { m.classList.remove('active'); }
    }
    function saveFile() {
      const filename = document.getElementById('active-filename').textContent || 'untitled.axiom';
      const blob = new Blob([ed.value], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      window.axiomMarkSaved?.();
    }
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleFullScreen(false); });

