/* ==========================================================================
       1. EXTENSIVE HOVER DOCUMENTATION DATA
       ========================================================================== */
    const DOCS = {
      'diff': {
        sig: 'diff(expr, target [, at])',
        param: 'expr: formula | target: variable or compound (e.g., t or (t^2)/2) | at: optional evaluation point',
        desc: 'Computes an analytical derivative. With at, evaluates at that point; without at, returns a symbolic function.',
        example: 'diff(x^7 + cos((t^2)/2), (t^2)/2, at = 2)'
      },
      'formula': {
        sig: 'formula(expr)',
        param: 'expr: expression, symbolic value, or derivative',
        desc: 'Returns [formula AST, evaluated value]. Supported built-ins expand to their definitions; elementary calls remain structured AST nodes for further processing.',
        example: 'coefficient = formula(fs(wave(t), t, tau, 1)); print(coefficient[0])'
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
      'abs': { sig: '|x| or abs(x)', param: 'x: real or complex value', desc: 'Absolute value (modulus) returns a non-negative magnitude. In assignment form, |x| = a stores the solutions in x as an array: [-a, a] when a > 0, [0] when a = 0, and [] when a < 0.', example: '|x| = 5; print(x[0], x[1]); # -5, 5' },
      'sqrt': { sig: 'sqrt(x)', param: 'x: positive real', desc: 'Square root of a number.', example: 'sqrt(4)' },
      'cbrt': { sig: 'cbrt(x)', param: 'x: real number', desc: 'Real cube root.', example: 'cbrt(-8)' },
      'floor': { sig: 'floor(x)', param: 'x: real number', desc: 'Largest integer less than or equal to x.', example: 'floor(2.8)' },
      'ceil': { sig: 'ceil(x)', param: 'x: real number', desc: 'Smallest integer greater than or equal to x.', example: 'ceil(2.2)' },
      'round': { sig: 'round(x[, digits])', param: 'x: real number | optional digits: decimal places', desc: 'Rounds to the nearest value at the requested decimal place.', example: 'round(pi, 2)' },
      'min': { sig: 'min(x, ...)', param: 'one or more real numbers', desc: 'Smallest argument.', example: 'min(3, -1, 2)' },
      'max': { sig: 'max(x, ...)', param: 'one or more real numbers', desc: 'Largest argument.', example: 'max(3, -1, 2)' },
      'count': { sig: 'count(data, ...)', param: 'finite real values, a set, or a range', desc: 'Number of observations. Duplicate values in a set are already removed.', example: 'count(range(1:5, x, 4))' },
      'sum': { sig: 'sum(data, ...)', param: 'finite real values, a set, or a range', desc: 'Sum of all observations.', example: 'sum({1, 2, 3})' },
      'mean': { sig: 'mean(data, ...)', param: 'finite real values, a set, or a range', desc: 'Arithmetic mean.', example: 'mean(range(0:10, x, 10))' },
      'median': { sig: 'median(data, ...)', param: 'finite real values, a set, or a range', desc: 'Middle observation; averages the two middle values for even-sized data.', example: 'median({1, 2, 9, 10})' },
      'mode': { sig: 'mode(data, ...)', param: 'finite real values, a set, or a range', desc: 'Most frequent observation; ties return the smallest tied value.', example: 'mode(1, 2, 2, 3)' },
      'variance': { sig: 'variance(data, ...)', param: 'finite real values, a set, or a range', desc: 'Population variance (divides by n).', example: 'variance(1, 2, 3)' },
      'samplevariance': { sig: 'sampleVariance(data, ...)', param: 'at least two finite real values', desc: 'Sample variance (divides by n - 1).', example: 'sampleVariance(1, 2, 3)' },
      'stddev': { sig: 'stddev(data, ...)', param: 'finite real values, a set, or a range', desc: 'Population standard deviation.', example: 'stddev(1, 2, 3)' },
      'samplestddev': { sig: 'sampleStdDev(data, ...)', param: 'at least two finite real values', desc: 'Sample standard deviation (uses n - 1).', example: 'sampleStdDev(1, 2, 3)' },
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
      'random': { sig: 'random()', param: 'no arguments', desc: 'Returns a fresh pseudo-random real number in the interval [0, 1).', example: 'r = random();' },
      'class': { sig: 'class Name { field = value; function constructor(...) { ... } }', param: 'per-instance fields, methods, and optional constructor', desc: 'Declares a class. Field initializers run separately for each instance before its constructor.', example: 'class Point { x = null; function constructor(x) { this.x = x; } }' },
      'new': { sig: 'new ClassName(arguments)', param: 'class name and constructor arguments', desc: 'Creates an independent class instance and selects a constructor overload by argument count.', example: 'p = new Point(3, 4);' },
      'constructor': { sig: 'function constructor(...) { ... }', param: 'an instance initializer; overloads must have distinct parameter counts', desc: 'Runs after fields initialize. The matching overload is chosen from the arguments passed to new.', example: 'function constructor(x) { this.x = x; }' },
      'this': { sig: 'this.field', param: 'the current object inside a class method or constructor', desc: 'Reads or writes a field on the current instance.', example: 'this.x = x;' },
      'function': { sig: 'function name(parameters) { ... }', param: 'function name and optional parameters', desc: 'Declares a reusable function. Inside a class, function declarations define methods.', example: 'function square(x) { return x^2; }' },
      'fn': { sig: 'fn name(parameters) { ... }', param: 'alias for function', desc: 'Declares a reusable function.', example: 'fn square(x) { return x^2; }' },
      'if': { sig: 'if (condition) { ... }', param: 'condition: a comparison, chained comparison, or other expression', desc: 'Runs the block when the condition is truthy. Comparisons evaluate to 1 or 0.', example: 'if (0 < x < 10) { print(x); }' },
      'else': { sig: 'else { ... }', param: 'optional branch following if', desc: 'Runs when the preceding if condition is false.', example: 'if (x > 0) { print(x); } else { print(0); }' },
      'while': { sig: 'while (condition) { ... }', param: 'condition tested before each iteration', desc: 'Repeats the block while its condition is truthy.', example: 'while (x < 3) { x = x + 1; }' },
      'for': { sig: 'for (init; condition; update) { ... }', param: 'classic counted loop or for name in iterable', desc: 'Repeats a block with an optional counter, or iterates over a range or set. Compound updates such as +=, -=, *=, and /= are supported.', example: 'for (let k = 0; k < 3; k += 1) { print(k); }' },
      'switch': { sig: 'switch (value) { case value: ... default: ... }', param: 'one value compared with case labels', desc: 'Runs the first matching case, or default when none match. Use break to stop a case.', example: 'switch (n) { case 1: print("one"); break; default: print("other"); }' },
      'case': { sig: 'case value:', param: 'a value label inside switch', desc: 'Begins a switch branch when its value equals the switched value.', example: 'case 1: print("one"); break;' },
      'default': { sig: 'default:', param: 'optional final switch branch', desc: 'Runs when no case value matches.', example: 'default: print("other"); break;' },
      'break': { sig: 'break', param: 'valid inside loops and switch cases', desc: 'Exits the nearest loop or switch.', example: 'if (x == 3) { break; }' },
      'continue': { sig: 'continue', param: 'valid inside loops', desc: 'Skips to the next loop iteration.', example: 'if (x == 0) { continue; }' },
      'return': { sig: 'return expression', param: 'valid inside a function or method', desc: 'Ends the current function and returns a value.', example: 'return x^2;' },
      'let': { sig: 'let name = expression', param: 'new mutable variable', desc: 'Declares and assigns a variable.', example: 'let total = 0;' },
      'print': { sig: 'print(value, ...)', param: 'zero or more values', desc: 'Writes values to the terminal output.', example: 'print("sum:", 2 + 3);' },
      'in': { sig: 'value in set', param: 'value and finite set', desc: 'Tests whether a value belongs to a set; returns 1 or 0.', example: '2 in {1, 2, 3}' },
      'is': { sig: 'value is TYPE', param: 'value and a math type such as R, Z, or COMPLEX', desc: 'Type-checking operator; returns 1 when the value belongs to the requested math type.', example: '3 is R' },
      'given': { sig: 'expression given condition', param: 'expression: the value; condition: where it is defined', desc: 'Restricts a definition. The value is used where the condition is true and the result is NaN (undefined) elsewhere.', example: 'y = 1/x given x != 0' },
      'where': { sig: 'expression where name = value, ...', param: 'name = value: local helper definitions', desc: 'Defines helper names that exist only for the expression before it. Later helpers may use earlier ones.', example: 'y = a*t + b where a = 2, b = 1' },
      'open': { sig: 'open(a, b)', param: 'a, b: real bounds', desc: 'The open interval (a, b), both ends excluded. Use it with in, or as the domain or range of a typed function.', example: 'x in open(0, 1)' },
      'closed': { sig: 'closed(a, b)', param: 'a, b: real bounds', desc: 'The closed interval [a, b], both ends included. Use it with in, or as the domain or range of a typed function.', example: 'x in closed(0, 1)' },
      'exclusive': { sig: 'exclusive(a, b)', param: 'a, b: real bounds', desc: 'Same as open(a, b): both ends excluded.', example: 'x in exclusive(0, 1)' },
      'inclusive': { sig: 'inclusive(a, b)', param: 'a, b: real bounds', desc: 'Same as closed(a, b): both ends included.', example: 'x in inclusive(0, 1)' },
      'openclosed': { sig: 'openclosed(a, b)', param: 'a, b: real bounds', desc: 'The interval (a, b]: a excluded, b included.', example: 'x in openclosed(0, 1)' },
      'closedopen': { sig: 'closedopen(a, b)', param: 'a, b: real bounds', desc: 'The interval [a, b): a included, b excluded.', example: 'x in closedopen(0, 1)' },
      'exists': { sig: 'exists(variable, finiteSet, condition)', param: 'variable: name bound to each element; finiteSet: set or range; condition: test', desc: 'Returns 1 if the condition is true for at least one element, otherwise 0.', example: 'exists(x, {1, 2, 3}, x > 2)' },
      'impulse': { sig: 'impulse(n) | impulse(values [, zeroIndex])', param: 'n: integer sample index; values: non-empty integer list; zeroIndex: position in the list that maps to n = 0 (default 0)', desc: 'With an index, returns the Kronecker delta. With an integer list, returns a discrete signal with consecutive samples centered at the list position specified by zeroIndex.', example: 'x = impulse({1, 2, 3}, 1); print(x[-1], x[0], x[1])' },
      'delay': { sig: 'delay(signal, amount)', param: 'signal: a signal or expression; amount: shift to the right', desc: 'Shifts a signal right. Continuous x(t) becomes x(t - amount); a discrete x[n] becomes x[n - amount] and needs a whole number of samples.', example: 'y = delay(x, 10)' },
      'shift': { sig: 'shift(signal, amount)', param: 'signal: a signal or expression; amount: shift to the right', desc: 'Alias of delay.', example: 'y = shift(x, 10)' },
      'conv': { sig: 'conv(x, h, window)', param: 'x, h: discrete-time signals; window: optional half-width of the sum (default 64)', desc: 'Convolution y[n] = sum of x[m]*h[n-m] for m from -window to window. Exact when both signals are zero outside that range.', example: 'y = conv(x, h)' },
      'animate': { sig: 'animate(startSignal, signalSteps)', param: 'startSignal: the initial signal; signalSteps: an ordered list of complete signal states to show next', desc: 'Displays the initial signal, then each supplied signal state in order. Use Show start, Previous step, and Next step to move through the sequence; the immediately previous state stays as a dashed comparison trace. The controls are also available in fullscreen.', example: 'x = animate(startSignal, signalSteps)' },
      'forall': { sig: 'forall(variable, finiteSet, condition)', param: 'variable: identifier bound to each set element | condition: expression returning true or false', desc: 'Returns 1 when every element satisfies the condition, otherwise 0. An empty set satisfies forall because there is no counterexample.', example: 'forall(x, {1, 2, 3}, x > 0)' },
      'mod': { sig: 'left mod right', param: 'real operands', desc: 'Returns the remainder after division.', example: '10 mod 3' },
      'null': { sig: 'null', param: 'empty value', desc: 'Represents no value.', example: 'x = null;' },
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
        desc: 'Angular frequency constant, initialized to 1.0 and available for signal expressions.',
        example: 'x = sin(omega * t);'
      },
      'pi': {
        sig: 'pi',
        param: 'mathematical constant',
        desc: 'Circle constant, approximately 3.1415926535.',
        example: 'x = cos(2 * pi * t);'
      },
      'e': {
        sig: 'e',
        param: 'mathematical constant',
        desc: 'Euler\'s number, approximately 2.7182818284; the base of the natural logarithm.',
        example: 'exp(1) == e'
      },
      'phi': {
        sig: 'phi',
        param: 'mathematical constant',
        desc: 'Golden ratio, (1 + sqrt(5)) / 2, approximately 1.61803.',
        example: 'phi^2 == phi + 1'
      },
      'inf': {
        sig: 'inf (infinity)',
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
      { name: 'diff', type: 'calculus', snippet: 'diff(, t)' },
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
      { name: 'median', type: 'statistics', snippet: 'median()' },
      { name: 'mode', type: 'statistics', snippet: 'mode()' },
      { name: 'variance', type: 'statistics', snippet: 'variance()' },
      { name: 'sampleVariance', type: 'statistics', snippet: 'sampleVariance()' },
      { name: 'stddev', type: 'statistics', snippet: 'stddev()' },
      { name: 'sampleStdDev', type: 'statistics', snippet: 'sampleStdDev()' },
      { name: 'quantile', type: 'statistics', snippet: 'quantile(, 0.5)' },
      { name: 'percentile', type: 'statistics', snippet: 'percentile(, 50)' },
        { name: 'trunc', type: 'function', snippet: 'trunc()' },
        { name: 'sign', type: 'function', snippet: 'sign()' },
        { name: 'pow', type: 'function', snippet: 'pow(, )' },
        { name: 'hypot', type: 'function', snippet: 'hypot(, )' },
        { name: 'clamp', type: 'function', snippet: 'clamp(, , )' },
          { name: 'type', type: 'function', snippet: 'type()' },
          { name: 'random', type: 'function', snippet: 'random()' },
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
      { name: 'pi', type: 'constant', snippet: 'pi' },
      { name: 'omega', type: 'constant', snippet: 'omega' },
      { name: 'tau', type: 'constant', snippet: 'tau' },
      { name: 'phi', type: 'constant', snippet: 'phi' },
      { name: 'e', type: 'constant', snippet: 'e' },
      { name: 'range', type: 'range', snippet: 'range(0:1, x, 10)' },
        { name: 'function', type: 'keyword', snippet: 'function name() {\n  \n}' },
      { name: 'class', type: 'keyword', snippet: 'class Name {\n  function constructor() {\n    \n  }\n}' },
      { name: 'new', type: 'keyword', snippet: 'new ClassName()' },
      { name: 'constructor', type: 'keyword', snippet: 'constructor()' },
      { name: 'this', type: 'keyword', snippet: 'this' },
      { name: 'null', type: 'keyword', snippet: 'null' },
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
      { name: 'is', type: 'operator', snippet: 'is ' },
      { name: 'mod', type: 'operator', snippet: 'mod ' },
      { name: 'and', type: 'operator', snippet: 'and ' },
      { name: 'or', type: 'operator', snippet: 'or ' },
      { name: 'not', type: 'operator', snippet: 'not ' },
      { name: 'exists', type: 'logic', snippet: 'exists(x, {1, 2, 3}, x > 2)' },
      { name: 'impulse', type: 'function', snippet: 'impulse(n)' },
      { name: 'delay', type: 'function', snippet: 'delay(x, 1)' },
      { name: 'conv', type: 'function', snippet: 'conv(x, h)' },
      { name: 'open', type: 'function', snippet: 'open(0, 1)' },
      { name: 'closed', type: 'function', snippet: 'closed(0, 1)' },
      { name: 'animate', type: 'function', snippet: 'animate(startSignal, signalSteps)' },
      { name: 'forall', type: 'logic', snippet: 'forall(x, {1, 2, 3}, x > 0)' },
      { name: 'let', type: 'keyword', snippet: 'let ' },
      { name: 'print', type: 'keyword', snippet: 'print()' },
      { name: 'inf', type: 'constant', snippet: 'inf' },
      { name: 'fn', type: 'keyword', snippet: 'fn name(x) {\n  \n}' },
      { name: 'N', type: 'type', snippet: 'N' },
      { name: 'Z', type: 'type', snippet: 'Z' },
      { name: 'WHOLE', type: 'type', snippet: 'WHOLE' },
      { name: 'W', type: 'type', snippet: 'W' },
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
        names: ['pi', 'tau', 'e', 'phi', 'inf', 'c', 'i', 'OPEN', 'CLOSED', 'EXCLUSIVE', 'INCLUSIVE', '\u2203', 'FORALL', 'EXISTS']
      },
      {
        title: 'Predefined values',
        names: ['omega']
      },
      {
        title: 'Built-in functions',
        names: ['abs', 'acos', 'acosh', 'arg', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cbrt', 'ceil', 'clamp', 'conj', 'cos', 'cosh', 'count', 'cot', 'csc', 'deg', 'delta', 'diff', 'exp', 'floor', 'forall', 'formula', 'ft', 'fs', 'heaviside', 'hypot', 'imag', 'integrate', 'ln', 'log', 'log10', 'log2', 'max', 'mean', 'median', 'min', 'mode', 'percentile', 'plot', 'pow', 'pulse', 'quantile', 'rad', 'range', 'real', 'rect', 'round', 'ramp', 'sampleStdDev', 'sampleVariance', 'sawtooth', 'sec', 'sign', 'signum', 'sgn', 'sin', 'sinc', 'sinh', 'sqrt', 'square', 'stddev', 'step', 'sum', 'tan', 'tanh', 'tri', 'trunc', 'type', 'u', 'variance', 'impulse', 'delay', 'shift', 'conv', 'open', 'closed', 'exclusive', 'inclusive', 'openclosed', 'closedopen', 'animate']
      },
      {
        title: 'Mathematical types',
        names: ['+R', '-R', 'COMPLEX', 'NATURAL', 'N', 'WHOLE', 'W', 'INTEGER', 'Z', 'RATIONAL', 'Q', 'REAL', 'R', 'FORALL']
      },
      {
        title: 'Language keywords and operators',
        names: ['and', 'break', 'case', 'class', 'constructor', 'continue', 'default', 'diff', 'else', 'false', 'for', 'fn', 'function', 'given', 'if', 'in', 'intersect', 'let', 'mod', 'new', 'not', 'null', 'or', 'otherwise', 'print', 'return', 'switch', 'this', 'true', 'union', 'while', 'where', 'forall', 'exists']
      }
    ];
    const RESERVED_HELP = {
      pi: 'The circle constant, approximately 3.14159. Use it for angles and periodic signals.',
      tau: 'One full turn in radians, equal to 2*pi.',
      e: 'Euler\'s number, approximately 2.71828; the base of the natural logarithm.',
      phi: 'The golden ratio, (1 + sqrt(5)) / 2.',
      omega: 'Angular frequency constant, initialized to 1.0 for signal expressions.',
      inf: 'Positive infinity. Use it as an improper integration bound or in limit comparisons.',
      c: 'The speed of light constant used by the signal tools.',
      i: 'The imaginary unit, satisfying i^2 = -1.',
      true: 'Boolean literal representing a condition that is satisfied.',
      false: 'Boolean literal representing a condition that is not satisfied.',
      open: 'Boolean interval-bound flag meaning the endpoint is excluded.',
      closed: 'Boolean interval-bound flag meaning the endpoint is included.',
      exclusive: 'Alias for OPEN: an interval endpoint is excluded.',
      inclusive: 'Alias for CLOSED: an interval endpoint is included.',
      forall: 'Returns 1 when every element of a finite set satisfies the condition; otherwise returns 0.',
      exists: 'Reserved word associated with existential quantification. The predefined uppercase constant EXISTS currently evaluates to true.',
      n: 'The natural numbers: positive integers 1, 2, 3, ...',
      natural: 'The natural numbers: positive integers 1, 2, 3, ...',
      whole: 'The whole numbers: non-negative integers 0, 1, 2, ...',
      z: 'The integers: ..., -2, -1, 0, 1, 2, ...',
      integer: 'Alias for Z, the set of all integers.',
      q: 'The rational numbers, values expressible as a ratio of integers.',
      rational: 'Alias for Q, the set of rational numbers.',
      r: 'The real numbers, including rational and irrational values.',
      real: 'Alias for R, the set of real numbers.',
      complex: 'The complex numbers, values of the form a + b*i.',
      '+r': 'The positive real numbers, values greater than zero.',
      '-r': 'The negative real numbers, values less than zero.',
      'class': 'Declares a class with per-instance fields and methods. Use new ClassName(...) to create an instance.',
      'constructor': 'Initializes a new class instance after its fields are created. Constructor overloads must have distinct argument counts.',
      'new': 'Creates an instance of a declared class and calls the matching constructor.',
      'this': 'Refers to the current class instance inside a constructor or method.',
      'function': 'Declares a named function or, inside a class, an instance method.',
      'fn': 'Short alias for function; declares a named function.',
      'if': 'Runs a block only when its condition is true or non-zero.',
      'else': 'Runs the alternative block when the preceding if condition is false.',
      'while': 'Repeats a block while its condition remains true or non-zero.',
      'for': 'Repeats a block using a counter, or visits each value in a range or set.',
      'switch': 'Selects a case whose value equals the switch expression; default handles unmatched values.',
      'case': 'Starts one value-matching branch inside a switch statement.',
      'default': 'Starts the switch branch used when no case value matches.',
      'return': 'Ends the current function or method and supplies its result.',
      'break': 'Exits the nearest loop or switch statement.',
      'continue': 'Skips the rest of the current loop pass and starts the next pass.',
      'let': 'Declares or assigns a mutable variable.',
      'print': 'Writes one or more values to the output panel.',
      'null': 'Represents an empty or absent value. Assigning it to a variable creates a symbolic variable.',
      'otherwise': 'Fallback condition for the final branch of a piecewise expression.',
      'and': 'Logical AND. The result is true only when both conditions are true.',
      'or': 'Logical OR. The result is true when either condition is true.',
      'not': 'Logical negation; turns a true condition into false and a false condition into true.',
      'in': 'Tests whether a value is a member of a set or range.',
      'is': 'Math type operator; checks whether a value belongs to a type such as R, Z, or COMPLEX.',
      'union': 'Combines two finite sets and removes duplicate elements.',
      'intersect': 'Returns the elements that appear in both finite sets.',
      'mod': 'Returns the remainder after dividing the left operand by the right operand.',
      'where': 'Reserved for conditions in mathematical notation. It is not currently parsed as a standalone operator.',
      'given': 'Restricts a value to the condition where it is defined; false conditions produce NaN.',
      'formula': 'Returns [expression AST, evaluated or symbolic value]. Supported built-ins expand to their formula definitions, and index 0 can be reused by symbolic operations.',
      'integrate': 'Numerically evaluates a definite integral. Infinite bounds require a convergent integral; a unit step over the whole real line diverges.',
      'diff': 'Differentiates an expression with respect to a variable. Use at = value to evaluate the derivative at a point.',
      'arg': 'Returns the phase angle of a complex value in radians.',
      'random': 'Returns a fresh pseudo-random real number in the interval [0, 1).',
      'conj': 'Returns the complex conjugate, changing the sign of the imaginary part.',
      'real': 'Returns the real component of a complex value.',
      'imag': 'Returns the imaginary component of a complex value.',
      'deg': 'Converts an angle from radians to degrees.',
      'rad': 'Converts an angle from degrees to radians.',
      'acosh': 'Inverse hyperbolic cosine.',
      'asinh': 'Inverse hyperbolic sine.',
      'atanh': 'Inverse hyperbolic tangent.',
      'acot': 'Inverse cotangent; returns an angle in radians.',
      'acsc': 'Inverse cosecant; returns an angle in radians.',
      'asec': 'Inverse secant; returns an angle in radians.',
      'variance': 'Measures population spread as the mean squared distance from the mean.',
      'samplevariance': 'Measures sample spread using n - 1 in the denominator; requires at least two values.',
      'stddev': 'Returns the population standard deviation, the square root of population variance.',
      'samplestddev': 'Returns sample standard deviation using n - 1 in the denominator.',
      'count': 'Counts the observations in the supplied values, set, or range.',
      'sum': 'Adds all observations in the supplied values, set, or range.',
      'mean': 'Returns the arithmetic average of the supplied observations.',
      'median': 'Returns the middle sorted observation, averaging the two middle values when needed.',
      'mode': 'Returns the most frequent observation; ties are resolved using the smallest value.',
      'quantile': 'Returns the linearly interpolated quantile for a probability from 0 to 1.',
      'percentile': 'Returns the linearly interpolated percentile for a value from 0 to 100.',
      'range': 'Builds evenly spaced values from the start through the end, including both endpoints.',
      'type': 'Returns the runtime type name of a value, such as number, formula, function, set, or object.',
      'delta': 'Models a Dirac impulse. integrate() handles its impulse contribution analytically.',
      'u': 'Heaviside unit step: 0 for t < 0 and 1 for t >= 0.',
      'step': 'Alias for u(t), the Heaviside unit step: 0 for t < 0 and 1 for t >= 0.',
      'heaviside': 'Alias for the Heaviside unit step: 0 below zero and 1 at or above zero.',
      'ramp': 'Unit ramp: max(t, 0), the integral of the unit step up to an additive constant.',
      'rect': 'Unit rectangular pulse, equal to 1 for |t| <= 0.5 and 0 elsewhere.',
      'tri': 'Unit triangular pulse, equal to 1 - |t| for |t| <= 1 and 0 elsewhere.',
      'sinc': 'Normalized cardinal sine sin(pi*x)/(pi*x), with sinc(0) = 1.',
      'sawtooth': 'Periodic rising waveform from -1 to 1; an optional period controls its cycle length.',
      'square': 'Periodic two-level waveform; an optional duty fraction controls the high portion of each cycle.',
      'pulse': 'Centered rectangular pulse with an optional width.',
      'signum': 'Returns -1 for negative inputs, 0 for zero, and 1 for positive inputs.',
      'sgn': 'Alias for sign(x); returns -1, 0, or 1 according to the sign of x.',
      'ft': 'Computes the continuous Fourier transform using exp(-i*omega*t) as its kernel.',
      'fs': 'Computes one complex Fourier-series coefficient over a period.',
    };
    RESERVED_NAME_GROUPS.forEach(group => {
      const groupType = group.title === 'Built-in functions' ? 'function'
        : group.title === 'Mathematical types' ? 'type'
        : ['Immutable constants', 'Predefined values'].includes(group.title) ? 'constant' : 'keyword';
      group.names.forEach(name => {
        const key = name.toLowerCase();
        if (DOCS[key]) return;
        const suggestion = SUGGESTIONS.find(item => item.name.toLowerCase() === key);
        const description = RESERVED_HELP[key] || (groupType === 'function'
          ? `${name}() applies the ${name} mathematical operation to its argument${name.endsWith('s') ? 's' : ''}. See the signature for the accepted inputs.`
          : groupType === 'type'
            ? `${name} identifies a mathematical set or domain and can be used in membership and type checks.`
            : groupType === 'constant'
              ? `${name} is a predefined immutable value supplied by the language.`
              : `${name} is a language keyword or operator that controls expression evaluation or program flow.`);
        DOCS[key] = {
          sig: groupType === 'function' ? (suggestion?.snippet || `${name}(...)`) : (suggestion?.snippet || name),
          param: groupType === 'function' ? 'See the signature for required and optional arguments.' : `Category: ${group.title}.`,
          desc: description,
          example: suggestion?.snippet || name
        };
      });
    });
    const MATH_TYPE_HELP = {
      N: 'Positive integers: 1, 2, 3, ...',
      NATURAL: 'Alias for N, the positive integers.',
      WHOLE: 'Non-negative integers: 0, 1, 2, ...',
      W: 'Alias for WHOLE, the non-negative integers 0, 1, 2, ...',
      Z: 'All integers: ..., -2, -1, 0, 1, 2, ...',
      INTEGER: 'Alias for Z, the set of all integers.',
      Q: 'Rational numbers that can be written as a ratio of integers.',
      RATIONAL: 'Alias for Q, the rational numbers.',
      R: 'All real numbers, including rational and irrational values.',
      REAL: 'Alias for R, the set of real numbers.',
      COMPLEX: 'Complex values of the form a + b*i, including real numbers.'
    };
    Object.entries(MATH_TYPE_HELP).forEach(([name, desc]) => {
      const symbol = ({ N: '\u2115', NATURAL: '\u2115', WHOLE: '\u{1D54E}', W: '\u{1D54E}', Z: '\u2124', INTEGER: '\u2124', Q: '\u211A', RATIONAL: '\u211A', R: '\u211D', REAL: '\u211D', COMPLEX: '\u2102' })[name];
      DOCS[name] = { sig: `${name} (${symbol})`, param: 'Use with membership tests or as a declared function domain or range.', desc, example: `value in ${name}` };
    });
    DOCS.FORALL = { sig: 'FORALL', param: 'immutable boolean constant', desc: 'Boolean value true. Use forall(variable, set, condition) to test a condition across every set element.', example: 'if (FORALL) { print("all true"); }' };
    DOCS.EXISTS = { sig: 'EXISTS', param: 'immutable boolean constant', desc: 'Boolean value true. The lowercase exists word is reserved for existential-quantifier notation.', example: 'if (EXISTS) { print("at least one"); }' };
    const MATH_SET_TYPE_NAMES = new Set(['N', 'NATURAL', 'WHOLE', 'W', 'Z', 'INTEGER', 'Q', 'RATIONAL', 'R', 'REAL', 'COMPLEX', '+R', '-R']);
    const SINGLE_LETTER_IMMUTABLES = new Set(['e', 'i', 'c']);
    const RESERVED_NAMES = new Set(RESERVED_NAME_GROUPS
      .filter(group => !['Mathematical types', 'Immutable constants', 'Predefined values'].includes(group.title))
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
        'N': new MathSet('N', v => isIntegerVal(v) && v >= 1, { symbol: '\u2115', description: 'Natural numbers (1, 2, 3, ...)' }),
        'NATURAL': new MathSet('NATURAL', v => isIntegerVal(v) && v >= 1, { symbol: '\u2115', aliasOf: 'N', description: 'Natural numbers (1, 2, 3, ...) [alias for N]' }),
        'WHOLE': new MathSet('WHOLE', v => isIntegerVal(v) && v >= 0, { symbol: '\u{1D54E}', description: 'Whole numbers (0, 1, 2, ...)' }),
        'W': new MathSet('W', v => isIntegerVal(v) && v >= 0, { symbol: '\u{1D54E}', aliasOf: 'WHOLE', description: 'Whole numbers [alias for WHOLE]' }),
        'Z': new MathSet('Z', isIntegerVal, { symbol: '\u2124', description: 'Integers ..., -2, -1, 0, 1, 2, ...' }),
        'INTEGER': new MathSet('INTEGER', isIntegerVal, { symbol: '\u2124', aliasOf: 'Z', description: 'Integers [alias for Z]' }),
        'Q': new MathSet('Q', isFiniteReal, { symbol: '\u211A', description: 'Rational numbers (expressible as a/b)' }),
        'RATIONAL': new MathSet('RATIONAL', isFiniteReal, { symbol: '\u211A', aliasOf: 'Q', description: 'Rationals [alias for Q]' }),
        'R': new MathSet('R', isFiniteReal, { symbol: '\u211D', description: 'Real numbers' }),
        'REAL': new MathSet('REAL', isFiniteReal, { symbol: '\u211D', aliasOf: 'R', description: 'Reals [alias for R]' }),
        'COMPLEX': new MathSet('COMPLEX', v => isFiniteReal(v) || (v && typeof v === 'object' && v.real != null && v.imaginary != null), { symbol: '\u2102', description: 'Complex numbers a + b\u00B7i' }),
        '+R': new MathSet('+R', v => isFiniteReal(v) && v > 0, { symbol: '\u211D\u207A', description: 'Positive reals (0, +\u221E)' }),
        '-R': new MathSet('-R', v => isFiniteReal(v) && v < 0, { symbol: '\u211D\u207B', description: 'Negative reals (-\u221E, 0)' }),
        'OPEN': false,
        'CLOSED': true,
        'EXCLUSIVE': false,
        'INCLUSIVE': true,
        'FORALL': true,
        'EXISTS': true,
        '\u2203': true
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
        : ['Immutable constants', 'Predefined values'].includes(group.title) ? 'constant'
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
