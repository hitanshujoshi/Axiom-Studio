/* ==========================================================================
3. HARDWARE RULER & ACCURATE 2D POINT SNAPPER (BOTH TIME & FREQ)
       ========================================================================== */
    let activeHoverPoint = null;
    let samplingEnabled = false;
    let samplingRate = 2;
    const HardwareInspectorPlugin = {
      id: 'hwInspector',
      afterDraw(chart) {
        const { ctx, chartArea: { left, top, right, bottom }, scales: { x, y } } = chart;
        if (!x || !y) return;

        ctx.save();

        ctx.strokeStyle = '#3e4451';
        ctx.lineWidth = 1;
        const xTicks = x.ticks;
        if (xTicks && xTicks.length > 1) {
          for (let i = 0; i < xTicks.length - 1; i++) {
            const x0 = x.getPixelForTick(i);
            const x1 = x.getPixelForTick(i + 1);
            const step = (x1 - x0) / 5;
            for (let j = 1; j < 5; j++) {
              const mx = x0 + j * step;
              ctx.beginPath();
              ctx.moveTo(mx, top); ctx.lineTo(mx, top + (j === 2 ? 6 : 3.5));
               ctx.moveTo(mx, bottom); ctx.lineTo(mx, bottom - (j === 2 ? 6 : 3.5));
              ctx.stroke();
            }
          }
        }

        const yTicks = y.ticks;
        if (yTicks && yTicks.length > 1) {
          for (let i = 0; i < yTicks.length - 1; i++) {
            const y0 = y.getPixelForTick(i);
            const y1 = y.getPixelForTick(i + 1);
            const step = (y1 - y0) / 5;
            for (let j = 1; j < 5; j++) {
              const my = y0 + j * step;
              ctx.beginPath();
              ctx.moveTo(left, my); ctx.lineTo(left + (j === 2 ? 6 : 3.5), my);
              ctx.moveTo(right, my); ctx.lineTo(right - (j === 2 ? 6 : 3.5), my);
              ctx.stroke();
            }
          }
        }

        if (activeHoverPoint && chart.canvas.id === activeHoverPoint.chartId) {
          const pt = activeHoverPoint;
          const px = x.getPixelForValue(pt.x);
          const py = y.getPixelForValue(pt.y);

          if (px >= left && px <= right && py >= top && py <= bottom) {
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, top); ctx.lineTo(px, bottom);
            ctx.moveTo(left, py); ctx.lineTo(right, py);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = pt.color || '#61afef';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            const unit = pt.isFreq ? 'Hz, Mag' : 's, V';
            const text = `${pt.name}: (${pt.x.toFixed(3)}${pt.isFreq ? 'Hz' : 's'}, ${pt.y.toFixed(3)}${pt.isFreq ? '' : 'V'})${pt.snapType ? ` | ${pt.snapType}` : ''}`;
            ctx.font = 'bold 11px Consolas, monospace';
            const textWidth = ctx.measureText(text).width;
            const badgeW = textWidth + 14;
            const badgeH = 20;

            let badgeX = px - badgeW / 2;
            badgeX = Math.max(left + 4, Math.min(right - badgeW - 4, badgeX));
            let badgeY = (py - badgeH - 10 < top) ? (py + 10) : (py - badgeH - 10);

            ctx.fillStyle = 'rgba(15, 17, 21, 0.95)';
            ctx.strokeStyle = pt.color || '#61afef';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, badgeX + 7, badgeY + 14);
          }
        }

        ctx.restore();
      }
    };
    Chart.register(HardwareInspectorPlugin);
    let signalSnapEnabled = true;
    let snapBeforeSampling = null;
    const signalSnapToggle = document.getElementById('signal-snap-toggle');
    const timeGridSnapToggle = document.getElementById('time-grid-snap-toggle');
    const fsSignalSnapToggle = document.getElementById('fs-signal-snap-toggle');
    const fsTimeGridSnapToggle = document.getElementById('fs-time-grid-snap-toggle');
    const samplingToggle = document.getElementById('sampling-toggle');
    const fsSamplingToggle = document.getElementById('fs-sampling-toggle');
    const samplingRateInput = document.getElementById('sampling-rate');
    const fsSamplingRateInput = document.getElementById('fs-sampling-rate');
    let timeGridSnapEnabled = false;
    try {
      signalSnapEnabled = localStorage.getItem('axiom-ui-signal-snap') !== 'false';
      timeGridSnapEnabled = localStorage.getItem('axiom-ui-time-grid-snap') === 'true';
      samplingEnabled = localStorage.getItem('axiom-ui-sampling') === 'true';
      samplingRate = Number(localStorage.getItem('axiom-ui-sampling-rate') || 2);
    } catch {}
    if (!Number.isFinite(samplingRate) || samplingRate <= 0) samplingRate = 2;
    signalSnapToggle.checked = signalSnapEnabled;
    timeGridSnapToggle.checked = timeGridSnapEnabled;
    fsSignalSnapToggle.checked = signalSnapEnabled;
    fsTimeGridSnapToggle.checked = timeGridSnapEnabled;
    samplingToggle.checked = samplingEnabled;
    fsSamplingToggle.checked = samplingEnabled;
    samplingRateInput.value = samplingRate;
    fsSamplingRateInput.value = samplingRate;
    function updateSamplingSnapAvailability() {
      if (samplingEnabled) {
        if (!snapBeforeSampling) snapBeforeSampling = { signal: signalSnapEnabled, timeGrid: timeGridSnapEnabled };
        signalSnapEnabled = false;
        timeGridSnapEnabled = false;
      } else if (snapBeforeSampling) {
        signalSnapEnabled = snapBeforeSampling.signal;
        timeGridSnapEnabled = snapBeforeSampling.timeGrid;
        snapBeforeSampling = null;
      }
      [signalSnapToggle, fsSignalSnapToggle].forEach(toggle => {
        toggle.checked = signalSnapEnabled;
        toggle.disabled = samplingEnabled;
      });
      [timeGridSnapToggle, fsTimeGridSnapToggle].forEach(toggle => {
        toggle.checked = timeGridSnapEnabled;
        toggle.disabled = samplingEnabled;
      });
    }
    updateSamplingSnapAvailability();
    updateSamplingReadout();
    signalSnapToggle.addEventListener('change', () => {
      signalSnapEnabled = signalSnapToggle.checked;
      fsSignalSnapToggle.checked = signalSnapEnabled;
      try { localStorage.setItem('axiom-ui-signal-snap', String(signalSnapEnabled)); } catch {}
      activeHoverPoint = null;
      renderActiveChannel();
    });
    timeGridSnapToggle.addEventListener('change', () => {
      timeGridSnapEnabled = timeGridSnapToggle.checked;
      fsTimeGridSnapToggle.checked = timeGridSnapEnabled;
      try { localStorage.setItem('axiom-ui-time-grid-snap', String(timeGridSnapEnabled)); } catch {}
      activeHoverPoint = null;
      renderActiveChannel();
    });
    fsSignalSnapToggle.addEventListener('change', () => {
      signalSnapEnabled = fsSignalSnapToggle.checked;
      signalSnapToggle.checked = signalSnapEnabled;
      try { localStorage.setItem('axiom-ui-signal-snap', String(signalSnapEnabled)); } catch {}
      activeHoverPoint = null;
      renderActiveChannel();
    });
    fsTimeGridSnapToggle.addEventListener('change', () => {
      timeGridSnapEnabled = fsTimeGridSnapToggle.checked;
      timeGridSnapToggle.checked = timeGridSnapEnabled;
      try { localStorage.setItem('axiom-ui-time-grid-snap', String(timeGridSnapEnabled)); } catch {}
      activeHoverPoint = null;
      renderActiveChannel();
    });
    const setSampling = (enabled, rate) => {
      samplingEnabled = enabled;
      if (Number.isFinite(rate) && rate > 0) samplingRate = Math.min(100, Math.max(0.1, rate));
      updateSamplingSnapAvailability();
      samplingToggle.checked = samplingEnabled;
      fsSamplingToggle.checked = samplingEnabled;
      samplingRateInput.value = samplingRate;
      fsSamplingRateInput.value = samplingRate;
      try {
        localStorage.setItem('axiom-ui-sampling', String(samplingEnabled));
        localStorage.setItem('axiom-ui-sampling-rate', String(samplingRate));
      } catch {}
      updateSamplingReadout();
      renderActiveChannel();
    };
    samplingToggle.addEventListener('change', () => setSampling(samplingToggle.checked, Number(samplingRateInput.value)));
    fsSamplingToggle.addEventListener('change', () => setSampling(fsSamplingToggle.checked, Number(fsSamplingRateInput.value)));
    samplingRateInput.addEventListener('change', () => setSampling(samplingEnabled, Number(samplingRateInput.value)));
    fsSamplingRateInput.addEventListener('change', () => setSampling(samplingEnabled, Number(fsSamplingRateInput.value)));
    samplingRateInput.addEventListener('input', () => setSampling(samplingEnabled, Number(samplingRateInput.value)));
    fsSamplingRateInput.addEventListener('input', () => setSampling(samplingEnabled, Number(fsSamplingRateInput.value)));
    function getSignalSnapPoints(data) {
      if (!data || data.length < 3) return [];
      const largestMagnitude = data.reduce((largest, point) => Math.max(largest, Math.abs(point.y)), 0);
      const zeroTolerance = Math.max(1e-12, largestMagnitude * 1e-6);
      const points = [];
      for (let index = 1; index < data.length - 1; index++) {
        const previous = data[index - 1];
        const current = data[index];
        const next = data[index + 1];
        const risingIntoPoint = current.y > previous.y;
        const fallingAfterPoint = next.y < current.y;
        const fallingIntoPoint = current.y < previous.y;
        const risingAfterPoint = next.y > current.y;
        if ((risingIntoPoint && next.y <= current.y) || (fallingIntoPoint && next.y >= current.y)) {
          points.push({
            x: current.x,
            y: current.y,
            snapType: Math.abs(current.y) <= zeroTolerance
              ? 'Zero touch'
              : risingIntoPoint && fallingAfterPoint ? 'Peak' : 'Trough'
          });
        }
        if ((previous.y < 0 && next.y > 0) || (previous.y > 0 && next.y < 0)) {
          if (current.y === 0) points.push({ x: current.x, y: 0, snapType: 'Zero crossing' });
        }
      }
      for (let index = 0; index < data.length - 1; index++) {
        const left = data[index];
        const right = data[index + 1];
        if (left.y * right.y < 0) {
          const ratio = Math.abs(left.y) / (Math.abs(left.y) + Math.abs(right.y));
          points.push({
            x: left.x + (right.x - left.x) * ratio,
            y: 0,
            snapType: 'Zero crossing'
          });
        }
      }
      return points.sort((left, right) => left.x - right.x);
    }

    /* ==========================================================================
7. MULTI-CHANNEL OSCILLOSCOPE (TRUE 2D TIME & FREQ INSPECTOR)
       ========================================================================== */
    let tSpan = 10.0;
    const MAX_TIME_SPAN = 100;
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
    const AXIS_Y_COLOR = '#ff8c42';
    const AXIS_X_COLOR = '#fff1c1';
    const PREVIOUS_STEP_COLOR = 'rgba(203, 213, 225, 0.52)';
    function updateSamplingReadout() {
      const readout = document.getElementById('nyquist-readout');
      if (readout) readout.textContent = samplingEnabled
        ? `Sampling: ${samplingRate.toFixed(1)} Hz | Ts: ${(1 / samplingRate).toFixed(3)} s | Nyquist: ${(samplingRate / 2).toFixed(1)} Hz | Aliasing: compare signal f > Nyquist`
        : 'Sampling: off | Nyquist: —';
    }

    function getSamplePoints(points) {
      if (!samplingEnabled || points.length < 2 || !Number.isFinite(samplingRate) || samplingRate <= 0) return [];

      // Sampling is defined in time, so do not select every Nth rendered point.
      // The rendered grid can change with zoom/span and would otherwise change
      // the effective sampling frequency. Place samples at the exact t = n/Fs
      // locations and linearly interpolate the displayed continuous signal.
      const validPoints = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
      if (validPoints.length < 2) return [];
      const start = validPoints[0].x;
      const end = validPoints[validPoints.length - 1].x;
      const samplePeriod = 1 / samplingRate;
      const firstIndex = Math.ceil(start / samplePeriod - 1e-9);
      const lastIndex = Math.floor(end / samplePeriod + 1e-9);
      const samples = [];
      let segment = 0;

      for (let n = firstIndex; n <= lastIndex; n++) {
        const x = n * samplePeriod;
        while (segment < validPoints.length - 2 && validPoints[segment + 1].x < x) segment++;
        const left = validPoints[segment];
        const right = validPoints[Math.min(segment + 1, validPoints.length - 1)];
        const span = right.x - left.x;
        const ratio = span > 0 ? (x - left.x) / span : 0;
        const y = left.y + (right.y - left.y) * Math.max(0, Math.min(1, ratio));
        samples.push({ x, y });
      }
      return samples;
    }

    function updateTimeSpan() {
      const input = document.getElementById('time-span-input');
      const val = parseFloat(input.value);
      if (Number.isFinite(val)) {
        const boundedValue = Math.min(MAX_TIME_SPAN, Math.max(1, val));
        input.value = boundedValue;
        tSpan = boundedValue;
        const fsInput = document.getElementById('fs-time-span-input');
        if (fsInput) fsInput.value = boundedValue;
        recalculateAxes();
        recompute();
      }
    }

    const FFT_SIZE = 131072;
    // When every displayed channel is a discrete-time signal the views switch to n (samples) and cycles/sample.
    let discreteOnlyHalf = null;
    const baseTimeMin = () => discreteOnlyHalf !== null ? -discreteOnlyHalf - 0.5 : -tSpan;
    const baseTimeMax = () => discreteOnlyHalf !== null ? discreteOnlyHalf + 0.5 : tSpan;
    const baseFreqMin = () => discreteOnlyHalf !== null ? -0.5 : freqAxis[0];
    const baseFreqMax = () => discreteOnlyHalf !== null ? 0.5 : freqAxis[freqAxis.length - 1];
    function recalculateAxes() {
      // Power-of-two step sizes keep every grid nested, so the same t always lands on the same sample for any span.
      // Keep one time grid at every span. This makes extrema and FFT inputs independent
      // of the visible window instead of silently halving the sample density at 32 s.
      dt = 1 / 256;
      const half = Math.round(tSpan / dt);
      // Half-step offset keeps jumps (such as u(t) at t = 0) between samples instead of on one, which removes a dt/2 bias.
      N_TIME = 2 * half;
      timeAxis = Float64Array.from({ length: N_TIME }, (_, i) => (i - half + 0.5) * dt);

      // Fixed output grid of 1/32 Hz, so the frequency bins never move when the span changes.
      df = 1 / 32;
      const bins = Math.floor(Math.min(50, 0.5 / dt) / df);
      freqAxis = Float64Array.from({ length: 2 * bins + 1 }, (_, i) => (i - bins) * df);
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
      if (isFreq === null || isFreq === true) apply(chartViewports.freq, baseFreqMin(), baseFreqMax());
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
          parsing: false,
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

            const rawMouseXVal = x.getValueForPixel(mouseX);
            const mouseXVal = !isFreq && timeGridSnapEnabled
              ? Math.round(rawMouseXVal / 0.5) * 0.5
              : rawMouseXVal;
            const snapXMin = Math.min(x.getValueForPixel(mouseX - 34), x.getValueForPixel(mouseX + 34));
            const snapXMax = Math.max(x.getValueForPixel(mouseX - 34), x.getValueForPixel(mouseX + 34));
            let bestSmoothPoint = null;
            let minSmoothDistSq = Infinity;
            let bestSnapPoint = null;
            let minSnapDistSq = Infinity;

            chart.data.datasets.forEach(ds => {
              if (!ds.data || ds.data.length === 0) return;
              if (ds.sampleOverlay) return;
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

              if ((!signalSnapEnabled && !samplingEnabled) || (samplingEnabled && isFreq)) return;
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

            const selectedPoint = (signalSnapEnabled || (!isFreq && samplingEnabled)) && bestSnapPoint && minSnapDistSq <= 34 * 34
              ? bestSnapPoint
              : bestSmoothPoint && minSmoothDistSq < 65 * 65 ? bestSmoothPoint : null;
            if (selectedPoint) {
              if (!isFreq && timeGridSnapEnabled && selectedPoint === bestSmoothPoint) selectedPoint.snapType = '0.5 s grid';
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
              min: isFreq ? baseFreqMin() : baseTimeMin(),
              max: isFreq ? baseFreqMax() : baseTimeMax(),
              grid: {
                color: context => context.tick?.value === 0 ? AXIS_Y_COLOR : 'rgba(92, 99, 112, 0.15)',
                lineWidth: context => context.tick?.value === 0 ? 2.2 : 1
              },
              ticks: { color: context => context.tick?.value === 0 ? AXIS_Y_COLOR : '#5c6370', font: { size: 10 }, maxTicksLimit: 10 }
            },
            y: {
              grid: {
                color: context => context.tick?.value === 0 ? AXIS_X_COLOR : 'rgba(92, 99, 112, 0.15)',
                lineWidth: context => context.tick?.value === 0 ? 2.2 : 1
              },
              ticks: { color: context => context.tick?.value === 0 ? AXIS_X_COLOR : '#5c6370', font: { size: 10 }, maxTicksLimit: 8 }
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
          if (this.panState) this._applyPan(e);
        });
        window.addEventListener('mouseup', () => {
          this.dragState = null;
          this.resizeState = null;
          this.panState = null;
          document.body.classList.remove('pw-dragging', 'pw-resizing', 'pw-panning');
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
              x: { type: 'linear', position: 'bottom', title: { display: true, text: 'X', color: '#7a8390' }, grid: { color: 'rgba(130,140,150,0.12)' }, ticks: { color: '#7a8390', font: { size: 9 } } },
              y: { title: { display: true, text: 'Y', color: '#7a8390' }, grid: { color: 'rgba(130,140,150,0.12)' }, ticks: { color: '#7a8390', font: { size: 9 } } }
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
        const xs = entry.points.map(point => point.x);
        const ys = entry.points.map(point => point.y);
        const finiteExtent = (values, fallbackMin, fallbackMax) => {
          let low = Infinity, high = -Infinity;
          for (const value of values) { if (Number.isFinite(value)) { if (value < low) low = value; if (value > high) high = value; } }
          return low <= high ? [low, high] : [fallbackMin, fallbackMax];
        };
        let [xMin, xMax] = finiteExtent(xs, 0, 1);
        let [yMin, yMax] = finiteExtent(ys, 0, 1);
        const xPad = xMax === xMin ? 0.5 : (xMax - xMin) * 0.05;
        const yPad = yMax === yMin ? Math.max(0.5, Math.abs(yMin) * 0.05) : (yMax - yMin) * 0.1;
        entry.baseBounds = { xMin: xMin - xPad, xMax: xMax + xPad, yMin: yMin - yPad, yMax: yMax + yPad };
        const bounds = entry.viewport || entry.baseBounds;
        entry.chart.options.scales.x.min = bounds.xMin;
        entry.chart.options.scales.x.max = bounds.xMax;
        entry.chart.options.scales.y.min = bounds.yMin;
        entry.chart.options.scales.y.max = bounds.yMax;
        entry.chart.update('none');
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
        const btnMaximize = node.querySelector('.pw-maximize');
        const btnClose = node.querySelector('.pw-close');
        const entry = {
          id: figureName,
          figure: figureName,
          el: node, canvas, chart: null,
          points: [], minimized: false, collapsed: false, maximized: false, restoreRect: null,
          viewport: null, baseBounds: null,
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
        btnMaximize.addEventListener('click', () => this.toggleMaximize(entry));
        node.querySelector('.pw-zoom-x-in').addEventListener('click', () => this.zoom(entry, 'x', 1.25));
        node.querySelector('.pw-zoom-x-out').addEventListener('click', () => this.zoom(entry, 'x', 0.8));
        node.querySelector('.pw-zoom-y-in').addEventListener('click', () => this.zoom(entry, 'y', 1.25));
        node.querySelector('.pw-zoom-y-out').addEventListener('click', () => this.zoom(entry, 'y', 0.8));
        node.querySelector('.pw-reset').addEventListener('click', () => this.resetZoom(entry));
        btnClose.addEventListener('click', () => this.close(figureName));
        canvas.addEventListener('wheel', event => {
          event.preventDefault();
          this.zoom(entry, event.ctrlKey || event.metaKey ? 'y' : 'x', event.deltaY < 0 ? 1.15 : 0.87);
        }, { passive: false });
        canvas.addEventListener('mousedown', event => {
          if (event.button !== 0 || entry.minimized || entry.collapsed) return;
          this._bringToFront(entry);
          this.panState = { entry, x: event.clientX, y: event.clientY, bounds: { ...(entry.viewport || entry.baseBounds) } };
          document.body.classList.add('pw-panning');
          event.preventDefault();
        });
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

      _applyPan(e) {
        const { entry, x, y, bounds } = this.panState;
        const rect = entry.canvas.getBoundingClientRect();
        const xShift = ((e.clientX - x) / Math.max(1, rect.width)) * (bounds.xMax - bounds.xMin);
        const yShift = ((e.clientY - y) / Math.max(1, rect.height)) * (bounds.yMax - bounds.yMin);
        entry.viewport = {
          xMin: bounds.xMin - xShift,
          xMax: bounds.xMax - xShift,
          yMin: bounds.yMin + yShift,
          yMax: bounds.yMax + yShift
        };
        this._renderChart(entry);
      },

      zoom(entry, axis, factor) {
        if (!entry.baseBounds) return;
        const bounds = entry.viewport || entry.baseBounds;
        const minKey = axis === 'x' ? 'xMin' : 'yMin';
        const maxKey = axis === 'x' ? 'xMax' : 'yMax';
        const center = (bounds[minKey] + bounds[maxKey]) / 2;
        const half = (bounds[maxKey] - bounds[minKey]) / (2 * factor);
        entry.viewport = { ...bounds, [minKey]: center - half, [maxKey]: center + half };
        this._renderChart(entry);
      },

      resetZoom(entry) {
        entry.viewport = null;
        this._renderChart(entry);
      },

      toggleMaximize(entry) {
        if (entry.maximized) {
          entry.maximized = false;
          entry.el.classList.remove('maximized');
          if (entry.restoreRect) {
            entry.el.style.left = entry.restoreRect.left;
            entry.el.style.top = entry.restoreRect.top;
            entry.el.style.width = entry.restoreRect.width;
            entry.el.style.height = entry.restoreRect.height;
          }
          entry.restoreRect = null;
          entry.el.querySelector('.pw-maximize').title = 'Maximize';
        } else {
          const rect = entry.el.getBoundingClientRect();
          entry.restoreRect = {
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`
          };
          entry.maximized = true;
          entry.el.classList.add('maximized');
          entry.el.querySelector('.pw-maximize').title = 'Restore window';
        }
        this._bringToFront(entry);
        if (entry.chart) requestAnimationFrame(() => entry.chart.resize());
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
      if (node.type === 'AbsoluteValueExpression') return dependsOnTime(node.expression, assignments, visited, boundName);
      if (node.type === 'TernaryExpression') return dependsOnTime(node.cond, assignments, visited, boundName) || dependsOnTime(node.trueBranch, assignments, visited, boundName) || dependsOnTime(node.falseBranch, assignments, visited, boundName);
      if (node.type === 'ChainComparison') return node.operands.some(op => dependsOnTime(op, assignments, visited, boundName));
      if (node.type === 'SetLiteral') return node.items.some(it => dependsOnTime(it, assignments, visited, boundName));
      if (node.type === 'FunctionCall') {
        if (node.name.toLowerCase() === 'diff') {
          const hasNoEvaluationPoint = node.args.length < 3 || node.args[2]?.type === 'NullLiteral';
          return hasNoEvaluationPoint && dependsOnTime(node.args[0], assignments, visited, boundName);
        }
        if (['integrate', 'ft', 'fs'].includes(node.name.toLowerCase())) {
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

    function formatTerminalValue(value, seen = new WeakSet()) {
      if (value === null || value === undefined) return value === null ? 'null' : 'undefined';
      if (isComplexNumber(value)) return value.toString();
      if (value?.isSet) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        const formatted = formatSetValue(value, seen);
        seen.delete(value);
        return formatted;
      }
      if (value?.isDiscreteSignal) return value.toString();
      if (value?.isMathSetType) return value.toString?.() || value.symbol || value.name;
      if (value?.isFormulaValue) return value.toString();
      if (value instanceof SymbolicFunction) return value.toString();
      if (value?.isMathInterval) {
        const lower = value.includeLower ? '[' : '(';
        const upper = value.includeUpper ? ']' : ')';
        return `${lower}${formatTerminalValue(value.lower)}, ${formatTerminalValue(value.upper)}${upper}`;
      }
      if (Array.isArray(value)) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        const formatted = `[${value.map(item => formatTerminalValue(item, seen)).join(', ')}]`;
        seen.delete(value);
        return formatted;
      }
      if (value && typeof value === 'object' && typeof value.type === 'string') {
        return SymbolicEngine.toPrettyMathString(value);
      }
      if (value?.isAxiomObject) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        const fields = Object.entries(value.fields || {}).map(([name, field]) => `${name}: ${formatTerminalValue(field, seen)}`);
        seen.delete(value);
        return fields.length ? `${value.className} {${fields.join(', ')}}` : `${value.className} {}`;
      }
      if (typeof value === 'object') {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        const entries = Object.entries(value);
        const formatted = entries.length
          ? `{${entries.map(([key, item]) => `${key}: ${formatTerminalValue(item, seen)}`).join(', ')}}`
          : '{}';
        seen.delete(value);
        return formatted;
      }
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

    function computeFourierInWorker(signals, dtOverride) {
      if (signals.length === 0) return Promise.resolve([]);
      return new Promise((resolve, reject) => {
        const source = `
          let FFTLibrary = null;
          try {
            importScripts('https://cdn.jsdelivr.net/npm/fft.js@4.0.4/lib/fft.js');
            FFTLibrary = self.FFT;
          } catch {}

          function fft(re, im) {
            const n = re.length;
            for (let i = 1, j = 0; i < n; i++) {
              let bit = n >> 1;
              for (; j & bit; bit >>= 1) j ^= bit;
              j ^= bit;
              if (i < j) { let x = re[i]; re[i] = re[j]; re[j] = x; x = im[i]; im[i] = im[j]; im[j] = x; }
            }
            for (let len = 2; len <= n; len <<= 1) {
              const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
              for (let i = 0; i < n; i += len) {
                let cr = 1, ci = 0;
                for (let k = 0; k < half; k++) {
                  const a = i + k, b = a + half;
                  const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
                  re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
                  const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
                }
              }
            }
          }
          self.onmessage = ({ data }) => {
            const { signals, bins, stride, fftSize, dt, usable } = data;
            const results = signals.map(({ name, samples, persistent }) => {
              const count = samples.length;
              const re = new Float64Array(fftSize), im = new Float64Array(fftSize);
              let weightSum = 0;
              const weightedSamples = new Float64Array(fftSize);
              for (let k = 0; k < count; k++) {
                // Persistent signals (tones) use a Hann window and are normalised by its gain, so a tone of
                // amplitude A reads A/2 at +-f for any span. Transient signals use no window and read |X(f)|.
                const w = persistent ? 0.5 * (1 - Math.cos(2 * Math.PI * k / (count - 1))) : 1;
                re[k] = samples[k] * w;
                weightedSamples[k] = re[k];
                weightSum += w;
              }
              if (FFTLibrary) {
                // fft.js is a widely used radix-4/radix-2 FFT implementation.
                // Use its complex transform for the same zero-padded input;
                // retain the local implementation as an offline fallback.
                const transform = new FFTLibrary(fftSize);
                const input = transform.createComplexArray();
                const output = transform.createComplexArray();
                for (let k = 0; k < fftSize; k++) input[2 * k] = weightedSamples[k];
                transform.transform(output, input);
                for (let k = 0; k < fftSize; k++) { re[k] = output[2 * k]; im[k] = output[2 * k + 1]; }
              } else {
                fft(re, im);
              }
              const scale = persistent ? 1 / weightSum : dt;
              const out = new Float64Array(2 * bins + 1);
              // Peak-hold across each output bin, so a narrow peak keeps its true height whatever the span is.
              const reach = stride >> 1;
              for (let j = -bins; j <= bins; j++) {
                if (Math.abs(j) > usable) { out[j + bins] = 0; continue; }
                let best = 0;
                for (let d = -reach; d < stride - reach; d++) {
                  const index = ((((j * stride + d) % fftSize) + fftSize) % fftSize);
                  const magnitude = re[index] * re[index] + im[index] * im[index];
                  if (magnitude > best) best = magnitude;
                }
                out[j + bins] = Math.sqrt(best) * scale;
              }
              return { name, yFreq: out };
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
        const dtUsed = dtOverride || dt;
        worker.postMessage({
          signals,
          bins: (freqAxis.length - 1) / 2,
          stride: Math.round(dtUsed * FFT_SIZE * df),
          usable: Math.min((freqAxis.length - 1) / 2, Math.floor(0.5 / dtUsed / df)),
          fftSize: FFT_SIZE,
          dt: dtUsed
        });
      });
    }

    function computePersistent(values) {
      let peak = 0, edge = 0;
      for (let i = 0; i < values.length; i++) { const v = Math.abs(values[i]); if (Number.isFinite(v) && v > peak) peak = v; }
      const edgeCount = Math.max(2, Math.floor(values.length * 0.05));
      for (let i = 0; i < edgeCount; i++) {
        const a = Math.abs(values[i]), b = Math.abs(values[values.length - 1 - i]);
        edge = Math.max(edge, Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0);
      }
      return peak > 0 && edge > 0.05 * peak;
    }

    function buildDiscreteChannel(value, name, color) {
      // Use a fixed analysis window so a display span change does not redefine the
      // finite sequence used by the discrete-time spectrum.
      const half = 200;
      const nAxis = Array.from({ length: 2 * half + 1 }, (_, i) => i - half);
      const yTime = Float64Array.from(nAxis, n => {
        try { const v = value.at(n); return typeof v === 'number' ? v : (v && typeof v.real === 'number' ? Math.hypot(v.real, v.imaginary) : NaN); } catch (e) { return NaN; }
      });
      const persistent = computePersistent(yTime);
      const fAxis = Float64Array.from({ length: 4097 }, (_, j) => -0.5 + j / 4096);
      const weights = Float64Array.from(yTime, (_, i) => persistent ? 0.5 * (1 - Math.cos(2 * Math.PI * i / (yTime.length - 1))) : 1);
      const weightSum = weights.reduce((a, b) => a + b, 0);
      const yFreq = Float64Array.from(fAxis, f => {
        let re = 0, im = 0;
        for (let i = 0; i < nAxis.length; i++) {
          const v = yTime[i];
          if (!Number.isFinite(v) || v === 0) continue;
          const phase = -2 * Math.PI * f * nAxis[i];
          re += v * weights[i] * Math.cos(phase);
          im += v * weights[i] * Math.sin(phase);
        }
        return Math.hypot(re, im) / (persistent ? weightSum : 1);
      });
      return { name: `${name}[n]`, discrete: true, nAxis, yTime, fAxis, yFreq, persistent, color };
    }

    /* ---- animate(): step through explicitly supplied signal states ---- */
    let animation = null, animWired = false;

    function findAnimateCall(node) {
      if (!node || typeof node !== 'object') return null;
      if (Array.isArray(node)) { for (const child of node) { const found = findAnimateCall(child); if (found) return found; } return null; }
      if (node.type === 'FunctionCall' && String(node.name).toLowerCase() === 'animate') return node;
      for (const value of Object.values(node)) { if (value && typeof value === 'object') { const found = findAnimateCall(value); if (found) return found; } }
      return null;
    }

    function animationLabel(entry, frame) {
      const output = entry.discrete ? `${entry.name}[n]` : `${entry.name}(t)`;
      const source = frame === 0 ? 'startSignal' : `signalSteps[${frame - 1}]`;
      return `${output} \u2190 ${source}`;
    }

    function updateAnimationBar() {
      const bar = document.getElementById('anim-bar');
      if (!bar) return;
      bar.hidden = !animation;
      if (!animation) return;
      const items = animation.items;
      const nextButton = document.getElementById('anim-next');
      const previousButton = document.getElementById('anim-previous');
      nextButton.hidden = animation.frameCount < 2;
      previousButton.hidden = animation.frameCount < 2;
      previousButton.disabled = animation.currentFrame <= 0;
      nextButton.disabled = animation.currentFrame >= animation.frameCount - 1;
      document.getElementById('anim-play').innerHTML = '&#8634; Show start';
      const frame = animation.currentFrame || 0;
      const formula = items.map(entry => animationLabel(entry, Math.min(frame, entry.frameCount - 1))).join('   |   ');
      document.getElementById('anim-label').textContent = `Step ${frame + 1} of ${animation.frameCount}: ${formula}`;
    }

    function setupAnimation(interp, continuousEntries, signals) {
      const entries = continuousEntries.map(entry => {
        const first = entry.call.args[0];
        const states = interp.animationStateNodes(entry.call.args);
        return { ...entry, name: entry.stmt.name, frameCount: states.length, sourceName: first && first.type === 'Variable' ? first.name : 'signal' };
      });
      const discrete = Object.entries(interp.env)
        .filter(([, value]) => value && value.isDiscreteSignal && value.animated)
        .map(([name, value]) => ({ name, value, discrete: true, frameCount: value.animationSequenceLength, sourceName: value.sourceName }));
      const items = [...entries, ...discrete];
      const frameCount = items.length ? Math.max(...items.map(entry => entry.frameCount)) : 0;
      animation = items.length ? { interp, entries, discrete, signals, items, frameCount, currentFrame: 0, activeNames: new Set(), shadows: new Map() } : null;
      if (animation && !animWired) {
        animWired = true;
        document.getElementById('anim-play').addEventListener('click', () => revealAnimationFrame(0));
        document.getElementById('anim-next').addEventListener('click', () => {
          if (!animation || animation.frameCount < 2) return;
          revealAnimationFrame(Math.min(animation.frameCount - 1, animation.currentFrame + 1));
        });
        document.getElementById('anim-previous').addEventListener('click', () => {
          if (!animation || animation.frameCount < 2) return;
          revealAnimationFrame(Math.max(0, animation.currentFrame - 1));
        });
      }
      updateAnimationBar();
    }

    async function revealAnimationFrame(frame) {
      if (!animation?.items.length) return;
      const activeAnimation = animation;
      const version = (activeAnimation.renderVersion || 0) + 1;
      activeAnimation.renderVersion = version;
      const nextFrame = Math.max(0, Math.min(frame, activeAnimation.frameCount - 1));
      if (nextFrame !== activeAnimation.currentFrame) {
        activeAnimation.shadows = new Map();
        for (const entry of activeAnimation.items) {
          const signal = activeAnimation.signals[entry.name];
          if (!signal) continue;
          activeAnimation.shadows.set(entry.name, {
            ...signal,
            yTime: Float64Array.from(signal.yTime || []),
            yFreq: signal.yFreq ? Float64Array.from(signal.yFreq) : null,
            nAxis: signal.nAxis ? Float64Array.from(signal.nAxis) : null,
            fAxis: signal.fAxis ? Float64Array.from(signal.fAxis) : null,
            tAxis: signal.tAxis ? Float64Array.from(signal.tAxis) : null
          });
        }
      } else if (nextFrame === 0) activeAnimation.shadows = new Map();
      activeAnimation.currentFrame = nextFrame;
      activeAnimation.interp.animationFrame = activeAnimation.currentFrame;
      activeAnimation.entries.forEach(entry => { entry.evalEnv.animationFrame = activeAnimation.currentFrame; });
      activeAnimation.activeNames = new Set(activeAnimation.items.map(entry => entry.name));
      const fourierJobs = [];
      for (const entry of activeAnimation.entries) {
        const signal = activeAnimation.signals[entry.name];
        if (!signal) continue;
        const y = new Float64Array(N_TIME);
        for (let i = 0; i < N_TIME; i++) {
          const value = entry.sample(timeAxis[i], activeAnimation.currentFrame);
          y[i] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
        }
        signal.yTime = y;
        signal.persistent = computePersistent(y);
        fourierJobs.push({ name: entry.name, samples: y, persistent: signal.persistent });
      }
      for (const entry of activeAnimation.discrete) {
        const signal = activeAnimation.signals[entry.name];
        if (signal) Object.assign(signal, buildDiscreteChannel(entry.value, entry.name, signal.color));
      }
      updateAnimationBar();
      renderActiveChannel();
      if (fourierJobs.length) {
        try {
          const results = await computeFourierInWorker(fourierJobs);
          if (animation !== activeAnimation || activeAnimation.renderVersion !== version || !results) return;
          results.forEach(result => { if (activeAnimation.signals[result.name]) activeAnimation.signals[result.name].yFreq = result.yFreq; });
        } catch (error) {}
      }
      if (animation !== activeAnimation || activeAnimation.renderVersion !== version) return;
      renderActiveChannel();
      updateAnimationBar();
    }

    function prepareReboundAssignments(statements) {
      const previous = new Map();

      const replaceSelf = (node, name, replacement) => {
        if (!node || typeof node !== 'object') return node;
        if (node.type === 'Variable' && node.name === name) return structuredClone(replacement);
        if (Array.isArray(node)) return node.map(child => replaceSelf(child, name, replacement));
        const copy = { ...node };
        for (const [key, value] of Object.entries(node)) {
          if (value && typeof value === 'object') copy[key] = replaceSelf(value, name, replacement);
        }
        return copy;
      };

      for (const statement of statements) {
        if (statement.type !== 'AssignStatement') continue;
        const oldExpression = previous.get(statement.name);
        if (oldExpression) statement.expr = replaceSelf(statement.expr, statement.name, oldExpression);
        previous.set(statement.name, statement.expr);
      }
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
        prepareReboundAssignments(stmts);

        stmts.forEach(s => {
          if (s.type === 'AssignStatement') interp.env[s.name + '_ast'] = s.expr;
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
          out += `${k} = ${formatTerminalValue(v)}${v?.isSet ? ' (Set)' : ''}\n`;
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

        const sampleSignal = (expression, evalEnv, timeValue, frame = 0) => {
          evalEnv.animationFrame = frame;
          evalEnv.env.t = timeValue;
          for (const name of dynamicNames) refreshDynamicVariable(name, evalEnv);
          const value = evalEnv.execute(expression);
          return value instanceof SymbolicFunction ? value.evaluate(evalEnv, timeValue) : value;
        };

        const containsDeltaCall = node => {
          if (!node || typeof node !== 'object') return false;
          if (Array.isArray(node)) return node.some(containsDeltaCall);
          if (node.type === 'FunctionCall' && String(node.name).toLowerCase() === 'delta') return true;
          return Object.values(node).some(value => value && typeof value === 'object' && containsDeltaCall(value));
        };

        const animatedEntries = [];
        for (const [idx, stmt] of sigStmts.entries()) {
          const colorObj = CHANNEL_COLORS[idx % CHANNEL_COLORS.length];
          const evalEnv = new Interpreter();
          Object.assign(evalEnv.env, interp.env);
          evalEnv.functions = interp.functions;
          evalEnv.deltaWidth = 2 * dt;
          evalEnv.animationFrame = 0;

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

          let impulseTime = null;
          if (containsDeltaCall(stmt.expr)) {
            let peakIndex = 0;
            for (let i = 1; i < yTime.length; i++) {
              if (Math.abs(yTime[i]) > Math.abs(yTime[peakIndex])) peakIndex = i;
            }
            yTime.fill(0);
            yTime[peakIndex] = 1;
            impulseTime = Math.abs(timeAxis[peakIndex]) <= dt ? 0 : timeAxis[peakIndex];
          }

          let peak = 0, edge = 0;
          for (let i = 0; i < N_TIME; i++) peak = Math.max(peak, Math.abs(yTime[i]));
          const edgeCount = Math.max(16, Math.floor(N_TIME * 0.05));
          for (let i = 0; i < edgeCount; i++) edge = Math.max(edge, Math.abs(yTime[i]), Math.abs(yTime[N_TIME - 1 - i]));
          nextSignals[stmt.name] = { name: `${stmt.name}(t)`, yTime, yFreq: null, color: colorObj, persistent: peak > 0 && edge > 0.05 * peak, impulseTime };
          const animateCall = findAnimateCall(stmt.expr);
          if (animateCall) animatedEntries.push({ stmt, evalEnv, call: animateCall, sample: (timeValue, frame = 0) => sampleSignal(stmt.expr, evalEnv, timeValue, frame) });
        }

        const transformedSignals = await computeFourierInWorker(
          Object.entries(nextSignals).map(([name, signal]) => ({ name, samples: signal.yTime, persistent: signal.persistent }))
        );
        if (version !== recomputeVersion) return;
        if (!transformedSignals) return;
        transformedSignals.forEach(result => {
          if (nextSignals[result.name]) nextSignals[result.name].yFreq = result.yFreq;
        });
        for (const [name, value] of Object.entries(interp.env)) {
          if (!value || !value.isDiscreteSignal) continue;
          nextSignals[name] = buildDiscreteChannel(value, name, CHANNEL_COLORS[Object.keys(nextSignals).length % CHANNEL_COLORS.length]);
        }
        registeredSignals = nextSignals;
        registeredPlots = interp.plots;
        setupAnimation(interp, animatedEntries, nextSignals);
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

      const buildOptions = (select) => {
        select.innerHTML = `<option value="ALL">Show All Traces (${Object.keys(registeredSignals).length})</option>`;
        for (const sigName of Object.keys(registeredSignals)) {
          const opt = document.createElement('option');
          opt.value = sigName;
          opt.innerText = `Trace: ${sigName}(t)`;
          select.appendChild(opt);
        }
      };

      buildOptions(dropdown);
      dropdown.value = registeredSignals[prevVal] || prevVal === 'ALL' ? prevVal : 'ALL';
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
      minY = Math.min(minY, 0);
      maxY = Math.max(maxY, 0);
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
      const timeDatasets = [];
      const freqDatasets = [];
      const keys = mode === 'ALL' ? Object.keys(registeredSignals) : (registeredSignals[mode] ? [mode] : []);
      const explanation = document.getElementById('signal-explanation');
      if (explanation) {
        const shown = keys.map(key => registeredSignals[key]).filter(Boolean);
        if (!shown.length) {
          explanation.innerHTML = '<strong>Signal guide:</strong> Run a signal to see its amplitude, range, period, and frequency summary.';
        } else {
          let peak = 0, min = Infinity, max = -Infinity;
          let dominantMagnitude = -Infinity, dominantFrequency = 0;
          shown.forEach(sig => {
            const timeValues = sig.yTime || [];
            for (let index = 0; index < timeValues.length; index++) {
              const value = timeValues[index];
              if (!Number.isFinite(value)) continue;
              peak = Math.max(peak, Math.abs(value));
              min = Math.min(min, value);
              max = Math.max(max, value);
            }
            const frequencyValues = sig.yFreq || [];
            for (let index = 0; index < frequencyValues.length; index++) {
              const magnitude = Math.abs(frequencyValues[index]);
              if (magnitude > dominantMagnitude) {
                dominantMagnitude = magnitude;
                dominantFrequency = freqAxis?.[index] ?? 0;
              }
            }
          });
          if (!Number.isFinite(min) || !Number.isFinite(max)) min = max = 0;
          const frequencyText = Number.isFinite(dominantFrequency) && Math.abs(dominantFrequency) > 1e-9
            ? ` Dominant frequency: <strong>${Math.abs(dominantFrequency).toFixed(3)} Hz</strong>.` : '';
          explanation.innerHTML = `<strong>Signal guide:</strong> ${shown.length} trace${shown.length === 1 ? '' : 's'}. ` +
            `Range <strong>${min.toFixed(3)} to ${max.toFixed(3)}</strong>, peak magnitude <strong>${peak.toFixed(3)}</strong>.${frequencyText}`;
        }
      }
      if (!window.__axiomStemsRegistered && typeof Chart !== 'undefined' && Chart.register) {
        window.__axiomStemsRegistered = true;
        Chart.register({
          id: 'axiomStems',
          afterDatasetsDraw(chart) {
            const yScale = chart.scales && chart.scales.y;
            if (!yScale) return;
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, index) => {
              if (!dataset.stems) return;
              const meta = chart.getDatasetMeta(index);
              if (meta.hidden) return;
              const baseline = yScale.getPixelForValue(0);
              ctx.save();
              ctx.strokeStyle = dataset.borderColor;
              ctx.lineWidth = 1.6;
              meta.data.forEach(point => {
                if (point.skip) return;
                ctx.beginPath(); ctx.moveTo(point.x, baseline); ctx.lineTo(point.x, point.y); ctx.stroke();
              });
              ctx.restore();
            });
          }
        });
      }
      {
        const shown = keys.map(key => registeredSignals[key]);
        const previousHalf = discreteOnlyHalf;
        discreteOnlyHalf = shown.length && shown.every(sig => sig.discrete)
          ? Math.max(...shown.map(sig => sig.nAxis[sig.nAxis.length - 1])) : null;
        if (previousHalf !== discreteOnlyHalf) {
          ['time', 'freq'].forEach(chartKey => { chartViewports[chartKey].xMin = null; chartViewports[chartKey].xMax = null; });
        }
      }

      keys.forEach(key => {
        const sig = registeredSignals[key];
        const isRevealed = animation?.activeNames?.has(key);
        const timePts = sig.discrete
          ? Array.from(sig.nAxis, (n, i) => ({ x: n, y: sig.yTime[i] })).filter(point => Number.isFinite(point.y))
          : sig.impulseTime !== null && sig.impulseTime !== undefined
            ? [{ x: sig.impulseTime, y: 1 }]
            : Array.from(sig.tAxis || timeAxis, (t, i) => ({ x: t, y: sig.yTime[i] }));
        const freqPts = Array.from(sig.discrete ? sig.fAxis : freqAxis, (f, i) => ({ x: f, y: sig.yFreq[i] }));
        const shadow = animation?.shadows?.get(key);
        if (shadow) {
          const shadowTimePts = shadow.discrete
            ? Array.from(shadow.nAxis || [], (n, i) => ({ x: n, y: shadow.yTime[i] })).filter(point => Number.isFinite(point.y))
            : Array.from(shadow.tAxis || timeAxis, (t, i) => ({ x: t, y: shadow.yTime[i] }));
          const shadowFreqPts = shadow.yFreq
            ? Array.from(shadow.discrete ? shadow.fAxis : freqAxis, (f, i) => ({ x: f, y: shadow.yFreq[i] }))
            : [];
          timeDatasets.push({
            type: 'line', label: `Previous step: ${sig.name}`, data: shadowTimePts,
            borderColor: PREVIOUS_STEP_COLOR, borderWidth: 1.7, borderDash: [6, 4],
            pointRadius: shadow.discrete ? 3 : 0, pointHoverRadius: 3,
            ...(shadow.discrete ? { showLine: false, stems: true, backgroundColor: PREVIOUS_STEP_COLOR } : {})
          });
          if (shadowFreqPts.length) freqDatasets.push({
            type: 'line', label: `Previous step: |${sig.name}|`, data: shadowFreqPts,
            borderColor: PREVIOUS_STEP_COLOR, borderWidth: 1.5, borderDash: [6, 4],
            fill: false, pointRadius: 0
          });
        }

        timeDatasets.push({
          type: 'line',
          label: sig.name,
          data: timePts,
          snapPoints: samplingEnabled && !sig.discrete
            ? getSamplePoints(timePts).map(point => ({ ...point, snapType: 'Sample' }))
            : getSignalSnapPoints(timePts),
          borderColor: sig.color.border,
          borderWidth: isRevealed ? 3.1 : 1.8,
          pointRadius: 0,
          ...(sig.discrete ? { showLine: false, pointRadius: 4, pointHoverRadius: 6, stems: true, backgroundColor: sig.color.border } : {})
        });

        if (samplingEnabled && !sig.discrete) {
          const samples = getSamplePoints(timePts);
          timeDatasets.push({
            type: 'line',
            label: `Samples: ${sig.name}`,
            data: samples,
            showLine: false,
            pointRadius: 3.5,
            pointHoverRadius: 5,
            borderColor: sig.color.border,
            backgroundColor: sig.color.border,
            sampleOverlay: true
          });
          timeDatasets.push({
            type: 'line',
            label: `Reconstruction: ${sig.name}`,
            data: samples,
            borderColor: sig.color.border,
            borderWidth: 1.3,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false,
            sampleOverlay: true
          });
        }

        freqDatasets.push({
          type: 'line',
          label: `|${sig.name}| ${sig.persistent ? 'amplitude' : 'transform'}`,
          data: freqPts,
          snapPoints: getSignalSnapPoints(freqPts),
          borderColor: sig.color.border,
          backgroundColor: sig.color.bg,
          borderWidth: isRevealed ? 3.1 : 1.8,
          fill: mode !== 'ALL',
          pointRadius: 0
        });
      });

      timeChart.data.datasets = timeDatasets;
      applyViewportToChart(timeChart, chartViewports.time, -tSpan, tSpan, timeDatasets);
      timeChart.update();

      freqChart.data.datasets = freqDatasets;
      applyViewportToChart(freqChart, chartViewports.freq, baseFreqMin(), baseFreqMax(), freqDatasets);
      freqChart.update();

      if (document.getElementById('fullscreen-modal').classList.contains('active')) {
        fsTimeChart.data.datasets = timeDatasets;
        applyViewportToChart(fsTimeChart, chartViewports.time, -tSpan, tSpan, timeDatasets);
        fsTimeChart.update();

        fsFreqChart.data.datasets = freqDatasets;
        applyViewportToChart(fsFreqChart, chartViewports.freq, baseFreqMin(), baseFreqMax(), freqDatasets);
        fsFreqChart.update();
      }
    }

    const touchChartPointers = new Map();
    let pinchStart = null;

    function startChartPan(chart, isFreq, clientX, clientY) {
      const rect = chart.canvas.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;
      const viewport = isFreq ? chartViewports.freq : chartViewports.time;
      const baseXMin = isFreq ? baseFreqMin() : baseTimeMin();
      const baseXMax = isFreq ? baseFreqMax() : baseTimeMax();
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
      const baseXMin = isFreq ? baseFreqMin() : baseTimeMin();
      const baseXMax = isFreq ? baseFreqMax() : baseTimeMax();
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
        const baseXMin = isFreq ? baseFreqMin() : baseTimeMin();
        const baseXMax = isFreq ? baseFreqMax() : baseTimeMax();

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
