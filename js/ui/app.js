    window.onload = () => {
      initSplitters();
      initCharts();
      ed.value = `# 1. Mathematical Derivative - now supports 30+ functions without error!
a = diff(asin(x), x, at = 0);
b = diff(abs(x), x);
d_floor = diff(floor(x), x);
print("asin'(0):", a, "  abs':", b, "  floor':", d_floor);

# 2. Chain comparison WITH INLINE ASSIGNMENT: 0 < x = 10 < 20
#    (assigns x=10 AND verifies range in one expression)
gate = 0 < x = 10 < 20;
print("x =", x, "  gate result (0<10<20):", gate);

# 3. Conditional / piecewise variable declaration
#    x = { value : condition,  value : otherwise }
z = 0.5;
y = {
  0 : 0 < z < 1,
  1 : z >= 1 and z < 2,
 -1 : otherwise
};
print("Piecewise y at z=0.5:", y);

# 4. Ternary operator ?: (compatible with all truthy values)
k = -3;
abs_k = k > 0 ? k : -k;
sign_k = k < 0 ? -1 : k > 0 ? 1 : 0;
print("|k| =", abs_k, "  sign(k) =", sign_k);

# 5. Multi-Signal Waveforms
omega = 2 * pi * 0.5;
x_sig = sin(omega * t);
y_sig = 0.8 * cos(2 * pi * 2 * t) * (-12 < t < 12);
z_sig = rect(t / 6);

# Click ðŸ§ª TEST in the toolbar to run 50+ validation cases!`;
      recompute();

      let t;
      ed.addEventListener('input', () => {
        recomputeVersion += 1;
        cancelFourierJob();
        clearTimeout(t);
        t = setTimeout(recompute, 120);
      });
    };
