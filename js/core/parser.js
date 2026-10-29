
    /* ==========================================================================
       1. EXTENSIVE HOVER DOCUMENTATION DATA
       ========================================================================== */
    const DOCS = {
      'diff': {
        sig: 'diff(expr, target, at = null)',
        param: 'expr: formula | target: variable or compound (e.g., t or (t^2)/2) | at: point or null',
        desc: 'Computes analytical derivative. If target is compound, applies Leibniz rule. Fully folds constants.',
        example: 'diff(x^7 + cos((t^2)/2), (t^2)/2, at = 2)'
      },
      'integrate': {
        sig: 'integrate(expr, var, from, to)',
        param: 'expr: formula | var: variable | from, to: real bounds (including inf)',
        desc: 'Evaluates finite or convergent improper integrals numerically. Assigned signals can be called as x(t).',
        example: 'integrate(x(t) * e^(-i * omega * t), t, -inf, inf)'
      },
      'ft': {
        sig: 'FT(signal(var), var, omega [, from, to])',
        param: 'signal: time-domain expression | omega: angular frequency | optional finite or infinite bounds',
        desc: 'Continuous-time Fourier transform using the exp(-i*omega*t) convention.',
        example: 'FT(x(t), t, omega)'
      },
      'fs': {
        sig: 'FS(signal(var), var, period, harmonic [, start])',
        param: 'period: positive period T | harmonic: integer n | optional start time (default 0)',
        desc: 'Returns the complex Fourier-series coefficient c_n over one period.',
        example: 'FS(x(t), t, tau, 1)'
      },
      'sin': { sig: 'sin(x)', param: 'x: radians', desc: 'Sine of an angle.', example: 'sin(pi / 2)' },
      'cos': { sig: 'cos(x)', param: 'x: radians', desc: 'Cosine of an angle.', example: 'cos(pi)' },
      'tan': { sig: 'tan(x)', param: 'x: radians', desc: 'Tangent of an angle.', example: 'tan(pi / 4)' },
        'sec': { sig: 'sec(x)', param: 'x: radians', desc: 'Secant of an angle.', example: 'sec(pi / 3)' },
        'csc': { sig: 'csc(x)', param: 'x: radians', desc: 'Cosecant of an angle.', example: 'csc(pi / 2)' },
        'cot': { sig: 'cot(x)', param: 'x: radians', desc: 'Cotangent of an angle.', example: 'cot(pi / 4)' },
      'asin': { sig: 'asin(x)', param: 'x: value in [-1, 1]', desc: 'Inverse sine; returns radians.', example: 'asin(1)' },
      'acos': { sig: 'acos(x)', param: 'x: value in [-1, 1]', desc: 'Inverse cosine; returns radians.', example: 'acos(0)' },
      'atan': { sig: 'atan(x)', param: 'x: real number', desc: 'Inverse tangent; returns radians.', example: 'atan(1)' },
      'atan2': { sig: 'atan2(y, x)', param: 'y, x: real coordinates', desc: 'Four-quadrant inverse tangent; returns radians.', example: 'atan2(1, 1)' },
      'sinh': { sig: 'sinh(x)', param: 'x: real number', desc: 'Hyperbolic sine.', example: 'sinh(1)' },
      'cosh': { sig: 'cosh(x)', param: 'x: real number', desc: 'Hyperbolic cosine.', example: 'cosh(1)' },
      'tanh': { sig: 'tanh(x)', param: 'x: real number', desc: 'Hyperbolic tangent.', example: 'tanh(1)' },
      'exp': { sig: 'exp(x)', param: 'x: real number', desc: 'Euler\'s number e raised to the power of x.', example: 'exp(1)' },
      'ln': { sig: 'ln(x)', param: 'x: positive real', desc: 'Natural logarithm (base e).', example: 'ln(e)' },
      'log': { sig: 'log(x[, base])', param: 'x: positive real | optional base: positive real, not 1', desc: 'Logarithm; natural when base is omitted.', example: 'log(100, 10)' },
      'log10': { sig: 'log10(x)', param: 'x: positive real', desc: 'Base-10 logarithm.', example: 'log10(100)' },
      'log2': { sig: 'log2(x)', param: 'x: positive real', desc: 'Base-2 logarithm.', example: 'log2(8)' },
      'abs': { sig: 'abs(x)', param: 'x: real number', desc: 'Absolute value.', example: 'abs(-5)' },
      'sqrt': { sig: 'sqrt(x)', param: 'x: positive real', desc: 'Square root of a number.', example: 'sqrt(4)' },
      'cbrt': { sig: 'cbrt(x)', param: 'x: real number', desc: 'Real cube root.', example: 'cbrt(-8)' },
      'floor': { sig: 'floor(x)', param: 'x: real number', desc: 'Largest integer less than or equal to x.', example: 'floor(2.8)' },
      'ceil': { sig: 'ceil(x)', param: 'x: real number', desc: 'Smallest integer greater than or equal to x.', example: 'ceil(2.2)' },
      'round': { sig: 'round(x[, digits])', param: 'x: real number | optional digits: decimal places', desc: 'Rounds to the nearest value at the requested decimal place.', example: 'round(pi, 2)' },
      'min': { sig: 'min(x, ...)', param: 'one or more real numbers', desc: 'Smallest argument.', example: 'min(3, -1, 2)' },
      'max': { sig: 'max(x, ...)', param: 'one or more real numbers', desc: 'Largest argument.', example: 'max(3, -1, 2)' },
      'count': { sig: 'count(data, ...)', param: 'finite real values, a set, or a range', desc: 'Number of observations. Duplicate values in a set are already removed.', example: 'count(range(1:5, x, 4))' },
      'sum': { sig: 'sum(data, ...)', param: 'finite real values, a set, or a range', desc: 'Sum of all observations.', example: 'sum({1, 2, 3})' },
      'mean': { sig: 'mean(data, ...)', param: 'finite real values, a set, or a range', desc: 'Arithmetic mean; average() is an alias.', example: 'mean(range(0:10, x, 10))' },
      'average': { sig: 'average(data, ...)', param: 'finite real values, a set, or a range', desc: 'Alias for mean().', example: 'average({1, 2, 3})' },
      'median': { sig: 'median(data, ...)', param: 'finite real values, a set, or a range', desc: 'Middle observation; averages the two middle values for even-sized data.', example: 'median({1, 2, 9, 10})' },
      'mode': { sig: 'mode(data, ...)', param: 'finite real values, a set, or a range', desc: 'Most frequent observation; ties return the smallest tied value.', example: 'mode(1, 2, 2, 3)' },
      'variance': { sig: 'variance(data, ...)', param: 'finite real values, a set, or a range', desc: 'Population variance (divides by n).', example: 'variance(1, 2, 3)' },
      'populationvariance': { sig: 'populationVariance(data, ...)', param: 'finite real values, a set, or a range', desc: 'Alias for population variance().', example: 'populationVariance({1, 2, 3})' },
      'samplevariance': { sig: 'sampleVariance(data, ...)', param: 'at least two finite real values', desc: 'Sample variance (divides by n - 1).', example: 'sampleVariance(1, 2, 3)' },
      'stddev': { sig: 'stddev(data, ...)', param: 'finite real values, a set, or a range', desc: 'Population standard deviation; standardDeviation() is an alias.', example: 'stddev(1, 2, 3)' },
      'standarddeviation': { sig: 'standardDeviation(data, ...)', param: 'finite real values, a set, or a range', desc: 'Alias for population standard deviation.', example: 'standardDeviation(1, 2, 3)' },
      'samplestddev': { sig: 'sampleStdDev(data, ...)', param: 'at least two finite real values', desc: 'Sample standard deviation (uses n - 1).', example: 'sampleStdDev(1, 2, 3)' },
      'samplestandarddeviation': { sig: 'sampleStandardDeviation(data, ...)', param: 'at least two finite real values', desc: 'Alias for sample standard deviation.', example: 'sampleStandardDeviation(1, 2, 3)' },
      'quantile': { sig: 'quantile(data, p)', param: 'data: values, set, or range | p: probability in [0, 1]', desc: 'Linearly interpolated quantile using position p * (n - 1).', example: 'quantile({1, 2, 9, 10}, 0.5)' },
      'percentile': { sig: 'percentile(data, p)', param: 'data: values, set, or range | p: percentile in [0, 100]', desc: 'Linearly interpolated percentile; equivalent to quantile(data, p / 100).', example: 'percentile(range(1:5, x, 4), 25)' },
      'trunc': { sig: 'trunc(x)', param: 'x: real number', desc: 'Rounds toward zero.', example: 'trunc(-2.8)' },
      'sign': { sig: 'sign(x)', param: 'x: real number', desc: 'Returns -1, 0, or 1 according to the sign of x.', example: 'sign(-4)' },
      'pow': { sig: 'pow(x, y)', param: 'x, y: real numbers', desc: 'Raises x to the power y; equivalent to x^y.', example: 'pow(2, 3)' },
      'hypot': { sig: 'hypot(x, y, ...)', param: 'two or more real numbers', desc: 'Square root of the sum of squared arguments.', example: 'hypot(3, 4)' },
      'clamp': { sig: 'clamp(x, minimum, maximum)', param: 'x, minimum, maximum: real numbers', desc: 'Restricts x to the inclusive interval [minimum, maximum].', example: 'clamp(12, 0, 10)' },
        'type': { sig: 'type(value)', param: 'one expression or variable', desc: 'Returns the runtime type: number, complex, string, boolean, null, set, range, array, function, or a class name.', example: 'type(30 + 2.5)' },
        'type': { sig: 'type(value)', param: 'one expression or variable', desc: 'Returns the runtime type: number, complex, string, null, set, range, array, function, or the class name of an instance. Comparisons return number.', example: 'type(30 + 2.5)' },
        'plot': { sig: 'plot(yValues) | plot(x, y [, fig = 1])', param: 'a numeric point, or sets/ranges of coordinates with matching lengths | fig: optional chart group key', desc: 'Plots a point, a sequence of y-values against their indices, or paired x/y values in the time-domain chart. Repeated fig keys share a figure selector.', example: 'plot({0, 1, 2}, {2, 5, 3}, fig = 1)' },
      'deg': { sig: 'deg(x)', param: 'x: radians', desc: 'Converts radians to degrees.', example: 'deg(pi)' },
      'rad': { sig: 'rad(x)', param: 'x: degrees', desc: 'Converts degrees to radians.', example: 'rad(180)' },
      'asinh': { sig: 'asinh(x)', param: 'x: real number', desc: 'Inverse hyperbolic sine.', example: 'asinh(1)' },
      'acosh': { sig: 'acosh(x)', param: 'x: real number >= 1', desc: 'Inverse hyperbolic cosine.', example: 'acosh(2)' },
      'atanh': { sig: 'atanh(x)', param: 'x: value in (-1, 1)', desc: 'Inverse hyperbolic tangent.', example: 'atanh(0.5)' },
      'i': { sig: 'i', param: 'imaginary unit', desc: 'Complex constant with i^2 = -1.', example: 'sqrt(-1) == i' },
      'real': { sig: 'real(z)', param: 'complex number z', desc: 'Returns the real component of z.', example: 'real(2 + 3*i)' },
      'imag': { sig: 'imag(z)', param: 'complex number z', desc: 'Returns the imaginary component of z.', example: 'imag(2 + 3*i)' },
      'conj': { sig: 'conj(z)', param: 'complex number z', desc: 'Returns the complex conjugate of z.', example: 'conj(2 + 3*i)' },
      'arg': { sig: 'arg(z)', param: 'complex number z', desc: 'Returns the principal argument of z in radians.', example: 'arg(i)' },
      'range': { sig: 'range(start:stop, variable, steps)', param: 'start, stop: finite bounds | variable: identifier label | steps: positive integer intervals', desc: 'Returns steps + 1 evenly spaced samples including both endpoints (descending when start > stop). The variable is descriptive only and is not assigned.', example: 'range(0:1, x, 4)' },
      'class': { sig: 'class Name { field = value; function constructor(...) { ... } }', param: 'per-instance fields, methods, and optional constructor', desc: 'Declares a class. Field initializers run separately for each instance before its constructor.', example: 'class Point { x = null; function constructor(x) { this.x = x; } }' },
      'new': { sig: 'new ClassName(arguments)', param: 'class name and constructor arguments', desc: 'Creates an independent class instance and selects a constructor overload by argument count.', example: 'p = new Point(3, 4);' },
      'constructor': { sig: 'function constructor(...) { ... }', param: 'an instance initializer; overloads must have distinct parameter counts', desc: 'Runs after fields initialize. The matching overload is chosen from the arguments passed to new.', example: 'function constructor(x) { this.x = x; }' },
      'this': { sig: 'this.field', param: 'the current object inside a class method or constructor', desc: 'Reads or writes a field on the current instance.', example: 'this.x = x;' },
      'function': { sig: 'function name(parameters) { ... }', param: 'function name and optional parameters', desc: 'Declares a reusable function. Inside a class, function declarations define methods.', example: 'function square(x) { return x^2; }' },
      'fn': { sig: 'fn name(parameters) { ... }', param: 'alias for function', desc: 'Declares a reusable function.', example: 'fn square(x) { return x^2; }' },
      'if': { sig: 'if (condition) { ... }', param: 'condition: a comparison, chained comparison, or other expression', desc: 'Runs the block when the condition is truthy. Comparisons evaluate to 1 or 0.', example: 'if (0 < x < 10) { print(x); }' },
      'else': { sig: 'else { ... }', param: 'optional branch following if', desc: 'Runs when the preceding if condition is false.', example: 'if (x > 0) { print(x); } else { print(0); }' },
      'while': { sig: 'while (condition) { ... }', param: 'condition tested before each iteration', desc: 'Repeats the block while its condition is truthy.', example: 'while (x < 3) { x = x + 1; }' },
      'for': { sig: 'for (init; condition; update) { ... }', param: 'classic counted loop or for name in iterable', desc: 'Repeats a block with an optional counter, or iterates over a range or set.', example: 'for (let k = 0; k < 3; k = k + 1) { print(k); }' },
      'switch': { sig: 'switch (value) { case value: ... default: ... }', param: 'one value compared with case labels', desc: 'Runs the first matching case, or default when none match. Use break to stop a case.', example: 'switch (n) { case 1: print("one"); break; default: print("other"); }' },
      'case': { sig: 'case value:', param: 'a value label inside switch', desc: 'Begins a switch branch when its value equals the switched value.', example: 'case 1: print("one"); break;' },
      'default': { sig: 'default:', param: 'optional final switch branch', desc: 'Runs when no case value matches.', example: 'default: print("other"); break;' },
      'break': { sig: 'break', param: 'valid inside loops and switch cases', desc: 'Exits the nearest loop or switch.', example: 'if (x == 3) { break; }' },
      'continue': { sig: 'continue', param: 'valid inside loops', desc: 'Skips to the next loop iteration.', example: 'if (x == 0) { continue; }' },
      'return': { sig: 'return expression', param: 'valid inside a function or method', desc: 'Ends the current function and returns a value.', example: 'return x^2;' },
      'let': { sig: 'let name = expression', param: 'new mutable variable', desc: 'Declares and assigns a variable.', example: 'let total = 0;' },
      'print': { sig: 'print(value, ...)', param: 'zero or more values', desc: 'Writes values to the terminal output.', example: 'print("sum:", 2 + 3);' },
      'in': { sig: 'value in set', param: 'value and finite set', desc: 'Tests whether a value belongs to a set; returns 1 or 0.', example: '2 in {1, 2, 3}' },
      'belongsto': { sig: 'value belongsto set', param: 'alias for in', desc: 'Tests set membership; the symbol âˆˆ is also accepted.', example: '2 âˆˆ {1, 2, 3}' },
      'forall': { sig: 'forall(variable, finiteSet, condition)', param: 'variable: identifier bound to each set element | condition: expression returning truthy or false', desc: 'Returns 1 when every element satisfies the condition; the symbol âˆ€ is an alias. Empty finite sets satisfy forall vacuously.', example: 'forall(x, {1, 2, 3}, x > 0)' },
      'âˆ€': { sig: 'âˆ€(variable, finiteSet, condition)', param: 'finite set and a condition evaluated once per element', desc: 'Universal quantifier alias for forall().', example: 'âˆ€(x, {1, 2, 3}, 0 < x < 4)' },
      'mod': { sig: 'left mod right', param: 'real operands', desc: 'Returns the remainder after division.', example: '10 mod 3' },
      'null': { sig: 'null', param: 'empty value', desc: 'Represents no value; none is an alias.', example: 'x = null;' },
      'none': { sig: 'none', param: 'empty value', desc: 'Alias for null.', example: 'x = none;' },
      'otherwise': { sig: 'otherwise', param: 'fallback condition in a piecewise expression', desc: 'Selects the final piecewise branch when no earlier condition matches.', example: 'y = { 1: x > 0, 0: otherwise };' },
      'rect': {
        sig: 'rect(t)',
        param: 't: continuous real time variable',
        desc: 'Unit rectangular pulse function: 1 when |t| <= 0.5, else 0.',
        example: 'x = rect(t / 2);'
      },
      'sinc': {
        sig: 'sinc(t)',
        param: 't: continuous real variable',
        desc: 'Normalized cardinal sine: sin(pi*t)/(pi*t). sinc(0) = 1.',
        example: 'x = sinc(2 * t);'
      },
      'delta': {
        sig: 'delta(t - t0)',
        param: 't0: time shift offset',
        desc: 'Dirac delta distribution: sampled signals use a normalized approximation; integrate() applies its impulse contribution.',
        example: 'area = integrate(delta(t - 1), t, 0, 2);'
      },
      'u': {
        sig: 'u(t)',
        param: 't: continuous real variable',
        desc: 'Heaviside unit step function: 1 for t >= 0, else 0.',
        example: 'x = u(t) - u(t - 3);'
      },
      'tri': {
        sig: 'tri(t)',
        param: 't: continuous real variable',
        desc: 'Symmetric triangular pulse: (1 - |t|) for |t| <= 1.',
        example: 'x = tri(t / 2);'
      },
      'ramp': {
        sig: 'ramp(t)',
        param: 't: continuous real variable',
        desc: 'Unit ramp: t for t > 0, otherwise 0.',
        example: 'x = ramp(t);'
      },
      'heaviside': { sig: 'heaviside(t)', param: 'real input', desc: 'Unit step: 0 below zero and 1 at or above zero.', example: 'heaviside(t - 1)' },
      'sawtooth': { sig: 'sawtooth(t [, period])', param: 'real input | optional positive period (default tau)', desc: 'Rising periodic ramp from -1 to 1.', example: 'sawtooth(t, tau)' },
      'square': { sig: 'square(t [, duty])', param: 'real phase | optional duty fraction in [0, 1] (default 0.5)', desc: 'Periodic two-level waveform with values -1 and 1.', example: 'square(omega*t, 0.25)' },
      'pulse': { sig: 'pulse(t [, width])', param: 'real input | optional positive width (default 1)', desc: 'Centered unit pulse.', example: 'pulse(t, 4)' },
      'signum': { sig: 'signum(t)', param: 'real input', desc: 'Sign function returning -1, 0, or 1.', example: 'signum(t)' },
      'union': {
        sig: 'A union B',
        param: 'A, B: finite sets',
        desc: 'Set union operation returning distinct elements across both sets.',
        example: '{1, 2} union {2, 3}'
      },
      'intersect': {
        sig: 'A intersect B',
        param: 'A, B: finite sets',
        desc: 'Set intersection operation returning common elements.',
        example: '{1, 2} intersect {2, 3}'
      },
      'diff_set': {
        sig: 'A diff B',
        param: 'A, B: finite sets',
        desc: 'Relative complement / set difference removing elements of B from A.',
        example: '{1, 2, 3} diff {2}'
      },
      'omega': {
        sig: 'omega',
        param: 'angular frequency constant',
        desc: 'Angular frequency symbol Ï‰ (initialized to default 1.0 or user-assigned).',
        example: 'x = sin(omega * t);'
      },
      'pi': {
        sig: 'pi',
        param: 'mathematical constant',
        desc: 'Archimedes constant Ï€ â‰ˆ 3.1415926535...',
        example: 'x = cos(2 * pi * t);'
      },
      'e': {
        sig: 'e',
        param: 'mathematical constant',
        desc: 'Euler\'s number e â‰ˆ 2.7182818284...',
        example: 'exp(1) == e'
      },
      'phi': {
        sig: 'phi (Ï†)',
        param: 'mathematical constant',
        desc: 'Golden ratio Ï† = (1 + sqrt(5)) / 2.',
        example: 'phi^2 == phi + 1'
      },
      'inf': {
        sig: 'inf (âˆž)',
        param: 'positive infinity',
        desc: 'IEEE positive infinity, useful for limits and comparisons.',
        example: 'inf > 1e100'
      },
      'and': {
        sig: 'condition and condition',
        param: 'conditions: numeric or boolean values',
        desc: 'Logical conjunction; evaluates the right side only when the left side is true.',
        example: 'x > 0 and x < 1'
      },
      'or': {
        sig: 'condition or condition',
        param: 'conditions: numeric or boolean values',
        desc: 'Logical disjunction; evaluates the right side only when the left side is false.',
        example: 'x < 0 || x > 1'
      },
      'not': {
        sig: 'not condition',
        param: 'condition: numeric or boolean value',
        desc: 'Logical negation.',
        example: 'not (x == 0)'
      }
    };

    /* ==========================================================================
       2. AUTO-SUGGESTION CATALOG
       ========================================================================== */
    const SUGGESTIONS = [
      { name: 'diff', type: 'calculus', snippet: 'diff(, t, at = null)' },
      { name: 'integrate', type: 'calculus', snippet: 'integrate(, t, 0, pi)' },
        { name: 'plot', type: 'plot', snippet: 'plot()' },
      { name: 'ft', type: 'transform', snippet: 'ft(, t, omega)' },
      { name: 'fs', type: 'series', snippet: 'fs(, t, tau, 1)' },
      { name: 'rect', type: 'signal', snippet: 'rect(t)' },
      { name: 'sinc', type: 'signal', snippet: 'sinc(t)' },
      { name: 'delta', type: 'signal', snippet: 'delta(t)' },
      { name: 'tri', type: 'signal', snippet: 'tri(t)' },
      { name: 'u', type: 'signal', snippet: 'u(t)' },
      { name: 'ramp', type: 'signal', snippet: 'ramp(t)' },
      { name: 'heaviside', type: 'signal', snippet: 'heaviside(t)' },
      { name: 'sawtooth', type: 'signal', snippet: 'sawtooth(t, tau)' },
      { name: 'square', type: 'signal', snippet: 'square(omega*t)' },
      { name: 'pulse', type: 'signal', snippet: 'pulse(t)' },
      { name: 'signum', type: 'signal', snippet: 'signum(t)' },
      { name: 'sin', type: 'function', snippet: 'sin()' },
      { name: 'cos', type: 'function', snippet: 'cos()' },
      { name: 'tan', type: 'function', snippet: 'tan()' },
        { name: 'sec', type: 'function', snippet: 'sec()' },
        { name: 'csc', type: 'function', snippet: 'csc()' },
        { name: 'cot', type: 'function', snippet: 'cot()' },
      { name: 'asin', type: 'function', snippet: 'asin()' },
      { name: 'acos', type: 'function', snippet: 'acos()' },
      { name: 'atan', type: 'function', snippet: 'atan()' },
      { name: 'atan2', type: 'function', snippet: 'atan2(, )' },
      { name: 'sinh', type: 'function', snippet: 'sinh()' },
      { name: 'cosh', type: 'function', snippet: 'cosh()' },
      { name: 'tanh', type: 'function', snippet: 'tanh()' },
      { name: 'exp', type: 'function', snippet: 'exp()' },
      { name: 'ln', type: 'function', snippet: 'ln()' },
      { name: 'log', type: 'function', snippet: 'log()' },
      { name: 'log10', type: 'function', snippet: 'log10()' },
      { name: 'log2', type: 'function', snippet: 'log2()' },
      { name: 'abs', type: 'function', snippet: 'abs()' },
      { name: 'sqrt', type: 'function', snippet: 'sqrt()' },
      { name: 'cbrt', type: 'function', snippet: 'cbrt()' },
      { name: 'floor', type: 'function', snippet: 'floor()' },
      { name: 'ceil', type: 'function', snippet: 'ceil()' },
      { name: 'round', type: 'function', snippet: 'round()' },
      { name: 'min', type: 'function', snippet: 'min()' },
      { name: 'max', type: 'function', snippet: 'max()' },
      { name: 'count', type: 'statistics', snippet: 'count()' },
      { name: 'sum', type: 'statistics', snippet: 'sum()' },
      { name: 'mean', type: 'statistics', snippet: 'mean()' },
      { name: 'average', type: 'statistics', snippet: 'average()' },
      { name: 'median', type: 'statistics', snippet: 'median()' },
      { name: 'mode', type: 'statistics', snippet: 'mode()' },
      { name: 'variance', type: 'statistics', snippet: 'variance()' },
      { name: 'populationVariance', type: 'statistics', snippet: 'populationVariance()' },
      { name: 'sampleVariance', type: 'statistics', snippet: 'sampleVariance()' },
      { name: 'stddev', type: 'statistics', snippet: 'stddev()' },
      { name: 'standardDeviation', type: 'statistics', snippet: 'standardDeviation()' },
      { name: 'sampleStdDev', type: 'statistics', snippet: 'sampleStdDev()' },
      { name: 'sampleStandardDeviation', type: 'statistics', snippet: 'sampleStandardDeviation()' },
      { name: 'quantile', type: 'statistics', snippet: 'quantile(, 0.5)' },
      { name: 'percentile', type: 'statistics', snippet: 'percentile(, 50)' },
        { name: 'trunc', type: 'function', snippet: 'trunc()' },
        { name: 'sign', type: 'function', snippet: 'sign()' },
        { name: 'pow', type: 'function', snippet: 'pow(, )' },
        { name: 'hypot', type: 'function', snippet: 'hypot(, )' },
        { name: 'clamp', type: 'function', snippet: 'clamp(, , )' },
          { name: 'type', type: 'function', snippet: 'type()' },
        { name: 'deg', type: 'function', snippet: 'deg()' },
        { name: 'rad', type: 'function', snippet: 'rad()' },
        { name: 'asinh', type: 'function', snippet: 'asinh()' },
        { name: 'acosh', type: 'function', snippet: 'acosh()' },
        { name: 'atanh', type: 'function', snippet: 'atanh()' },
        { name: 'real', type: 'complex', snippet: 'real()' },
        { name: 'imag', type: 'complex', snippet: 'imag()' },
        { name: 'conj', type: 'complex', snippet: 'conj()' },
        { name: 'arg', type: 'complex', snippet: 'arg()' },
        { name: 'i', type: 'constant', snippet: 'i' },
      { name: 'range', type: 'range', snippet: 'range(0:1, x, 10)' },
        { name: 'function', type: 'keyword', snippet: 'function name() {\n  \n}' },
      { name: 'class', type: 'keyword', snippet: 'class Name {\n  function constructor() {\n    \n  }\n}' },
      { name: 'new', type: 'keyword', snippet: 'new ClassName()' },
      { name: 'constructor', type: 'keyword', snippet: 'constructor()' },
      { name: 'this', type: 'keyword', snippet: 'this' },
      { name: 'null', type: 'keyword', snippet: 'null' },
      { name: 'none', type: 'keyword', snippet: 'none' },
        { name: 'if', type: 'keyword', snippet: 'if () {\n  \n}' },
        { name: 'else', type: 'keyword', snippet: 'else {\n  \n}' },
        { name: 'while', type: 'keyword', snippet: 'while () {\n  \n}' },
        { name: 'for', type: 'keyword', snippet: 'for (let k = 0; k < 10; k = k + 1) {\n  \n}' },
        { name: 'switch', type: 'keyword', snippet: 'switch () {\n  case :\n    break;\n  default:\n    break;\n}' },
        { name: 'case', type: 'keyword', snippet: 'case :\n  break;' },
        { name: 'default', type: 'keyword', snippet: 'default:\n  break;' },
        { name: 'return', type: 'keyword', snippet: 'return ' },
        { name: 'break', type: 'keyword', snippet: 'break' },
        { name: 'continue', type: 'keyword', snippet: 'continue' },
      { name: 'union', type: 'set', snippet: 'union ' },
      { name: 'intersect', type: 'set', snippet: 'intersect ' },
      { name: 'diff', type: 'set', snippet: 'diff ' },
      { name: 'in', type: 'operator', snippet: 'in ' },
      { name: 'mod', type: 'operator', snippet: 'mod ' },
      { name: 'and', type: 'operator', snippet: 'and ' },
      { name: 'or', type: 'operator', snippet: 'or ' },
      { name: 'not', type: 'operator', snippet: 'not ' },
      { name: 'forall', type: 'logic', snippet: 'forall(x, {1, 2, 3}, x > 0)' },
      { name: 'âˆ€', type: 'logic', snippet: 'âˆ€(x, {1, 2, 3}, x > 0)' },
      { name: 'let', type: 'keyword', snippet: 'let ' },
      { name: 'print', type: 'keyword', snippet: 'print()' },
      { name: 'omega', type: 'constant', snippet: 'omega' },
      { name: 'pi', type: 'constant', snippet: 'pi' },
      { name: 'tau', type: 'constant', snippet: 'tau' },
      { name: 'e', type: 'constant', snippet: 'e' },
      { name: 'phi', type: 'constant', snippet: 'phi' },
      { name: 'inf', type: 'constant', snippet: 'inf' },
      { name: 'fn', type: 'keyword', snippet: 'fn name(x) {\n  \n}' },
      { name: 'belongsto', type: 'operator', snippet: 'belongsto ' },
      { name: 'N', type: 'type', snippet: 'N' },
      { name: 'Z', type: 'type', snippet: 'Z' },
      { name: 'WHOLE', type: 'type', snippet: 'WHOLE' },
      { name: 'Q', type: 'type', snippet: 'Q' },
      { name: 'R', type: 'type', snippet: 'R' },
      { name: 'REAL', type: 'type', snippet: 'REAL' },
      { name: 'COMPLEX', type: 'type', snippet: 'COMPLEX' },
      { name: '+R', type: 'type', snippet: '+R' },
      { name: '-R', type: 'type', snippet: '-R' },
      { name: 'NATURAL', type: 'type', snippet: 'NATURAL' },
      { name: 'INTEGER', type: 'type', snippet: 'INTEGER' },
      { name: 'RATIONAL', type: 'type', snippet: 'RATIONAL' },
      { name: 'OPEN', type: 'constant', snippet: 'OPEN' },
      { name: 'CLOSED', type: 'constant', snippet: 'CLOSED' },
      { name: 'otherwise', type: 'keyword', snippet: 'otherwise' }
    ];

    const RESERVED_NAME_GROUPS = [
      {
        title: 'Immutable constants',
        names: ['pi', 'tau', 'e', 'phi', 'inf', 'c', 'i', 'OPEN', 'CLOSED', 'EXCLUSIVE', 'INCLUSIVE', 'âˆ€', 'âˆƒ', 'FORALL', 'EXISTS']
      },
      {
        title: 'Built-in functions',
        names: ['abs', 'acos', 'acosh', 'arg', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'average', 'cbrt', 'ceil', 'clamp', 'conj', 'cos', 'cosh', 'count', 'cot', 'csc', 'deg', 'degrees', 'delta', 'diff', 'exp', 'floor', 'forall', 'ft', 'fouriertransform', 'fs', 'fourierseries', 'heaviside', 'hypot', 'imag', 'integrate', 'ln', 'log', 'log10', 'log2', 'max', 'mean', 'median', 'min', 'mode', 'percentile', 'plot', 'populationVariance', 'pow', 'pulse', 'quantile', 'rad', 'radians', 'range', 'real', 'rect', 'round', 'ramp', 'sampleStandardDeviation', 'sampleStdDev', 'sampleVariance', 'sawtooth', 'sec', 'sign', 'signum', 'sgn', 'sin', 'sinc', 'sinh', 'sqrt', 'square', 'standardDeviation', 'stddev', 'step', 'sum', 'tan', 'tanh', 'tri', 'trunc', 'type', 'u', 'variance']
      },
      {
        title: 'Mathematical types',
        names: ['+R', '-R', 'COMPLEX', 'NATURAL', 'N', 'WHOLE', 'INTEGER', 'Z', 'RATIONAL', 'Q', 'REAL', 'R', 'âˆ€', 'FORALL']
      },
      {
        title: 'Language keywords and operators',
        names: ['and', 'belongsto', 'break', 'case', 'class', 'constructor', 'continue', 'default', 'diff', 'else', 'for', 'fn', 'function', 'if', 'in', 'intersect', 'let', 'mod', 'new', 'none', 'not', 'null', 'or', 'otherwise', 'print', 'return', 'switch', 'this', 'union', 'while', 'where', 'given', 'forall', 'exists']
      }
    ];
    const MATH_SET_TYPE_NAMES = new Set(['N', 'NATURAL', 'WHOLE', 'Z', 'INTEGER', 'Q', 'RATIONAL', 'R', 'REAL', 'COMPLEX', '+R', '-R']);
    const SINGLE_LETTER_IMMUTABLES = new Set(['e', 'i', 'c']);
    const RESERVED_NAMES = new Set(RESERVED_NAME_GROUPS
      .filter(group => !['Mathematical types', 'Immutable constants'].includes(group.title))
      .flatMap(group => group.names.map(name => name.toLowerCase())));
    const CASE_SENSITIVE_RESERVED_NAMES = new Set([
      ...RESERVED_NAME_GROUPS.filter(group => ['Mathematical types', 'Immutable constants'].includes(group.title)).flatMap(group => group.names),
      'pi', 'tau', 'e', 'phi', 'inf', 'c', 'i'
    ]);
    function isReservedName(name) {
      if (typeof name === 'string' && name.length === 1) {
        const ch = name.charCodeAt(0);
        const isLower = ch >= 97 && ch <= 122;
        if (isLower && !SINGLE_LETTER_IMMUTABLES.has(name)) return false;
      }
      return RESERVED_NAMES.has(name?.toLowerCase?.()) || CASE_SENSITIVE_RESERVED_NAMES.has(name);
    }

    class MathSet {
      constructor(name, checkFn, meta = {}) {
        this.isMathSetType = true;
        this.name = name;
        this.checkFn = checkFn;
        Object.assign(this, meta);
      }
      contains(value) { return !!this.checkFn(value); }
      toString() {
        if (this.symbol) return this.symbol;
        return this.name;
      }
    }

    function buildStandardMathSets() {
      const isFiniteReal = v => typeof v === 'number' && Number.isFinite(v);
      const isIntegerVal = v => isFiniteReal(v) && Number.isInteger(v);
      return {
        'N': new MathSet('N', v => isIntegerVal(v) && v >= 1, { symbol: 'â„•', description: 'Natural numbers (1, 2, 3, ...)' }),
        'NATURAL': new MathSet('NATURAL', v => isIntegerVal(v) && v >= 1, { symbol: 'â„•', aliasOf: 'N', description: 'Natural numbers (1, 2, 3, ...) [alias for N]' }),
        'WHOLE': new MathSet('WHOLE', v => isIntegerVal(v) && v >= 0, { symbol: 'ð•Ž', description: 'Whole numbers (0, 1, 2, ...)' }),
        'Z': new MathSet('Z', isIntegerVal, { symbol: 'â„¤', description: 'Integers ..., -2, -1, 0, 1, 2, ...' }),
        'INTEGER': new MathSet('INTEGER', isIntegerVal, { symbol: 'â„¤', aliasOf: 'Z', description: 'Integers [alias for Z]' }),
        'Q': new MathSet('Q', isFiniteReal, { symbol: 'â„š', description: 'Rational numbers (expressible as a/b)' }),
        'RATIONAL': new MathSet('RATIONAL', isFiniteReal, { symbol: 'â„š', aliasOf: 'Q', description: 'Rationals [alias for Q]' }),
        'R': new MathSet('R', isFiniteReal, { symbol: 'â„', description: 'Real numbers' }),
        'REAL': new MathSet('REAL', isFiniteReal, { symbol: 'â„', aliasOf: 'R', description: 'Reals [alias for R]' }),
        'COMPLEX': new MathSet('COMPLEX', v => isFiniteReal(v) || (v && typeof v === 'object' && v.real != null && v.imaginary != null), { symbol: 'â„‚', description: 'Complex numbers a + bÂ·i' }),
        '+R': new MathSet('+R', v => isFiniteReal(v) && v > 0, { symbol: 'â„âº', description: 'Positive reals (0, +âˆž)' }),
        '-R': new MathSet('-R', v => isFiniteReal(v) && v < 0, { symbol: 'â„â»', description: 'Negative reals (-âˆž, 0)' }),
        'OPEN': false,
        'CLOSED': true,
        'EXCLUSIVE': false,
        'INCLUSIVE': true,
        'FORALL': true,
        'âˆ€': true,
        'EXISTS': true,
        'âˆƒ': true
      };
    }
    function valueBelongsToSet(value, setValue) {
      if (setValue && setValue instanceof MathSet) return setValue.contains(value);
      if (setValue && setValue.isMathSetType === true && typeof setValue.contains === 'function') return setValue.contains(value);
      if (Array.isArray(setValue)) {
        return setValue.some(el => deepEqual(el, value));
      }
      if (setValue && setValue.values && typeof setValue.values.includes === 'function') {
        return setValue.values.includes(value) || setValue.values.some(v => deepEqual(v, value));
      }
      if (setValue && typeof setValue.contains === 'function') return !!setValue.contains(value);
      return false;
    }
    function deepEqual(a, b) {
      if (Object.is(a, b)) return true;
      if (a && b && typeof a === 'object' && typeof b === 'object') {
        if (a.real != null && a.imaginary != null && b.real != null && b.imaginary != null) {
          return a.real === b.real && a.imaginary === b.imaginary;
        }
        try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) {}
      }
      return false;
    }
    const suggestionCatalog = new Map(SUGGESTIONS.map(item => [item.name.toLowerCase(), item]));
    RESERVED_NAME_GROUPS.forEach(group => {
      const type = group.title === 'Built-in functions'
        ? 'function'
        : group.title === 'Immutable constants' ? 'constant'
        : group.title === 'Mathematical types' ? 'type' : 'keyword';
      group.names.forEach(name => {
        if (!suggestionCatalog.has(name.toLowerCase())) {
          suggestionCatalog.set(name.toLowerCase(), {
            name,
            type,
            snippet: type === 'function' ? `${name}()` : type === 'keyword' ? `${name} ` : name
          });
        }
      });
    });
    Object.entries(DOCS).forEach(([key, doc]) => {
      if (key.includes('_') || suggestionCatalog.has(key.toLowerCase())) return;
      const signatureName = doc.sig.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/)?.[1];
      const name = signatureName || key;
      suggestionCatalog.set(key.toLowerCase(), {
        name,
        type: signatureName ? 'function' : 'language',
        snippet: signatureName ? `${name}()` : name
      });
    });

    /* ==========================================================================
       3. HARDWARE RULER & ACCURATE 2D POINT SNAPPER (BOTH TIME & FREQ)
       ========================================================================== */
    let activeHoverPoint = null;

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
                        const text = `${pt.name}: (${pt.x.toFixed(3)}${pt.isFreq ? 'Hz' : 's'}, ${pt.y.toFixed(3)}${pt.isFreq ? '' : 'V'})${pt.snapType ? ` Â· ${pt.snapType}` : ''}`;
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
    const signalSnapToggle = document.getElementById('signal-snap-toggle');
    try {
      signalSnapEnabled = localStorage.getItem('axiom-ui-signal-snap') !== 'false';
    } catch {}
    signalSnapToggle.checked = signalSnapEnabled;
    signalSnapToggle.addEventListener('change', () => {
      signalSnapEnabled = signalSnapToggle.checked;
      try { localStorage.setItem('axiom-ui-signal-snap', String(signalSnapEnabled)); } catch {}
      activeHoverPoint = null;
      renderActiveChannel();
    });

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
       4. LEXER & PARSER
       ========================================================================== */
    const TT = {
      LET: 'LET', PRINT: 'PRINT', UNION: 'UNION', INTERSECT: 'INTERSECT',
      FUNCTION: 'FUNCTION', CLASS: 'CLASS', NEW: 'NEW', RETURN: 'RETURN', IF: 'IF', ELSE: 'ELSE', WHILE: 'WHILE', FOR: 'FOR',
      SWITCH: 'SWITCH', CASE: 'CASE', DEFAULT: 'DEFAULT', BREAK: 'BREAK', CONTINUE: 'CONTINUE',
      INCREMENT: 'INCREMENT', DECREMENT: 'DECREMENT',
      AND: 'AND', OR: 'OR', NOT: 'NOT', OTHERWISE: 'OTHERWISE',
      BELONGS_TO: 'BELONGS_TO', IN: 'IN', NULL: 'NULL',
      ARROW: 'ARROW', ELLIPSIS: 'ELLIPSIS', TRUE: 'TRUE', FALSE: 'FALSE', LBRACKET: '[', RBRACKET: ']',
      IDENTIFIER: 'IDENTIFIER', NUMBER: 'NUMBER', STRING: 'STRING',
      PLUS: '+', MINUS: '-', MUL: '*', DIV: '/', MOD: '%', POW: '^',
      ASSIGN: '=', COLON: ':', QUESTION: '?', SEMICOLON: ';', COMMA: ',', DOT: '.',
      LPAREN: '(', RPAREN: ')', LBRACE: '{', RBRACE: '}',
      EQ: '==', NEQ: '!=', LT: '<', GT: '>', LTE: '<=', GTE: '>=', EOF: 'EOF'
    };

    class Lexer {
      constructor(src) { this.src = src; this.pos = 0; this.line = 1; this.column = 1; this.c = src[0] || null; }
      advance() {
        if (this.c === '\n') { this.line++; this.column = 1; }
        else this.column++;
        this.pos++;
        this.c = this.pos < this.src.length ? this.src[this.pos] : null;
      }
      peek() { return this.pos + 1 < this.src.length ? this.src[this.pos + 1] : null; }
      tokenize() {
        const tokens = [];
        while (this.c !== null) {
          if (/\s/.test(this.c)) { this.advance(); continue; }
          if (this.c === '#') {
            while (this.c !== null && this.c !== '\n') this.advance();
            continue;
          }
          const location = { offset: this.pos, line: this.line, column: this.column };
          const pushToken = token => tokens.push({ ...token, ...location });
          if (this.src.slice(this.pos, this.pos + 3) === '...') {
            this.advance(); this.advance(); this.advance();
            pushToken({ type: TT.ELLIPSIS, value: '...' });
            continue;
          }
          if (this.c === 'âˆ€') { this.advance(); pushToken({ type: TT.IDENTIFIER, value: 'forall' }); continue; }
          if (this.c === '"' || this.c === "'") { pushToken(this.readString()); continue; }
          if (/\d/.test(this.c) || (this.c === '.' && /\d/.test(this.peek() || ''))) { pushToken(this.readNumber()); continue; }
          if (/[a-zA-Z_Ï€Ï‰Ï„â„â„¤â„•Î´Î”Î©Î¦Ï†Î Î¤â„¯]/.test(this.c)) { pushToken(this.readId()); continue; }

          const c = this.c;
          if ((c === '+' || c === '-') && this.peek() === c) {
            this.advance();
            this.advance();
            pushToken({ type: c === '+' ? TT.INCREMENT : TT.DECREMENT, value: c + c });
            continue;
          }
          if (c === '-' && this.peek() === '>') {
            this.advance();
            this.advance();
            pushToken({ type: TT.ARROW, value: '->' });
            continue;
          }
          if (c === '&' && this.peek() === '&') { this.advance(); this.advance(); pushToken({ type: TT.AND, value: 'and' }); continue; }
          if (c === '|' && this.peek() === '|') { this.advance(); this.advance(); pushToken({ type: TT.OR, value: 'or' }); continue; }
          if (c === '=' && this.peek() === '=') { this.advance(); this.advance(); pushToken({ type: TT.EQ, value: '==' }); continue; }
          if (c === '!' && this.peek() === '=') { this.advance(); this.advance(); pushToken({ type: TT.NEQ, value: '!=' }); continue; }
          if (c === '!') { this.advance(); pushToken({ type: TT.NOT, value: 'not' }); continue; }
          if (c === '<' && this.peek() === '=') { this.advance(); this.advance(); pushToken({ type: TT.LTE, value: '<=' }); continue; }
          if (c === '>' && this.peek() === '=') { this.advance(); this.advance(); pushToken({ type: TT.GTE, value: '>=' }); continue; }
          if (c === 'â‰¤') { this.advance(); pushToken({ type: TT.LTE, value: '<=' }); continue; }
          if (c === 'â‰¥') { this.advance(); pushToken({ type: TT.GTE, value: '>=' }); continue; }
          if (c === 'â‰ ') { this.advance(); pushToken({ type: TT.NEQ, value: '!=' }); continue; }
          if (c === 'âˆˆ') { this.advance(); pushToken({ type: TT.BELONGS_TO, value: 'belongsTo' }); continue; }
          if (c === 'Ã—' || c === 'Â·') { this.advance(); pushToken({ type: TT.MUL, value: '*' }); continue; }
          if (c === 'Ã·') { this.advance(); pushToken({ type: TT.DIV, value: '/' }); continue; }
          if (c === 'âˆ’') { this.advance(); pushToken({ type: TT.MINUS, value: '-' }); continue; }
          if (c === 'âˆž') { this.advance(); pushToken({ type: TT.IDENTIFIER, value: 'inf' }); continue; }
          if (c === '*' && this.peek() === '*') { this.advance(); this.advance(); pushToken({ type: TT.POW, value: '^' }); continue; }

          const singles = {
            '+': TT.PLUS, '-': TT.MINUS, '*': TT.MUL, '/': TT.DIV, '%': TT.MOD, '^': TT.POW,
            '=': TT.ASSIGN, ':': TT.COLON, '?': TT.QUESTION, ';': TT.SEMICOLON, ',': TT.COMMA, '.': TT.DOT,
            '[': TT.LBRACKET, ']': TT.RBRACKET,
            '(': TT.LPAREN, ')': TT.RPAREN, '{': TT.LBRACE, '}': TT.RBRACE,
            '<': TT.LT, '>': TT.GT
          };
          if (singles[c]) {
            pushToken({ type: singles[c], value: c });
            this.advance();
            continue;
          }
          throw new Error(`Unexpected character '${c}'`);
        }
        tokens.push({ type: TT.EOF, value: '', offset: this.pos, line: this.line, column: this.column });
        return tokens;
      }
      readNumber() {
        let r = '';
        while (this.c !== null && /[\d.]/.test(this.c)) { r += this.c; this.advance(); }
        if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(r)) throw new Error(`Invalid number literal '${r}'`);
        return { type: TT.NUMBER, value: parseFloat(r) };
      }
      readString() {
        const quote = this.c;
        this.advance();
        let r = '';
        while (this.c !== null && this.c !== quote) {
          if (this.c === '\\' && this.peek() !== null) {
            this.advance();
            const escapes = { n: '\n', r: '\r', t: '\t' };
            r += escapes[this.c] ?? this.c;
          } else {
            r += this.c;
          }
          this.advance();
        }
        if (this.c !== quote) throw new Error('Unterminated string literal');
        this.advance();
        return { type: TT.STRING, value: r };
      }
      readId() {
        let r = '';
        while (this.c !== null && /[a-zA-Z0-9_Ï€Ï‰Ï„â„â„¤â„•Î´Î”Î©Î¦Ï†Î Î¤â„¯]/.test(this.c)) { r += this.c; this.advance(); }
        if (['Ï€', 'Î '].includes(r)) return { type: TT.IDENTIFIER, value: 'pi' };
        if (['Ï‰', 'Î©'].includes(r)) return { type: TT.IDENTIFIER, value: 'omega' };
        if (['Ï„', 'Î¤'].includes(r)) return { type: TT.IDENTIFIER, value: 'tau' };
        if (['Ï†', 'Î¦'].includes(r)) return { type: TT.IDENTIFIER, value: 'phi' };
        if (r === 'â„¯') return { type: TT.IDENTIFIER, value: 'e' };
        const lower = r.toLowerCase();
        if (lower === 'null' || lower === 'none') return { type: TT.NULL, value: null };
        if (lower === 'true') return { type: TT.TRUE, value: true };
        if (lower === 'false') return { type: TT.FALSE, value: false };
        const kw = {
          'let': TT.LET, 'print': TT.PRINT, 'function': TT.FUNCTION, 'fn': TT.FUNCTION,
          'class': TT.CLASS, 'new': TT.NEW,
          'return': TT.RETURN, 'if': TT.IF, 'else': TT.ELSE, 'while': TT.WHILE, 'for': TT.FOR,
          'switch': TT.SWITCH, 'case': TT.CASE, 'default': TT.DEFAULT,
          'break': TT.BREAK, 'continue': TT.CONTINUE, 'belongsto': TT.BELONGS_TO, 'in': TT.IN,
          'union': TT.UNION, 'intersect': TT.INTERSECT, 'mod': TT.MOD,
          'and': TT.AND, 'or': TT.OR, 'not': TT.NOT, 'otherwise': TT.OTHERWISE
        };
        const type = Object.prototype.hasOwnProperty.call(kw, lower) ? kw[lower] : TT.IDENTIFIER;
        return { type, value: lower === 'mod' ? '%' : r };
      }
    }

    class Parser {
      constructor(tokens) { this.tokens = tokens; this.idx = 0; }
      peek() { return this.tokens[this.idx]; }
      advance() { return this.tokens[this.idx++]; }
      match(type) { if (this.peek().type === type) return this.advance(); return null; }
      expect(type, message = `Expected ${type}`) {
        const token = this.match(type);
        if (!token) throw new Error(message);
        return token;
      }

      parseProgram() {
        const stmts = [];
        while (this.peek().type !== TT.EOF) {
          const start = this.peek();
          try {
            const statement = this.parseStatement();
            Object.defineProperty(statement, 'sourceLocation', {
              value: { offset: start.offset, line: start.line, column: start.column }
            });
            stmts.push(statement);
            this.match(TT.SEMICOLON);
          } catch (error) {
            throw attachSourceLocation(error, this.peek());
          }
        }
        return stmts;
      }
      parseStatement() {
        if (this.match(TT.CLASS)) return this.parseClassDeclaration();
        if (this.match(TT.FUNCTION)) return this.parseFunctionDeclaration();
        if (this.peek().type === TT.IDENTIFIER && this.tokens[this.idx + 1]?.type === TT.COLON) {
          return this.parseTypedFunctionDeclaration();
        }
        if (this.match(TT.IF)) return this.parseIfTail();
        if (this.match(TT.WHILE)) return this.parseWhileStatement();
        if (this.match(TT.FOR)) return this.parseForStatement();
        if (this.match(TT.SWITCH)) return this.parseSwitchStatement();
        if (this.match(TT.RETURN)) {
          const value = [TT.SEMICOLON, TT.RBRACE, TT.EOF].includes(this.peek().type) ? null : this.parseExpression();
          return { type: 'ReturnStatement', value };
        }
        if (this.match(TT.BREAK)) return { type: 'BreakStatement' };
        if (this.match(TT.CONTINUE)) return { type: 'ContinueStatement' };
        if (this.match(TT.PRINT)) {
          this.match(TT.LPAREN);
          const args = [];
          if (this.peek().type !== TT.RPAREN) {
            args.push(this.parseExpression());
            while (this.match(TT.COMMA)) args.push(this.parseExpression());
          }
          this.match(TT.RPAREN);
          return { type: 'PrintStatement', args };
        }
        if (this.match(TT.LET)) {
          const id = this.advance().value;
          this.match(TT.ASSIGN);
          const expr = this.parseExpression();
          return { type: 'AssignStatement', name: id, expr };
        }
        if (this.peek().type === TT.IDENTIFIER && [TT.INCREMENT, TT.DECREMENT].includes(this.tokens[this.idx + 1]?.type)) {
          const name = this.advance().value;
          const delta = this.advance().type === TT.INCREMENT ? 1 : -1;
          return { type: 'UpdateStatement', name, delta };
        }
        if (this.peek().type === TT.IDENTIFIER && this.tokens[this.idx + 1]?.type === TT.DOT &&
            this.tokens[this.idx + 2]?.type === TT.IDENTIFIER && this.tokens[this.idx + 3]?.type === TT.ASSIGN) {
          const object = { type: 'Variable', name: this.advance().value };
          this.advance();
          const name = this.advance().value;
          this.advance();
          return { type: 'MemberAssignStatement', object, name, expr: this.parseExpression() };
        }
        if (this.peek().type === TT.IDENTIFIER && this.tokens[this.idx + 1]?.type === TT.ASSIGN) {
          const id = this.advance().value;
          this.advance();
          const expr = this.parseExpression();
          return { type: 'AssignStatement', name: id, expr };
        }
        return this.parseExpression();
      }
      parseTypedFunctionDeclaration() {
        const name = this.expect(TT.IDENTIFIER, 'typed function requires a name').value;
        this.expect(TT.COLON);
        const domain = this.parseTypeSpec();
        this.expect(TT.ARROW, 'Expected -> between function domain and range');
        const range = this.parseTypeSpec();
        this.expect(TT.COMMA, 'Expected , before typed function definition');
        const assignedName = this.expect(TT.IDENTIFIER, 'Expected function name before =').value;
        if (assignedName !== name) throw new Error(`Typed function name '${assignedName}' must match '${name}'`);
        this.expect(TT.ASSIGN, 'Expected = before typed function expression');
        return { type: 'TypedFunctionDeclaration', name, domain, range, expression: this.parseExpression() };
      }
      parseTypeSpec() {
        const opening = this.match(TT.LBRACKET) || this.match(TT.LPAREN);
        if (opening) {
          const lower = this.parseAdditive();
          this.expect(TT.COMMA, 'Expected , between interval bounds');
          const upper = this.parseAdditive();
          const closing = this.peek().type;
          if (![TT.RBRACKET, TT.RPAREN].includes(closing)) throw new Error('Expected ] or ) after interval bounds');
          this.advance();
          return {
            type: 'MathIntervalType',
            lower,
            upper,
            includeLower: opening.type === TT.LBRACKET,
            includeUpper: closing === TT.RBRACKET
          };
        }
        if ([TT.PLUS, TT.MINUS].includes(this.peek().type) && this.tokens[this.idx + 1]?.value === 'R') {
          const sign = this.advance().value;
          this.advance();
          return { type: 'MathSetType', name: `${sign}R` };
        }
        const name = this.expect(TT.IDENTIFIER, 'Expected a predefined uppercase math type or interval').value;
        if (!MATH_SET_TYPE_NAMES.has(name)) throw new Error(`Unknown math type '${name}'; use an uppercase predefined type`);
        return { type: 'MathSetType', name };
      }
      parseClassDeclaration() {
        const name = this.expect(TT.IDENTIFIER, 'class requires a name').value;
        this.expect(TT.LBRACE, 'Expected { after class name');
        const methods = [];
        const fields = [];
        const memberNames = new Set();
        const constructorSignatures = new Set();
        while (this.peek().type !== TT.RBRACE) {
          if (this.peek().type === TT.EOF) throw new Error('Unterminated class; expected }');
          if (this.match(TT.FUNCTION)) {
            const method = this.parseFunctionDeclaration(true);
            const normalizedName = method.name.toLowerCase();
            if (normalizedName === 'constructor') {
              const signature = method.parameters.map(parameter => parameter.toLowerCase()).join(',');
              if (memberNames.has(normalizedName) || constructorSignatures.has(signature)) {
                throw new Error(`Class '${name}' has duplicate constructor signature (${method.parameters.join(', ')})`);
              }
              constructorSignatures.add(signature);
            } else {
              if (memberNames.has(normalizedName)) throw new Error(`Class '${name}' has duplicate member '${method.name}'`);
              memberNames.add(normalizedName);
            }
            methods.push(method);
            this.match(TT.SEMICOLON);
          } else {
            const parseField = () => {
              const fieldName = this.expect(TT.IDENTIFIER, 'Class fields must be identifiers').value;
              const normalizedName = fieldName.toLowerCase();
              if (memberNames.has(normalizedName) || normalizedName === 'constructor') {
                throw new Error(`Class '${name}' has duplicate member '${fieldName}'`);
              }
              memberNames.add(normalizedName);
              const initializer = this.match(TT.ASSIGN)
                ? this.parseExpression()
                : { type: 'NullLiteral', value: null };
              fields.push({ name: fieldName, initializer });
            };
            parseField();
            while (this.match(TT.COMMA)) {
              if (this.peek().type === TT.FUNCTION) break;
              parseField();
            }
            if (!this.match(TT.SEMICOLON) && ![TT.FUNCTION, TT.RBRACE].includes(this.peek().type)) {
              throw new Error('Expected , or ; after class field declaration');
            }
          }
        }
        this.advance();
        return { type: 'ClassDeclaration', name, fields, methods };
      }
      parseFunctionDeclaration(allowPrintName = false) {
        const name = allowPrintName && this.peek().type === TT.PRINT
          ? this.advance().value
          : this.expect(TT.IDENTIFIER, 'function requires a name').value;
        this.expect(TT.LPAREN, 'Expected ( after function name');
        const parameters = [];
        if (this.peek().type !== TT.RPAREN) {
          parameters.push(this.expect(TT.IDENTIFIER, 'function parameters must be identifiers').value);
          while (this.match(TT.COMMA)) parameters.push(this.expect(TT.IDENTIFIER, 'function parameters must be identifiers').value);
        }
        this.expect(TT.RPAREN, 'Expected ) after function parameters');
        if (new Set(parameters.map(parameter => parameter.toLowerCase())).size !== parameters.length) {
          throw new Error(`Function '${name}' has duplicate parameters`);
        }
        return { type: 'FunctionDeclaration', name, parameters, body: this.parseBlock() };
      }
      parseBlock() {
        this.expect(TT.LBRACE, 'Expected { to begin block');
        const body = [];
        while (this.peek().type !== TT.RBRACE) {
          if (this.peek().type === TT.EOF) throw new Error('Unterminated block; expected }');
          const previousIndex = this.idx;
          body.push(this.parseStatement());
          this.match(TT.SEMICOLON);
          if (this.idx === previousIndex) throw new Error('Unable to parse block statement');
        }
        this.advance();
        return { type: 'BlockStatement', body };
      }
      parseCondition() {
        if (this.match(TT.LPAREN)) {
          const condition = this.parseExpression();
          this.expect(TT.RPAREN, 'Expected ) after condition');
          return condition;
        }
        return this.parseExpression();
      }
      parseIfTail() {
        const condition = this.parseCondition();
        const consequent = this.parseBlock();
        let alternate = null;
        if (this.match(TT.ELSE)) {
          alternate = this.match(TT.IF) ? this.parseIfTail() : this.parseBlock();
        }
        return { type: 'IfStatement', condition, consequent, alternate };
      }
      parseWhileStatement() {
        const condition = this.parseCondition();
        return { type: 'WhileStatement', condition, body: this.parseBlock() };
      }
      parseForStatement() {
        if (this.match(TT.LPAREN)) {
          const initializer = this.peek().type === TT.SEMICOLON ? null : this.parseStatement();
          this.expect(TT.SEMICOLON, 'Expected ; after for-loop initializer');
          const condition = this.peek().type === TT.SEMICOLON ? null : this.parseExpression();
          this.expect(TT.SEMICOLON, 'Expected ; after for-loop condition');
          const update = this.peek().type === TT.RPAREN ? null : this.parseStatement();
          this.expect(TT.RPAREN, 'Expected ) after for-loop header');
          return { type: 'ForStatement', initializer, condition, update, body: this.parseBlock() };
        }
        const variable = this.expect(TT.IDENTIFIER, 'for-in loop requires a variable').value;
        this.expect(TT.IN, 'Expected in after for-in loop variable');
        const iterable = this.parseExpression();
        return { type: 'ForInStatement', variable, iterable, body: this.parseBlock() };
      }
      parseSwitchStatement() {
        this.expect(TT.LPAREN, 'Expected ( after switch');
        const expression = this.parseExpression();
        this.expect(TT.RPAREN, 'Expected ) after switch expression');
        this.expect(TT.LBRACE, 'Expected { after switch expression');
        const cases = [];
        let defaultBody = null;
        while (this.peek().type !== TT.RBRACE) {
          if (this.peek().type === TT.EOF) throw new Error('Unterminated switch; expected }');
          if (this.match(TT.CASE)) {
            const test = this.parseExpression();
            this.expect(TT.COLON, 'Expected : after case value');
            cases.push({ test, body: this.parseSwitchCaseBody() });
          } else if (this.match(TT.DEFAULT)) {
            if (defaultBody) throw new Error('switch may only have one default case');
            this.expect(TT.COLON, 'Expected : after default');
            defaultBody = this.parseSwitchCaseBody();
          } else {
            throw new Error('Expected case, default, or } in switch');
          }
        }
        this.advance();
        return { type: 'SwitchStatement', expression, cases, defaultBody };
      }
      parseSwitchCaseBody() {
        const body = [];
        while (![TT.CASE, TT.DEFAULT, TT.RBRACE, TT.EOF].includes(this.peek().type)) {
          const previousIndex = this.idx;
          body.push(this.parseStatement());
          this.match(TT.SEMICOLON);
          if (this.idx === previousIndex) throw new Error('Unable to parse switch case statement');
        }
        return body;
      }
      parseExpression() { return this.parseTernary(); }
      parseTernary() {
        let cond = this.parseLogicalOr();
        if (this.match(TT.QUESTION)) {
          const trueBranch = this.parseExpression();
          this.match(TT.COLON);
          const falseBranch = this.parseExpression();
          return { type: 'TernaryExpression', cond, trueBranch, falseBranch };
        }
        return cond;
      }
      parseLogicalOr() {
        let left = this.parseLogicalAnd();
        while (this.peek().type === TT.OR) {
          this.advance();
          left = { type: 'BinaryExpression', left, op: 'or', right: this.parseLogicalAnd() };
        }
        return left;
      }
      parseLogicalAnd() {
        let left = this.parseSetOps();
        while (this.peek().type === TT.AND) {
          this.advance();
          left = { type: 'BinaryExpression', left, op: 'and', right: this.parseSetOps() };
        }
        return left;
      }
      parseSetOps() {
        let left = this.parseComparison();
        while (this.peek().type === TT.UNION || this.peek().type === TT.INTERSECT || 
              (this.peek().type === TT.IDENTIFIER && this.peek().value.toLowerCase() === 'diff' && this.tokens[this.idx + 1]?.type !== TT.LPAREN)) {
          const op = this.advance().value.toLowerCase();
          const right = this.parseComparison();
          left = { type: 'SetOpExpression', left, op, right };
        }
        return left;
      }
      parseComparison() {
        let left = this.parseAdditive();
        const compOps = [TT.LT, TT.LTE, TT.GT, TT.GTE, TT.EQ, TT.NEQ, TT.IN, TT.BELONGS_TO];
        if (compOps.includes(this.peek().type)) {
          const operands = [left];
          const operators = [];
          const embeddedAssignments = [];
          while (compOps.includes(this.peek().type)) {
            const op = this.advance();
            operators.push(op.type === TT.IN || op.type === TT.BELONGS_TO ? 'in' : op.value);
            if (this.peek().type === TT.IDENTIFIER && this.tokens[this.idx + 1]?.type === TT.ASSIGN) {
              const assignName = this.advance().value;
              this.advance();
              const assignValue = this.parseAdditive();
              embeddedAssignments.push({ name: assignName, value: assignValue });
              operands.push({ type: 'Variable', name: assignName });
            } else {
              operands.push(this.parseAdditive());
            }
          }
          let comparisonNode = operators.length === 1 
            ? { type: 'BinaryExpression', left: operands[0], op: operators[0], right: operands[1] }
            : { type: 'ChainComparison', operands, operators };
          if (embeddedAssignments.length > 0) {
            for (let i = embeddedAssignments.length - 1; i >= 0; i--) {
              const asgn = embeddedAssignments[i];
              comparisonNode = {
                type: 'SequenceExpression',
                assignments: [{ name: asgn.name, value: asgn.value }],
                result: comparisonNode
              };
            }
          }
          return comparisonNode;
        }
        return left;
      }
      parseAdditive() {
        let left = this.parseMultiplicative();
        while (this.peek().type === TT.PLUS || this.peek().type === TT.MINUS) {
          const op = this.advance().value;
          const right = this.parseMultiplicative();
          left = { type: 'BinaryExpression', left, op, right };
        }
        return left;
      }
      parseMultiplicative() {
        let left = this.parseUnary();
        while ([TT.MUL, TT.DIV, TT.MOD].includes(this.peek().type)) {
          const op = this.advance().value;
          const right = this.parseUnary();
          left = { type: 'BinaryExpression', left, op, right };
        }
        return left;
      }
      parsePower() {
        let left = this.parsePrimary();
        if (this.peek().type === TT.POW) {
          this.advance();
          const right = this.parseUnary();
          return { type: 'BinaryExpression', left, op: '^', right };
        }
        return left;
      }
      parseUnary() {
        if ([TT.PLUS, TT.MINUS].includes(this.peek().type) && this.tokens[this.idx + 1]?.value === 'R') {
          const sign = this.advance().value;
          this.advance();
          return { type: 'MathSetType', name: `${sign}R` };
        }
        if (this.peek().type === TT.MINUS || this.peek().type === TT.PLUS || this.peek().type === TT.NOT) {
          const op = this.advance().value;
          const operand = this.parseUnary();
          return op === '+' ? operand : { type: 'UnaryExpression', op: op === 'not' ? 'not' : '-', operand };
        }
        return this.parsePower();
      }
      parsePrimary() {
        const tok = this.peek();
        if (tok.type === TT.NULL) { this.advance(); return { type: 'NullLiteral', value: null }; }
        if (tok.type === TT.TRUE || tok.type === TT.FALSE) { this.advance(); return { type: 'BooleanLiteral', value: tok.type === TT.TRUE }; }
        if (tok.type === TT.NUMBER) { this.advance(); return { type: 'NumberLiteral', value: tok.value }; }
        if (tok.type === TT.STRING) { this.advance(); return { type: 'StringLiteral', value: tok.value }; }
        if (tok.type === TT.IDENTIFIER && MATH_SET_TYPE_NAMES.has(tok.value)) {
          this.advance();
          return { type: 'MathSetType', name: tok.value };
        }
        if (tok.type === TT.NEW) {
          this.advance();
          const name = this.expect(TT.IDENTIFIER, 'new requires a class name').value;
          this.expect(TT.LPAREN, 'Expected ( after class name');
          const args = [];
          if (this.peek().type !== TT.RPAREN) {
            args.push(this.parseFunctionArg());
            while (this.match(TT.COMMA)) args.push(this.parseFunctionArg());
          }
          this.expect(TT.RPAREN, 'Expected ) after constructor arguments');
          return this.parsePostfix({ type: 'NewExpression', name, args });
        }
        if (tok.type === TT.LBRACE) {
          this.advance();
          if (this.peek().type === TT.RBRACE) {
            this.match(TT.RBRACE);
            return { type: 'SetLiteral', items: [] };
          }
          const firstExpr = this.parseExpression();
          if (this.match(TT.COLON)) {
            if (firstExpr.type === 'Variable' && this.peek().type === TT.IDENTIFIER && this.tokens[this.idx + 1]?.type === TT.ASSIGN) {
              const bindingName = this.advance().value;
              this.advance();
              const expression = this.parseExpression();
              const conditions = [];
              while (this.match(TT.COMMA)) conditions.push(this.parseExpression());
              this.expect(TT.RBRACE, 'Expected } after set-builder conditions');
              return { type: 'SetComprehensionExpression', resultName: firstExpr.name, bindingName, expression, conditions };
            }
            const branches = [];
            branches.push({ value: firstExpr, condition: this.parseExpression() });
            while (this.match(TT.COMMA)) {
              const branchValue = this.parseExpression();
              if (!this.match(TT.COLON)) {
                throw new Error('Piecewise branch requires value:condition syntax');
              }
              let branchCond;
              if (this.peek().type === TT.OTHERWISE) {
                this.advance();
                branchCond = { type: 'NumberLiteral', value: 1 };
              } else {
                branchCond = this.parseExpression();
              }
              branches.push({ value: branchValue, condition: branchCond });
            }
            this.match(TT.RBRACE);
            let piecewise = branches[branches.length - 1].value;
            for (let i = branches.length - 2; i >= 0; i--) {
              piecewise = {
                type: 'TernaryExpression',
                cond: branches[i].condition,
                trueBranch: branches[i].value,
                falseBranch: piecewise
              };
            }
            return piecewise;
          } else {
            const items = [firstExpr];
            while (this.match(TT.COMMA)) {
              if (this.match(TT.ELLIPSIS)) {
                if (items.length < 2) throw new Error('An ellipsis set requires at least two starting values');
                this.expect(TT.RBRACE, 'Expected } after sequence ellipsis');
                return { type: 'SequenceSetLiteral', items };
              }
              items.push(this.parseExpression());
            }
            this.match(TT.RBRACE);
            return { type: 'SetLiteral', items };
          }
        }
        if (tok.type === TT.IDENTIFIER) {
          this.advance();
          let expression;
          if (this.match(TT.LPAREN)) {
            if (tok.value.toLowerCase() === 'range') {
              const start = this.parseAdditive();
              if (!this.match(TT.COLON)) throw new Error('range() bounds must use start:stop syntax');
              const stop = this.parseAdditive();
              if (!this.match(TT.COMMA)) throw new Error('range() expects range(start:stop, variable, steps)');
              if (this.peek().type === TT.LBRACE) {
                const flags = this.parsePrimary();
                if (flags.type !== 'SetLiteral' || flags.items.length !== 2) {
                  throw new Error('range() interval flags must be {startClosed, endClosed}, for example {true, false} or {CLOSED, OPEN}');
                }
                this.expect(TT.RPAREN, 'Expected ) after range interval flags');
                return {
                  type: 'IntervalExpression', start, stop,
                  includeStart: flags.items[0],
                  includeStop: flags.items[1]
                };
              }
              const variable = this.advance();
              if (variable.type !== TT.IDENTIFIER) throw new Error('range() variable must be an identifier');
              if (!this.match(TT.COMMA)) throw new Error('range() expects a steps argument');
              const steps = this.parseExpression();
              if (!this.match(TT.RPAREN)) throw new Error('Expected ) after range() arguments');
              return { type: 'RangeExpression', start, stop, variable: variable.value, steps };
            }
            const args = [];
            if (this.peek().type !== TT.RPAREN) {
              args.push(this.parseFunctionArg());
              while (this.match(TT.COMMA)) args.push(this.parseFunctionArg());
            }
            this.expect(TT.RPAREN, 'Expected ) after function arguments');
            expression = { type: 'FunctionCall', name: tok.value, args };
          } else {
            expression = { type: 'Variable', name: tok.value };
          }
          return this.parsePostfix(expression);
        }
        if (this.match(TT.LPAREN)) {
          const expr = this.parseExpression();
          this.match(TT.RPAREN);
          return expr;
        }
        throw new Error(`Unexpected token '${tok.value}'`);
      }
      parseFunctionArg() {
        if (this.peek().type === TT.IDENTIFIER && this.tokens[this.idx + 1]?.type === TT.ASSIGN) {
          const argName = this.advance().value;
          this.advance();
          const expr = this.parseExpression();
          return { ...expr, argName };
        }
        return this.parseExpression();
      }
      parsePostfix(expression) {
        while (this.match(TT.DOT)) {
          const name = this.peek().type === TT.PRINT
            ? this.advance().value
            : this.expect(TT.IDENTIFIER, 'Expected a property or method name after .').value;
          if (this.match(TT.LPAREN)) {
            const args = [];
            if (this.peek().type !== TT.RPAREN) {
              args.push(this.parseFunctionArg());
              while (this.match(TT.COMMA)) args.push(this.parseFunctionArg());
            }
            this.expect(TT.RPAREN, 'Expected ) after method arguments');
            expression = { type: 'MethodCallExpression', object: expression, name, args };
          } else {
            expression = { type: 'MemberExpression', object: expression, name };
          }
        }
        return expression;
      }
    }


    function sourceLocationAt(source, offset) {
      const prefix = source.slice(0, Math.max(0, offset));
      const lines = prefix.split('\n');
      return { offset, line: lines.length, column: lines[lines.length - 1].length + 1 };
    }

    function attachSourceLocation(error, location) {
      const locatedError = error instanceof Error ? error : new Error(String(error));
      if (!locatedError.sourceLocation) {
        const resolved = location?.line ? location : { line: 1, column: 1 };
        locatedError.sourceLocation = resolved;
        locatedError.message += ` (line ${resolved.line}, column ${resolved.column})`;
      }
      return locatedError;
    }

    function parseSource(source) {
      const lexer = new Lexer(source);
      let tokens;
      try {
        tokens = lexer.tokenize();
      } catch (error) {
        throw attachSourceLocation(error, sourceLocationAt(source, lexer.pos));
      }
      return new Parser(tokens).parseProgram();
    }
    /* ==========================================================================
       5. SYMBOLIC ENGINE (REDUCTION & TEXTBOOK DISPLAY FORMATTING)
       ========================================================================== */
    class SymbolicEngine {
      static num(v) { return { type: 'NumberLiteral', value: v }; }
      static symVar(name) { return { type: 'Variable', name }; }
      static bin(left, op, right) { return { type: 'BinaryExpression', left, op, right }; }
      static fn(name, args) { return { type: 'FunctionCall', name, args }; }

      static areNodesIdentical(a, b) {
        if (!a || !b || a.type !== b.type) return false;
        if (a.type === 'NumberLiteral') return Math.abs(a.value - b.value) < 1e-9;
        if (a.type === 'Variable') return a.name === b.name;
        if (a.type === 'FunctionCall') {
          return a.name.toLowerCase() === b.name.toLowerCase() && 
                 a.args.length === b.args.length && 
                 a.args.every((arg, i) => this.areNodesIdentical(arg, b.args[i]));
        }
        if (a.type === 'BinaryExpression') {
          return a.op === b.op && 
                 this.areNodesIdentical(a.left, b.left) && 
                 this.areNodesIdentical(a.right, b.right);
        }
        return false;
      }

      static diff(node, varName) {
        try {
          switch (node.type) {
            case 'NumberLiteral': return this.num(0);
            case 'Variable': return this.num(node.name === varName ? 1 : 0);
            case 'UnaryExpression':
              if (node.op === '-') return this.bin(this.num(-1), '*', this.diff(node.operand, varName));
              return this.diff(node.operand, varName);
            case 'TernaryExpression': {
              const dTrue = this.diff(node.trueBranch, varName);
              const dFalse = this.diff(node.falseBranch, varName);
              return { type: 'TernaryExpression', cond: node.cond, trueBranch: dTrue, falseBranch: dFalse };
            }
            case 'BinaryExpression': {
              const u = node.left, v = node.right;
              const du = this.diff(u, varName), dv = this.diff(v, varName);
              if (node.op === '+') return this.bin(du, '+', dv);
              if (node.op === '-') return this.bin(du, '-', dv);
              if (node.op === '*') return this.bin(this.bin(du, '*', v), '+', this.bin(u, '*', dv));
              if (node.op === '/') {
                return this.bin(this.bin(this.bin(du, '*', v), '-', this.bin(u, '*', dv)), '/', this.bin(v, '^', this.num(2)));
              }
              if (node.op === '^') {
                if (v.type === 'NumberLiteral') {
                  return this.bin(this.bin(this.num(v.value), '*', this.bin(u, '^', this.num(v.value - 1))), '*', du);
                } else if (u.type === 'NumberLiteral') {
                  return this.bin(this.bin(node, '*', this.fn('ln', [u])), '*', dv);
                } else {
                  const term1 = this.bin(dv, '*', this.fn('ln', [u]));
                  const term2 = this.bin(this.bin(v, '*', du), '/', u);
                  return this.bin(node, '*', this.bin(term1, '+', term2));
                }
              }
              if (['<', '<=', '>', '>=', '==', '!=', 'and', 'or', 'in'].includes(node.op)) {
                return this.num(0);
              }
              break;
            }
            case 'ChainComparison': {
              const middle = node.operands[1];
              const lowerOperator = node.operators[0];
              const upperOperator = node.operators[1];
              const isIntervalIndicator = node.operands.length === 3 && middle?.type === 'Variable' &&
                middle.name === varName && ['<', '<='].includes(lowerOperator) && ['<', '<='].includes(upperOperator);
              if (isIntervalIndicator) {
                const variable = this.symVar(varName);
                const lowerImpulse = this.fn('delta', [this.bin(variable, '-', node.operands[0])]);
                const upperImpulse = this.fn('delta', [this.bin(variable, '-', node.operands[2])]);
                return this.bin(lowerImpulse, '-', upperImpulse);
              }
              return this.num(0);
            }
            case 'SetLiteral':
              return this.num(0);
            case 'NullLiteral':
              return this.num(0);
            case 'StringLiteral':
              return this.num(0);
            case 'FunctionCall': {
              const name = node.name.toLowerCase();
              if (name === 'integrate') {
                const integrationVariable = node.args[1]?.name || 't';
                const hasFreeVariable = (expression, targetName, boundName = null) => {
                  if (!expression) return false;
                  if (expression.type === 'Variable') return expression.name === targetName && expression.name !== boundName;
                  if (expression.type === 'BinaryExpression') return hasFreeVariable(expression.left, targetName, boundName) || hasFreeVariable(expression.right, targetName, boundName);
                  if (expression.type === 'UnaryExpression') return hasFreeVariable(expression.operand, targetName, boundName);
                  if (expression.type === 'TernaryExpression') return hasFreeVariable(expression.cond, targetName, boundName) || hasFreeVariable(expression.trueBranch, targetName, boundName) || hasFreeVariable(expression.falseBranch, targetName, boundName);
                  if (expression.type === 'FunctionCall') return expression.args.some(argument => hasFreeVariable(argument, targetName, boundName));
                  if (expression.type === 'ChainComparison') return expression.operands.some(operand => hasFreeVariable(operand, targetName, boundName));
                  if (expression.type === 'SetLiteral') return expression.items.some(item => hasFreeVariable(item, targetName, boundName));
                  return false;
                };
                const boundsDependOnVariable = node.args.slice(2).some(bound => hasFreeVariable(bound, varName));
                const integrandDependsOnVariable = hasFreeVariable(node.args[0], varName, integrationVariable);
                if (!boundsDependOnVariable && !integrandDependsOnVariable) return this.num(0);
                return this.num(0);
              }
              if (name === 'diff') {
                return this.num(0);
              }
              const u = node.args[0];
              const du = u ? this.diff(u, varName) : this.num(0);
              let outer;
              if (name === 'sin') outer = this.fn('cos', [u]);
              else if (name === 'cos') outer = this.bin(this.num(-1), '*', this.fn('sin', [u]));
              else if (name === 'tan') outer = this.bin(this.fn('sec', [u]), '^', this.num(2));
              else if (name === 'sec') outer = this.bin(this.bin(this.fn('sec', [u]), '*', this.fn('tan', [u])), '*', this.num(1));
              else if (name === 'csc') outer = this.bin(this.num(-1), '*', this.bin(this.fn('csc', [u]), '*', this.fn('cot', [u])));
              else if (name === 'cot') outer = this.bin(this.num(-1), '*', this.bin(this.fn('csc', [u]), '^', this.num(2)));
              else if (name === 'exp') outer = this.fn('exp', [u]);
              else if (name === 'ln') outer = this.bin(this.num(1), '/', u);
              else if (name === 'log') {
                const base = node.args[1] ? node.args[1] : { type: 'NumberLiteral', value: Math.E };
                outer = this.bin(this.num(1), '/', this.bin(u, '*', this.fn('ln', [base])));
              }
              else if (name === 'log10') outer = this.bin(this.num(1), '/', this.bin(u, '*', this.fn('ln', [{ type: 'NumberLiteral', value: 10 }])));
              else if (name === 'log2') outer = this.bin(this.num(1), '/', this.bin(u, '*', this.fn('ln', [{ type: 'NumberLiteral', value: 2 }])));
              else if (name === 'sqrt') outer = this.bin(this.num(0.5), '/', this.fn('sqrt', [u]));
              else if (name === 'cbrt') outer = this.bin(this.num(1/3), '/', this.bin(this.fn('cbrt', [u]), '^', this.num(2)));
              else if (name === 'abs') outer = this.bin(this.fn('sign', [u]), '*', du);
              else if (name === 'sign' || name === 'signum' || name === 'sgn') outer = this.num(0);
              else if (name === 'asin') outer = this.bin(this.num(1), '/', this.fn('sqrt', [this.bin(this.num(1), '-', this.bin(u, '^', this.num(2)))]));
              else if (name === 'acos') outer = this.bin(this.num(-1), '/', this.fn('sqrt', [this.bin(this.num(1), '-', this.bin(u, '^', this.num(2)))]));
              else if (name === 'atan') outer = this.bin(this.num(1), '/', this.bin(this.num(1), '+', this.bin(u, '^', this.num(2))));
              else if (name === 'atan2') {
                const y = node.args[0], x = node.args[1];
                const dy = this.diff(y, varName), dx = this.diff(x, varName);
                const denom = this.bin(this.bin(x, '^', this.num(2)), '+', this.bin(y, '^', this.num(2)));
                return this.bin(this.bin(this.bin(x, '*', dy), '-', this.bin(y, '*', dx)), '/', denom);
              }
              else if (name === 'sinh') outer = this.fn('cosh', [u]);
              else if (name === 'cosh') outer = this.fn('sinh', [u]);
              else if (name === 'tanh') outer = this.bin(this.num(1), '-', this.bin(this.fn('tanh', [u]), '^', this.num(2)));
              else if (name === 'asinh') outer = this.bin(this.num(1), '/', this.fn('sqrt', [this.bin(this.bin(u, '^', this.num(2)), '+', this.num(1))]));
              else if (name === 'acosh') outer = this.bin(this.num(1), '/', this.fn('sqrt', [this.bin(this.bin(u, '^', this.num(2)), '-', this.num(1))]));
              else if (name === 'atanh') outer = this.bin(this.num(1), '/', this.bin(this.num(1), '-', this.bin(u, '^', this.num(2))));
              else if (name === 'floor' || name === 'ceil' || name === 'trunc' || name === 'round') outer = this.num(0);
              else if (name === 'min' || name === 'max') {
                return this.num(0);
              }
              else if (name === 'u' || name === 'step' || name === 'heaviside') outer = this.fn('delta', [u]);
              else if (name === 'rect' || name === 'pulse' || name === 'tri' || name === 'ramp' || name === 'sinc' ||
                       name === 'sawtooth' || name === 'square' || name === 'delta') {
                return this.num(0);
              }
              else if (name === 'real' || name === 'imag' || name === 'conj' || name === 'arg') {
                return this.num(0);
              }
              else if (name === 'deg' || name === 'degrees') outer = { type: 'NumberLiteral', value: 180 / Math.PI };
              else if (name === 'rad' || name === 'radians') outer = { type: 'NumberLiteral', value: Math.PI / 180 };
              else if (name === 'clamp') {
                return this.num(0);
              }
              else if (name === 'hypot') {
                return this.num(0);
              }
              else if (name === 'pow') {
                const base = node.args[0], exp = node.args[1];
                return this.diff(this.bin(base, '^', exp), varName);
              }
              else {
                return this.num(0);
              }
              if (name === 'abs') return outer;
              return this.bin(outer, '*', du);
            }
          }
        } catch (e) {
          return this.num(0);
        }
        return this.num(0);
      }

      static simplify(node) {
        if (!node) return null;
        if (node.type === 'NumberLiteral' || node.type === 'Variable') return node;

        if (node.type === 'SequenceExpression') {
          return {
            type: 'SequenceExpression',
            assignments: node.assignments?.map(a => ({ name: a.name, value: this.simplify(a.value) })),
            result: this.simplify(node.result)
          };
        }

        if (node.type === 'TernaryExpression') {
          const cond = this.simplify(node.cond);
          const trueBranch = this.simplify(node.trueBranch);
          const falseBranch = this.simplify(node.falseBranch);
          if (cond.type === 'NumberLiteral') {
            return cond.value !== 0 ? trueBranch : falseBranch;
          }
          return { type: 'TernaryExpression', cond, trueBranch, falseBranch };
        }

        if (node.type === 'UnaryExpression') {
          const op = this.simplify(node.operand);
          if (op.type === 'NumberLiteral') return this.num(-op.value);
          if (op.type === 'UnaryExpression' && op.op === '-') return op.operand;
          return { type: 'UnaryExpression', op: node.op, operand: op };
        }

        if (node.type === 'FunctionCall') {
          return this.fn(node.name, node.args.map(a => this.simplify(a)));
        }

        if (node.type === 'BinaryExpression') {
          const l = this.simplify(node.left);
          const r = this.simplify(node.right);
          const op = node.op;

          if (op === '/' && this.areNodesIdentical(l, r)) return this.num(1);
          if (op === '-' && this.areNodesIdentical(l, r)) return this.num(0);

          if (op === '^' && r.type === 'NumberLiteral') {
            if (r.value === 1) return l;
            if (r.value === 0) return this.num(1);
          }

          if (l.type === 'NumberLiteral' && r.type === 'NumberLiteral') {
            if (op === '+') return this.num(l.value + r.value);
            if (op === '-') return this.num(l.value - r.value);
            if (op === '*') return this.num(l.value * r.value);
            if (op === '/') return this.num(l.value / r.value);
            if (op === '%') return this.num(l.value % r.value);
            if (op === '^') return this.num(Math.pow(l.value, r.value));
          }

          if (op === '*') {
            if ((l.type === 'NumberLiteral' && l.value === 0) || (r.type === 'NumberLiteral' && r.value === 0)) return this.num(0);
            if (l.type === 'NumberLiteral' && l.value === 1) return r;
            if (r.type === 'NumberLiteral' && r.value === 1) return l;

            if (l.type === 'NumberLiteral' && r.type === 'BinaryExpression' && r.op === '*' && r.left.type === 'NumberLiteral') {
              return this.simplify(this.bin(this.num(l.value * r.left.value), '*', r.right));
            }
            if (r.type === 'NumberLiteral' && l.type !== 'NumberLiteral') {
              return this.simplify(this.bin(r, '*', l));
            }
          }

          if (op === '/') {
            if (l.type === 'NumberLiteral' && l.value === 0) return this.num(0);
            if (r.type === 'NumberLiteral' && r.value === 1) return l;

            if (r.type === 'NumberLiteral' && l.type === 'BinaryExpression' && l.op === '*' && l.left.type === 'NumberLiteral') {
              const folded = l.left.value / r.value;
              return folded === 1 ? l.right : (folded === -1 ? this.bin(this.num(-1), '*', l.right) : this.bin(this.num(folded), '*', l.right));
            }
          }

          if (op === '+') {
            if (l.type === 'NumberLiteral' && l.value === 0) return r;
            if (r.type === 'NumberLiteral' && r.value === 0) return l;
          }
          if (op === '-') {
            if (r.type === 'NumberLiteral' && r.value === 0) return l;
          }

          return this.bin(l, op, r);
        }

        return node;
      }

      static toPrettyMathString(node, parentPrecedence = 0) {
        if (!node) return '';
        const prec = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };

        switch (node.type) {
          case 'NumberLiteral': return Number(node.value.toFixed(4)).toString();
          case 'Variable': return node.name;
          case 'SequenceExpression': {
            const asgnStrs = (node.assignments || []).map(a =>
              `${a.name} = ${this.toPrettyMathString(a.value, 0)}`
            );
            const resultStr = this.toPrettyMathString(node.result, 0);
            return [...asgnStrs, resultStr].join('; ');
          }
          case 'TernaryExpression': {
            const c = this.toPrettyMathString(node.cond, 0);
            const t = this.toPrettyMathString(node.trueBranch, 0);
            const f = this.toPrettyMathString(node.falseBranch, 0);
            return `(${c} ? ${t} : ${f})`;
          }
          case 'UnaryExpression': return `-${this.toPrettyMathString(node.operand, 4)}`;
          case 'FunctionCall': return `${node.name}(${node.args.map(a => this.toPrettyMathString(a, 0)).join(', ')})`;
          case 'BinaryExpression': {
            const myPrec = prec[node.op] || 0;

            if (node.op === '+' && (node.right.type === 'UnaryExpression' || 
                (node.right.type === 'BinaryExpression' && node.right.op === '*' && node.right.left.type === 'NumberLiteral' && node.right.left.value < 0))) {
              const positiveRight = (node.right.type === 'UnaryExpression')
                ? node.right.operand
                : { ...node.right, left: this.num(Math.abs(node.right.left.value)) };
              return `${this.toPrettyMathString(node.left, 1)} - ${this.toPrettyMathString(positiveRight, 1)}`;
            }

            if (node.op === '*' && node.left.type === 'NumberLiteral' && node.left.value === -1) {
              return `-${this.toPrettyMathString(node.right, myPrec)}`;
            }

            let lStr = this.toPrettyMathString(node.left, myPrec);
            let rStr = this.toPrettyMathString(node.right, myPrec);

            if (node.op === '/' && node.left.type === 'BinaryExpression') lStr = `(${lStr})`;
            if (node.op === '^') return `(${lStr})^${rStr}`;

            const out = (node.op === '*' && node.left.type === 'NumberLiteral')
              ? `${lStr}${rStr}`
              : `${lStr} ${node.op} ${rStr}`;

            return (myPrec < parentPrecedence) ? `(${out})` : out;
          }
        }
        return '';
      }
    }

    /* ==========================================================================
       6. INTERPRETER
       ========================================================================== */
