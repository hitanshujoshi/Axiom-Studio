const ERROR_LOG = {
      version: "1.0",
      createdAt: null,
      summary: { total: 0, passed: 0, failed: 0, errors: 0 },
      categories: {},
      tests: [],
      rawErrors: []
    };

    function logError(category, testId, testName, input, errorMessage, actualValue = null, expectedValue = null) {
      const entry = {
        timestamp: new Date().toISOString(),
        category,
        testId,
        testName,
        input: typeof input === 'string' ? input : JSON.stringify(input),
        errorMessage,
        actualValue: actualValue !== null ? (typeof actualValue === 'object' ? JSON.stringify(actualValue) : String(actualValue)) : null,
        expectedValue: expectedValue !== null ? (typeof expectedValue === 'object' ? JSON.stringify(expectedValue) : String(expectedValue)) : null,
        severity: "error"
      };
      ERROR_LOG.rawErrors.push(entry);
      if (!ERROR_LOG.categories[category]) ERROR_LOG.categories[category] = { total: 0, passed: 0, failed: 0 };
      ERROR_LOG.categories[category].failed++;
      ERROR_LOG.summary.failed++;
      ERROR_LOG.summary.errors++;
    }

    function logTestResult(category, testId, testName, input, passed, actualValue = null, expectedValue = null, errorMessage = null) {
      const entry = {
        timestamp: new Date().toISOString(),
        category,
        testId,
        testName,
        input: typeof input === 'string' ? input : JSON.stringify(input),
        passed,
        actualValue: actualValue !== null ? (typeof actualValue === 'object' && !isComplexNumber(actualValue) ? JSON.stringify(actualValue) : String(actualValue)) : null,
        expectedValue: expectedValue !== null ? String(expectedValue) : null,
        errorMessage
      };
      ERROR_LOG.tests.push(entry);
      ERROR_LOG.summary.total++;
      if (!ERROR_LOG.categories[category]) ERROR_LOG.categories[category] = { total: 0, passed: 0, failed: 0 };
      ERROR_LOG.categories[category].total++;
      if (passed) {
        ERROR_LOG.summary.passed++;
        ERROR_LOG.categories[category].passed++;
      } else {
        ERROR_LOG.summary.failed++;
        ERROR_LOG.categories[category].failed++;
      }
    }

    function executeCode(code) {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const stmts = parser.parseProgram();
      const interp = new Interpreter();
      stmts.forEach(s => {
        if (s.type === 'AssignStatement') {
          interp.env[s.name + '_ast'] = s.expr;
        }
      });
      let lastResult = null;
      for (const s of stmts) {
        lastResult = interp.execute(s);
      }
      return { interp, lastResult };
    }

    function assertApprox(actual, expected, tolerance = 1e-6) {
      const a = isComplexNumber(actual) ? actual.real : (typeof actual === 'number' ? actual : NaN);
      const e = typeof expected === 'number' ? expected : NaN;
      return Math.abs(a - e) < tolerance;
    }

    function assertDerivativeApprox(result, expected, tolerance = 5.1e-5) {
      const match = String(result).match(/=\s*(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(?:\s|$)/i);
      return !!match && Math.abs(Number(match[1]) - expected) <= tolerance;
    }

    function generateDerivativeCases() {
      const definitions = [
        { name: 'sin', points: [0, Math.PI / 4, -Math.PI / 2], derivative: x => Math.cos(x) },
        { name: 'cos', points: [0, Math.PI / 4, Math.PI / 2], derivative: x => -Math.sin(x) },
        { name: 'tan', points: [0, Math.PI / 6, -Math.PI / 4], derivative: x => 1 / Math.cos(x) ** 2 },
        { name: 'exp', points: [-1, 0, 1], derivative: x => Math.exp(x) },
        { name: 'ln', points: [0.5, 1, 2], derivative: x => 1 / x },
        { name: 'sinh', points: [-1, 0, 1], derivative: x => Math.cosh(x) },
        { name: 'cosh', points: [-1, 0, 1], derivative: x => Math.sinh(x) },
        { name: 'tanh', points: [-1, 0, 1], derivative: x => 1 - Math.tanh(x) ** 2 },
        { name: 'sqrt', points: [0.25, 1, 4], derivative: x => 1 / (2 * Math.sqrt(x)) }
      ];
      return definitions.flatMap(definition => definition.points.map((point, index) => {
        const input = Number(point.toPrecision(12)).toString();
        const expected = definition.derivative(point);
        return {
          id: `diff-gen-${definition.name}-${index + 1}`,
          name: `d/dx ${definition.name}(x) at ${input}`,
          code: `r = diff(${definition.name}(x), x, at = ${input});`,
          check: result => assertDerivativeApprox(result.interp.env.r, expected),
          expect: `about ${formatRoundedValue(expected, 4)}`
        };
      }));
    }

    function runTestSuite() {
      ERROR_LOG.createdAt = new Date().toISOString();
      ERROR_LOG.summary = { total: 0, passed: 0, failed: 0, errors: 0 };
      ERROR_LOG.categories = {};
      ERROR_LOG.tests = [];
      ERROR_LOG.rawErrors = [];

      const consoleBox = document.getElementById('console');
      consoleBox.style.color = "var(--accent)";
      consoleBox.innerText = "Running comprehensive test suite...\n\n";
      let reportLines = [];

      const tests = [
        // ============ CATEGORY 1: DIFF FUNCTION IMPROVEMENTS ============
        {
          category: "DIFF - Basic Trig Derivatives",
          cases: generateDerivativeCases()
        },
        {
          category: "DIFF - Inverse Trig & Hyperbolic",
          cases: [
            { id: "diff-010", name: "d/dx asin(x) no error", code: "y = diff(asin(x), x);", check: (r) => !!r.interp.env.y, expect: "No differentiation error thrown" },
            { id: "diff-011", name: "d/dx acos(x) no error", code: "y = diff(acos(x), x);", check: (r) => !!r.interp.env.y, expect: "No differentiation error thrown" },
            { id: "diff-012", name: "d/dx atan(x) no error", code: "y = diff(atan(x), x);", check: (r) => !!r.interp.env.y, expect: "No differentiation error thrown" },
            { id: "diff-013", name: "d/dx sinh(x) = cosh", code: "r = diff(sinh(x), x, at = 0);", check: (r) => assertDerivativeApprox(r.interp.env.r, 1), expect: "cosh(0) = 1" },
            { id: "diff-014", name: "d/dx cosh(x) = sinh", code: "r = diff(cosh(x), x, at = 0);", check: (r) => assertDerivativeApprox(r.interp.env.r, 0), expect: "sinh(0) = 0" },
            { id: "diff-015", name: "d/dx tanh(x) no error", code: "y = diff(tanh(x), x);", check: (r) => !!r.interp.env.y, expect: "No differentiation error thrown" },
          ]
        },
        {
          category: "DIFF - Edge Cases & Fallbacks",
          cases: [
            { id: "diff-020", name: "diff of abs() no error", code: "y = diff(abs(x), x);", check: (r) => !!r.interp.env.y, expect: "No differentiation error thrown" },
            { id: "diff-021", name: "diff of sqrt(x) no error", code: "y = diff(sqrt(x), x);", check: (r) => !!r.interp.env.y, expect: "No differentiation error thrown" },
            { id: "diff-022", name: "diff of piecewise no error", code: "y = diff( {0: x<0, 1: x>=0}, x );", check: (r) => !!r.interp.env.y, expect: "No differentiation error thrown" },
            { id: "diff-023", name: "diff of floor no error", code: "y = diff(floor(x), x);", check: (r) => !!r.interp.env.y, expect: "No differentiation error (returns 0)" },
            { id: "diff-024", name: "diff of min/max no error", code: "y = diff(min(x, x^2), x);", check: (r) => !!r.interp.env.y, expect: "No differentiation error (returns 0)" },
            { id: "diff-025", name: "diff of sec/csc/cot no error", code: "a = diff(sec(x), x); b = diff(csc(x), x); q = diff(cot(x), x);", check: (r) => !!r.interp.env.a && !!r.interp.env.b && !!r.interp.env.q, expect: "All derivatives computed without error" },
          ]
        },
        // ============ CATEGORY 2: MATH RANGE & CHAIN COMPARISONS ============
        {
          category: "RANGE - Chain Comparisons (n<x<m)",
          cases: [
            { id: "range-001", name: "0<x<1 true at x=0.5", code: "x = 0.5; r = 0 < x < 1;", check: (r) => r.interp.env.r === 1.0, expect: "1.0 (true)" },
            { id: "range-002", name: "0<x<1 false at x=2", code: "x = 2; r = 0 < x < 1;", check: (r) => r.interp.env.r === 0.0, expect: "0.0 (false)" },
            { id: "range-003", name: "0<x<1 false at x=-1", code: "x = -1; r = 0 < x < 1;", check: (r) => r.interp.env.r === 0.0, expect: "0.0 (false)" },
            { id: "range-004", name: "0<=x<=1 true at x=0", code: "x = 0; r = 0 <= x <= 1;", check: (r) => r.interp.env.r === 1.0, expect: "1.0 (true, inclusive)" },
            { id: "range-005", name: "0<=x<=1 true at x=1", code: "x = 1; r = 0 <= x <= 1;", check: (r) => r.interp.env.r === 1.0, expect: "1.0 (true, inclusive)" },
            { id: "range-006", name: "0<x<1 false at x=0 (exclusive)", code: "x = 0; r = 0 < x < 1;", check: (r) => r.interp.env.r === 0.0, expect: "0.0 (false, exclusive <)" },
          ]
        },
        {
          category: "RANGE - Inline Assignment in Chain (0<x=10<20)",
          cases: [
            { id: "range-010", name: "0<x=10<20 assigns x=10", code: "r = 0 < x = 10 < 20;", check: (r) => r.interp.env.x === 10, expect: "x = 10" },
            { id: "range-011", name: "0<x=10<20 condition true", code: "r = 0 < x = 10 < 20;", check: (r) => r.interp.env.r === 1.0, expect: "1.0 (true, 10 in (0,20))" },
            { id: "range-012", name: "0<x=25<20 condition false", code: "r = 0 < x = 25 < 20;", check: (r) => r.interp.env.r === 0.0 && r.interp.env.x === 25, expect: "0.0 (false, x=25 assigned)" },
            { id: "range-013", name: "0<x=5<10 signal gate", code: "x = 0.5; g = 0 < x < 1; y = g * sin(omega * t);", check: (r) => r.interp.env.g === 1.0, expect: "gate = 1.0" },
            { id: "range-014", name: "chain with <= and =", code: "r = 0 <= x = 5 <= 10;", check: (r) => r.interp.env.r === 1.0 && r.interp.env.x === 5, expect: "1.0 and x=5" },
          ]
        },
        {
          category: "PIECEWISE - Conditional Var { val : cond, ... }",
          cases: [
            { id: "pw-001", name: "Basic piecewise {0:0<x<1, 1:otherwise} at x=0.5", code: "x = 0.5; y = { 0: 0<x<1, 1: otherwise };", check: (r) => r.interp.env.y === 0, expect: "y = 0" },
            { id: "pw-002", name: "Basic piecewise at x=2 (otherwise)", code: "x = 2; y = { 0: 0<x<1, 1: otherwise };", check: (r) => r.interp.env.y === 1, expect: "y = 1 (otherwise)" },
            { id: "pw-003", name: "3-branch piecewise", code: "x = 5; y = { 1: x<0, 2: 0<=x and x<10, 3: otherwise };", check: (r) => r.interp.env.y === 2, expect: "y = 2 (middle branch)" },
            { id: "pw-004", name: "piecewise value expressions", code: "x = 2; y = { x^2: x<3, 2*x: otherwise };", check: (r) => r.interp.env.y === 4, expect: "y = 2^2 = 4" },
            { id: "pw-005", name: "piecewise used as signal", code: "x = 0.3; y = { sin(x): 0<x<1, cos(x): otherwise };", check: (r) => assertApprox(r.interp.env.y, Math.sin(0.3)), expect: "sin(0.3)" },
          ]
        },
        // ============ CATEGORY 3: TERNARY OPERATOR ============
        {
          category: "TERNARY - Operator ?: ",
          cases: [
            { id: "tern-001", name: "true condition", code: "x = 1 ? 10 : 20;", check: (r) => r.interp.env.x === 10, expect: "x = 10 (true)" },
            { id: "tern-002", name: "false condition", code: "x = 0 ? 10 : 20;", check: (r) => r.interp.env.x === 20, expect: "x = 20 (false)" },
            { id: "tern-003", name: "non-1 truthy value (2)", code: "x = 2 ? 100 : 200;", check: (r) => r.interp.env.x === 100, expect: "x = 100 (2 is truthy)" },
            { id: "tern-004", name: "condition from comparison", code: "a = 5; b = a > 3 ? a*2 : a/2;", check: (r) => r.interp.env.b === 10, expect: "b = 10" },
            { id: "tern-005", name: "nested ternary (elif pattern)", code: "x = 15; r = x < 10 ? 1 : x < 20 ? 2 : 3;", check: (r) => r.interp.env.r === 2, expect: "r = 2 (middle)" },
            { id: "tern-006", name: "ternary in arithmetic", code: "x = -3; y = 2 * (x > 0 ? x : -x);", check: (r) => r.interp.env.y === 6, expect: "y = 6 (abs pattern)" },
            { id: "tern-007", name: "ternary with complex condition (and)", code: "x = 5; y = x > 0 and x < 10 ? x : -1;", check: (r) => r.interp.env.y === 5, expect: "y = 5" },
          ]
        },
        // ============ CATEGORY 4: CORE INTEGRATION CHECKS ============
        {
          category: "INTEGRATION - Core Features",
          cases: [
            { id: "int-001", name: "integrate sin from 0 to pi", code: "r = integrate(sin(t), t, 0, pi);", check: (r) => assertApprox(r.interp.env.r, 2), expect: "about 2.0" },
            { id: "int-002", name: "integrate cos from 0 to pi/2", code: "r = integrate(cos(t), t, 0, pi/2);", check: (r) => assertApprox(r.interp.env.r, 1), expect: "about 1.0" },
            { id: "int-003", name: "assigned signal AST persists", code: "z = sin(omega*t); x = z(pi);", check: (r) => typeof r.interp.env.x === 'number', expect: "x is a number" },
            { id: "int-004", name: "integrate delta across both simple roots", code: "r = integrate(delta(t^2 - 1), t, -2, 2);", check: (r) => assertApprox(r.interp.env.r, 1), expect: "1 (two roots, each contributes 1/2)" },
            { id: "int-005", name: "integrate a weighted delta impulse", code: "r = integrate((t + 2) * delta(t - 1), t, 0, 2);", check: (r) => assertApprox(r.interp.env.r, 3), expect: "3 (weight evaluated at t = 1)" },
            { id: "int-006", name: "integrate scaled delta argument", code: "r = integrate(delta(2*t - 2), t, 0, 2);", check: (r) => assertApprox(r.interp.env.r, 0.5), expect: "0.5 (Jacobian scaling)" },
            { id: "int-007", name: "integrate delta inside assigned signal", code: "y = tri(t - 2) * delta(t - 2); r = integrate(y(t), t, -2, 4);", check: (r) => assertApprox(r.interp.env.r, 1), expect: "1 (assigned signal expanded before integration)" },
          ]
        },
        {
          category: "STATISTICS - Collections and Descriptive Measures",
          cases: [
            { id: "stat-001", name: "count set and range observations", code: "r = count({1, 2, 2, 3}) + count(range(0:2, x, 2));", check: (r) => r.interp.env.r === 6, expect: "6 (sets deduplicate; ranges include endpoints)" },
            { id: "stat-002", name: "sum accepts varargs and sets", code: "r = sum(1, 2, 3) + sum({4, 5});", check: (r) => r.interp.env.r === 15, expect: "15" },
            { id: "stat-003", name: "mean accepts mixed collection and scalar", code: "r = mean({1, 2}, 3);", check: (r) => r.interp.env.r === 2, expect: "2" },
            { id: "stat-005", name: "median of odd-sized data", code: "r = median(9, 1, 5);", check: (r) => r.interp.env.r === 5, expect: "5" },
            { id: "stat-006", name: "median averages even middle pair", code: "r = median({10, 1, 2, 9});", check: (r) => r.interp.env.r === 5.5, expect: "5.5" },
            { id: "stat-007", name: "mode selects smallest value on tie", code: "r = mode(2, 1, 1, 2);", check: (r) => r.interp.env.r === 1, expect: "1" },
            { id: "stat-008", name: "variance is population variance", code: "r = variance(1, 2, 3);", check: (r) => assertApprox(r.interp.env.r, 2 / 3), expect: "2/3 (divides by n)" },
            { id: "stat-009", name: "sampleVariance uses n minus one", code: "r = sampleVariance(1, 2, 3);", check: (r) => r.interp.env.r === 1, expect: "1 (divides by n - 1)" },
            { id: "stat-011", name: "sample standard deviation", code: "r = sampleStdDev(1, 2, 3);", check: (r) => r.interp.env.r === 1, expect: "1" },
            { id: "stat-012", name: "quantile interpolates between observations", code: "r = quantile({1, 2, 9, 10}, 0.25);", check: (r) => r.interp.env.r === 1.75, expect: "1.75" },
            { id: "stat-013", name: "percentile accepts range and percent units", code: "r = percentile(range(1:5, x, 4), 25);", check: (r) => r.interp.env.r === 2, expect: "2" },
            { id: "stat-014", name: "quantile includes upper endpoint", code: "r = quantile({1, 2, 9}, 1);", check: (r) => r.interp.env.r === 9, expect: "9" },
            { id: "stat-015", name: "min and max accept ranges", code: "r = min(range(5:1, x, 4)) + max(range(5:1, x, 4));", check: (r) => r.interp.env.r === 6, expect: "6" },
            { id: "stat-016", name: "chained comparison works as statistics gate", code: "r = 0 < 5 < 10 ? mean(range(0:4, x, 4)) : -1;", check: (r) => r.interp.env.r === 2, expect: "2" },
            { id: "stat-017", name: "sum of empty data is 0", code: "r = sum({});", check: (r) => r.interp.env.r === 0, expect: "empty sum is 0" },
            { id: "stat-017b", name: "count of empty data is 0", code: "r = count({});", check: (r) => r.interp.env.r === 0, expect: "empty count is 0" },
            { id: "stat-018", name: "mean rejects complex data", code: "r = mean(i);", expectError: "finite real number", expect: "complex values are rejected" },
            { id: "stat-019", name: "sample variance requires two observations", code: "r = sampleVariance(1);", expectError: "at least two observations", expect: "sample size must be at least two" },
            { id: "stat-020", name: "quantile rejects out-of-range probability", code: "r = quantile({1, 2}, 1.1);", expectError: "between 0 and 1", expect: "probability is constrained to [0, 1]" },
            { id: "stat-021", name: "statistics reject non-finite values", code: "r = mean(inf);", expectError: "finite real number", expect: "infinity is rejected" },
            { id: "stat-022", name: "median rejects nonnumeric observations", code: "r = median({1, \"x\"});", expectError: "finite real number", expect: "strings are rejected" },
            { id: "stat-023", name: "statistics reject an unrepresentable variance", code: "r = variance(-10^200, 10^200);", expectError: "outside the finite numeric range", expect: "overflow is reported" },
            { id: "stat-024", name: "mean remains stable for extreme values", code: "r = mean(-10^200, 10^200);", check: (r) => r.interp.env.r === 0, expect: "0" },
            { id: "stat-025", name: "standard deviation remains stable for extreme values", code: "r = stddev(-10^200, 10^200);", check: (r) => assertApprox(r.interp.env.r / 1e200, 1), expect: "1e200" },
            { id: "stat-026", name: "extrema support the maximum range size", code: "r = min(range(0:100000, x, 100000)) + max(range(0:100000, x, 100000));", check: (r) => r.interp.env.r === 100000, expect: "100000" },
          ]
        },
        // ============ REGRESSION: syntax and numerics fixes ============
        {
          category: "FIXES - Operators, Numbers & Implicit Multiplication",
          cases: [
            { id: "fix-001", name: "ASCII <= works", code: "x = 3; r = x <= 5;", check: (r) => r.interp.env.r === 1, expect: "1" },
            { id: "fix-002", name: "ASCII >= works", code: "r = 3 >= 5;", check: (r) => r.interp.env.r === 0, expect: "0" },
            { id: "fix-003", name: "ASCII != works", code: "r = 1 != 2;", check: (r) => r.interp.env.r === 1, expect: "1" },
            { id: "fix-004", name: "scientific notation 1e3", code: "r = 1e3;", check: (r) => r.interp.env.r === 1000, expect: "1000" },
            { id: "fix-005", name: "scientific notation 2.5e-2", code: "r = 2.5e-2;", check: (r) => assertApprox(r.interp.env.r, 0.025, 1e-12), expect: "0.025" },
            { id: "fix-006", name: "implicit multiplication 2pi", code: "r = 2pi;", check: (r) => assertApprox(r.interp.env.r, 2 * Math.PI), expect: "6.2832" },
            { id: "fix-007", name: "implicit multiplication 2(3+1)", code: "r = 2(3+1);", check: (r) => r.interp.env.r === 8, expect: "8" },
            { id: "fix-008", name: "implicit multiplication 3x", code: "x = 4; r = 3x;", check: (r) => r.interp.env.r === 12, expect: "12" },
            { id: "fix-009", name: "implicit multiplication 2x^2 binds power first", code: "x = 3; r = 2x^2;", check: (r) => r.interp.env.r === 18, expect: "18" },
            { id: "fix-010", name: "adjacent groups multiply (1+2)(3)", code: "r = (1+2)(3);", check: (r) => r.interp.env.r === 9, expect: "9" },
            { id: "fix-011", name: "// comments", code: "r = 7; // note", check: (r) => r.interp.env.r === 7, expect: "7" },
            { id: "fix-012", name: "unclosed ( is an error", code: "r = (1 + 2;", expectError: "Expected )", expect: "error" },
            { id: "fix-013", name: "unclosed { set is an error", code: "r = {1, 2;", expectError: "Expected }", expect: "error" },
            { id: "fix-014", name: "two statements on one line need a separator", code: "x = 1 y = 2;", expectError: "Separate statements", expect: "error" },
            { id: "fix-015", name: "single-branch piecewise is NaN outside its condition", code: "n = -3; r = {5 : n>0};", check: (r) => Number.isNaN(r.interp.env.r), expect: "NaN" },
            { id: "fix-016", name: "piecewise without otherwise is NaN where no branch applies", code: "n = 0; r = {5 : n>0, 10 : n<0};", check: (r) => Number.isNaN(r.interp.env.r), expect: "NaN" },
            { id: "fix-018", name: "user function receives its arguments", code: "function area(w, h) { return w * h; } r = area(3, 4);", check: (r) => r.interp.env.r === 12, expect: "12" },
            { id: "fix-019", name: "recursive function terminates", code: "function fact(k) { if (k <= 1) { return 1; } return k * fact(k - 1); } r = fact(5);", check: (r) => r.interp.env.r === 120, expect: "120" },
            { id: "fix-020", name: "function composition", code: "function sq(a) { return a * a; } function inc(a) { return a + 1; } r = sq(inc(2));", check: (r) => r.interp.env.r === 9, expect: "9" },
            { id: "fix-017", name: "unary built-ins check their argument count", code: "r = sin();", expectError: "exactly one argument", expect: "error" }
          ]
        },
        {
          category: "FIXES - Integration, Transforms & Differentiation",
          cases: [
            { id: "fix-101", name: "wide oscillating range converges", code: "r = integrate(sin(t), t, 0, 10000);", check: (r) => assertApprox(r.interp.env.r, 1 - Math.cos(10000), 1e-6), expect: "1.95216" },
            { id: "fix-102", name: "endpoint singularity 1/sqrt(t)", code: "r = integrate(1/sqrt(t), t, 0, 1);", check: (r) => assertApprox(r.interp.env.r, 2, 1e-6), expect: "2" },
            { id: "fix-103", name: "endpoint singularity ln(t)", code: "r = integrate(ln(t), t, 0, 1);", check: (r) => assertApprox(r.interp.env.r, -1, 1e-6), expect: "-1" },
            { id: "fix-104", name: "removable singularity sin(t)/t", code: "r = integrate(sin(t)/t, t, 0, 10);", check: (r) => assertApprox(r.interp.env.r, 1.6583475942, 1e-6), expect: "1.65835" },
            { id: "fix-105", name: "improper 1/t^2 from 1 to inf", code: "r = integrate(1/t^2, t, 1, inf);", check: (r) => assertApprox(r.interp.env.r, 1, 1e-8), expect: "1" },
            { id: "fix-106", name: "divergent 1/t to inf is an error", code: "r = integrate(1/t, t, 1, inf);", expectError: "integrate()", expect: "error" },
            { id: "fix-107", name: "non-integrable singularity inside bounds is an error", code: "r = integrate(1/t, t, -1, 1);", expectError: "integrate()", expect: "error" },
            { id: "fix-108", name: "jump discontinuity u(t-0.3)", code: "r = integrate(u(t-0.3), t, 0, 1);", check: (r) => assertApprox(r.interp.env.r, 0.7, 1e-8), expect: "0.7" },
            { id: "fix-109", name: "integrate checks its arguments", code: "r = integrate(t);", expectError: "expects integrate(expression, variable, from, to)", expect: "error" },
            { id: "fix-110", name: "delta on a bound counts half so splits add up", code: "r = integrate(delta(t), t, -1, 0) + integrate(delta(t), t, 0, 1);", check: (r) => assertApprox(r.interp.env.r, 1, 1e-9), expect: "1" },
            { id: "fix-111", name: "FT of causal exponential is finite", code: "x = exp(-t)*u(t); r = FT(x(t), t, 1);", check: (r) => isComplexNumber(r.interp.env.r) && assertApprox(r.interp.env.r.real, 0.5, 1e-6) && Math.abs(r.interp.env.r.imaginary + 0.5) < 1e-6, expect: "0.5 - 0.5i" },
            { id: "fix-112", name: "FT of rect at 0 is 1", code: "r = FT(rect(t), t, 0);", check: (r) => assertApprox(r.interp.env.r, 1, 1e-8), expect: "1" },
            { id: "fix-113", name: "diff expands user functions", code: "function g(v){ return v^2; } r = diff(g(x), x, at=2);", check: (r) => assertDerivativeApprox(r.interp.env.r, 4), expect: "4" },
            { id: "fix-114", name: "diff expands typed functions", code: "f: R -> R, f = x^3; r = diff(f(x), x, at = 2);", check: (r) => assertDerivativeApprox(r.interp.env.r, 12), expect: "12" },
            { id: "fix-115", name: "diff of an unknown function is an error", code: "r = diff(foo(x), x);", expectError: "does not know how to differentiate", expect: "error" }
          ]
        },
        {
          category: "FEATURES - Keywords, Intervals & Discrete Time",
          cases: [
            { id: "kw-001", name: "given keeps the value where the condition holds", code: "x = 4; r = sqrt(x) given x >= 0;", check: (r) => r.interp.env.r === 2, expect: "2" },
            { id: "kw-002", name: "given is NaN where the condition fails", code: "x = -4; r = sqrt(x) given x >= 0;", check: (r) => Number.isNaN(r.interp.env.r), expect: "NaN" },
            { id: "kw-003", name: "where defines local helpers in order", code: "r = a*b + c where a = 2, b = a + 1, c = 4;", check: (r) => r.interp.env.r === 10, expect: "10" },
            { id: "kw-004", name: "open interval excludes its ends", code: "r = 5 in open(0, 5);", check: (r) => r.interp.env.r === 0, expect: "0" },
            { id: "kw-005", name: "closed interval includes its ends", code: "r = 5 in closed(0, 5);", check: (r) => r.interp.env.r === 1, expect: "1" },
            { id: "kw-006", name: "openclosed is (a, b]", code: "r = (0 in openclosed(0, 1)) + 10*(1 in openclosed(0, 1));", check: (r) => r.interp.env.r === 10, expect: "10" },
            { id: "kw-007", name: "open() works as a typed domain", code: "f: open(0, 1) -> R, f = x^2; r = f(1);", expectError: "outside its declared domain", expect: "error" },
            { id: "kw-008", name: "exists finds one match", code: "r = exists(k, {1, 2, 3}, k > 2);", check: (r) => r.interp.env.r === 1, expect: "1" },
            { id: "kw-009", name: "exists returns 0 when nothing matches", code: "r = exists(k, {1, 2, 3}, k > 5);", check: (r) => r.interp.env.r === 0, expect: "0" },
            { id: "dt-001", name: "discrete signal x[n] = 0.5^n*u[n]", code: "h[n] = 0.5^n * u[n]; r = h[3];", check: (r) => r.interp.env.r === 0.125, expect: "0.125" },
            { id: "dt-002", name: "discrete signal is zero before its start", code: "h[n] = 0.5^n * u[n]; r = h[-2];", check: (r) => r.interp.env.r === 0, expect: "0" },
            { id: "dt-003", name: "typed discrete signal checks its domain", code: "h[n]: N -> R, h[n] = 2*n; r = h[-1];", expectError: "outside the declared domain", expect: "error" },
            { id: "dt-004", name: "typed discrete signal checks its range", code: "h[n]: Z -> N, h[n] = -1; r = h[0];", expectError: "outside the declared range", expect: "error" },
            { id: "dt-005", name: "x[1.5] is an error", code: "x[n] = n; r = x[1.5];", expectError: "only defined for integer", expect: "error" },
            { id: "dt-006", name: "delta[n] is the Kronecker delta", code: "r = delta[0] + 10*delta[3] + 100*impulse(0);", check: (r) => r.interp.env.r === 101, expect: "101" },
            { id: "dt-013", name: "impulse list creates consecutive samples from zero", code: "x = impulse({1, 2, 3});", check: (r) => [r.interp.env.x.at(-1), r.interp.env.x.at(0), r.interp.env.x.at(1), r.interp.env.x.at(2), r.interp.env.x.at(3)].join(",") === "0,1,2,3,0", expect: "0, 1, 2, 3, 0" },
            { id: "dt-014", name: "impulse list zero index aligns the selected value with n=0", code: "x = impulse({1, 2, 3}, 1);", check: (r) => [r.interp.env.x.at(-2), r.interp.env.x.at(-1), r.interp.env.x.at(0), r.interp.env.x.at(1), r.interp.env.x.at(2)].join(",") === "0,1,2,3,0", expect: "0, 1, 2, 3, 0 at indices -2 through 2" },
            { id: "dt-015", name: "impulse list requires integer values", code: "x = impulse({1, 2.5});", expectError: "only integers", expect: "error" },
            { id: "dt-016", name: "impulse list zero index must be an integer", code: "x = impulse({1, 2}, 1.5);", expectError: "zero index must be an integer", expect: "error" },
            { id: "dt-017", name: "impulse list cannot be empty", code: "x = impulse({});", expectError: "must not be empty", expect: "error" },
            { id: "dt-007", name: "u[n] is the discrete step", code: "r = u[-1] + 10*u[0];", check: (r) => r.interp.env.r === 10, expect: "10" },
            { id: "dt-008", name: "conv of two discrete signals", code: "x[n] = delta[n] + 2*delta[n-1]; h[n] = delta[n] + delta[n-1]; y = conv(x, h); r = y[0] + 10*y[1] + 100*y[2];", check: (r) => r.interp.env.r === 231, expect: "231" },
            { id: "dt-009", name: "delay of a discrete signal", code: "x[n] = u[n]; y = delay(x, 3); r = y[2] + 10*y[3];", check: (r) => r.interp.env.r === 10, expect: "10" },
            { id: "dt-010", name: "delay of a continuous signal shifts right", code: "x = exp(-t)*u(t); t = 3; r = delay(x, 2);", check: (r) => assertApprox(r.interp.env.r, Math.exp(-1), 1e-9), expect: "0.3679" },
            { id: "dt-011", name: "delay shifts a signal built from other signals", code: "x = u(t); y = 2*x; t = 12; r = delay(y, 10);", check: (r) => r.interp.env.r === 2, expect: "2" },
            { id: "an-001", name: "animate starts from startSignal", code: "x = animate(u(t), [u(t - 1), u(t - 3)]);", check: (r) => r.interp.env.x === 1, expect: "1" },
            { id: "an-002", name: "animate selects first supplied signal step", code: "x = animate(u(t), [u(t - 1), u(t - 3)]);", check: (r) => { r.interp.env.t = 2; r.interp.animationFrame = 1; return r.interp.execute(r.interp.env.x_ast) === 1; }, expect: "1" },
            { id: "an-003", name: "animate selects later supplied signal step", code: "x = animate(u(t), [u(t - 1), u(t - 3)]);", check: (r) => { r.interp.env.t = 2; r.interp.animationFrame = 2; return r.interp.execute(r.interp.env.x_ast) === 0; }, expect: "0" },
            { id: "an-004", name: "animate accepts a named signalSteps list", code: "startSignal = u(t); signalSteps = [u(t - 2), u(t - 4)]; x = animate(startSignal, signalSteps);", check: (r) => r.interp.env.x === 1, expect: "1" },
            { id: "an-005", name: "animate rejects an empty signalSteps list", code: "x = animate(u(t), []);", expectError: "signalSteps must be a non-empty list", expect: "error" },
            { id: "an-006", name: "animate sequences discrete signals", code: "startSignal[n] = u[n]; signalSteps = [delay(startSignal, 1), delay(startSignal, 3)]; y = animate(startSignal, signalSteps);", check: (r) => { r.interp.animationFrame = 2; return r.interp.env.y.at(2) === 0; }, expect: "0" },
            { id: "an-007", name: "animate clamps to its final supplied state", code: "x = animate(u(t), [u(t - 1)]);", check: (r) => { r.interp.env.t = 2; r.interp.animationFrame = 20; return r.interp.execute(r.interp.env.x_ast) === 1; }, expect: "1" },
            { id: "dt-012", name: "type() names a discrete signal", code: "x[n] = 1; r = type(x);", check: (r) => r.interp.env.r === 'discrete signal', expect: "discrete signal" }
          ]
        },
        // ============ CATEGORY 5: STANDARD FUNCTIONS ============
        {
          category: "STDLIB - Standard Library Functions",
                    category: "TYPE - Runtime Values",
                    cases: [
                      { id: "type-001", name: "arithmetic expression returns number", code: "r = type(30 + 2.5);", check: (r) => r.interp.env.r === "number", expect: "number" },
                      { id: "type-002", name: "variable returns its runtime type", code: "value = 7; r = type(value);", check: (r) => r.interp.env.r === "number", expect: "number" },
                      { id: "type-003", name: "complex value returns complex", code: "r = type(i);", check: (r) => r.interp.env.r === "complex", expect: "complex" },
                      { id: "type-004", name: "string returns string", code: "r = type(\"hello\");", check: (r) => r.interp.env.r === "string", expect: "string" },
                      { id: "type-005", name: "null returns null", code: "r = type(null);", check: (r) => r.interp.env.r === "null", expect: "null" },
                      { id: "type-006", name: "set returns set", code: "r = type({1, 2});", check: (r) => r.interp.env.r === "set", expect: "set" },
                      { id: "type-007", name: "range returns range", code: "r = type(range(0:1, x, 2));", check: (r) => r.interp.env.r === "range", expect: "range" },
                      { id: "type-008", name: "symbolic function returns function", code: "f = diff(x^2, x); r = type(f);", check: (r) => r.interp.env.r === "function", expect: "function" },
                      { id: "type-009", name: "class instance returns class name", code: "class Point {} p = new Point(); r = type(p);", check: (r) => r.interp.env.r === "Point", expect: "Point" },
                      { id: "type-010", name: "comparison result returns number", code: "r = type(1 < 2);", check: (r) => r.interp.env.r === "number", expect: "number" },
                      { id: "type-012", name: "math type operator", code: "a = 3 is R; b = i is COMPLEX;", check: (r) => r.interp.env.a === 1 && r.interp.env.b === 1, expect: "1, 1" },
                      { id: "math-001", name: "random returns unit interval value", code: "r = random();", check: (r) => typeof r.interp.env.r === "number" && r.interp.env.r >= 0 && r.interp.env.r < 1, expect: "0 <= r < 1" },
                      { id: "math-002", name: "random rejects arguments", code: "r = random(1);", expectError: "expects no arguments", expect: "invalid arity is rejected" },
                      { id: "type-011", name: "type requires exactly one argument", code: "r = type(1, 2);", expectError: "exactly one argument", expect: "invalid arity is rejected" },
                      { id: "type-012", name: "type name cannot be reassigned", code: "type = 1;", expectError: "reserved name 'type'", expect: "built-in name is reserved" }
                    ]
                  },
                  {
                    category: "PLOT - Discrete Values",
                    cases: [
                      { id: "plot-001", name: "single number plots as x with zero y", code: "plot(10);", check: (r) => r.interp.plots[0]?.points[0]?.x === 10 && r.interp.plots[0]?.points[0]?.y === 0, expect: "(10, 0)" },
                      { id: "plot-002", name: "two numbers plot as x and y", code: "plot(10, 3);", check: (r) => r.interp.plots[0]?.points[0]?.x === 10 && r.interp.plots[0]?.points[0]?.y === 3, expect: "(10, 3)" },
                      { id: "plot-003", name: "single set plots values against indices", code: "plot({4, 7, 9});", check: (r) => JSON.stringify(r.interp.plots[0]?.points) === JSON.stringify([{x: 0, y: 4}, {x: 1, y: 7}, {x: 2, y: 9}]), expect: "three indexed points" },
                      { id: "plot-004", name: "paired ranges and sets use figure key", code: "xs = range(0:2, x, 2); ys = {1, 4, 9}; plot(xs, ys, fig = 1);", check: (r) => r.interp.plots[0]?.figure === "1" && JSON.stringify(r.interp.plots[0]?.points) === JSON.stringify([{x: 0, y: 1}, {x: 1, y: 4}, {x: 2, y: 9}]), expect: "paired coordinates in Figure 1" },
                      { id: "plot-005", name: "plots with different figure keys stay distinct", code: "plot(10, 0, fig = 1); plot(10, 3, fig = 2);", check: (r) => r.interp.plots.length === 2 && r.interp.plots[0].figure !== r.interp.plots[1].figure, expect: "two distinct figures" },
                      { id: "plot-006", name: "mismatched coordinate lengths are rejected", code: "plot({1, 2}, {3});", expectError: "same number of points", expect: "x/y lengths must match" },
                      { id: "plot-007", name: "non-numeric coordinates are rejected", code: "plot({1, \"x\"});", expectError: "finite real numbers", expect: "coordinates must be finite reals" }
                    ]
                  },
                  {
                    category: "STDLIB - Standard Library Functions",
          cases: [
            { id: "std-001", name: "sqrt(9) = 3", code: "r = sqrt(9);", check: (r) => r.interp.env.r === 3, expect: "3" },
            { id: "std-002", name: "cbrt(-8) = -2", code: "r = cbrt(-8);", check: (r) => r.interp.env.r === -2, expect: "-2" },
            { id: "std-003", name: "abs(-5) = 5", code: "r = abs(-5);", check: (r) => r.interp.env.r === 5, expect: "5" },
            { id: "std-004", name: "log10(100) = 2", code: "r = log10(100);", check: (r) => assertApprox(r.interp.env.r, 2), expect: "2" },
            { id: "std-005", name: "clamp(12, 0, 10) = 10", code: "r = clamp(12, 0, 10);", check: (r) => r.interp.env.r === 10, expect: "10" },
            { id: "std-006", name: "min(3, -1, 2) = -1", code: "r = min(3, -1, 2);", check: (r) => r.interp.env.r === -1, expect: "-1" },
            { id: "std-007", name: "max(3, -1, 2) = 3", code: "r = max(3, -1, 2);", check: (r) => r.interp.env.r === 3, expect: "3" },
            { id: "std-008", name: "round(pi, 2) about 3.14", code: "r = round(pi, 2);", check: (r) => assertApprox(r.interp.env.r, 3.14), expect: "about 3.14" },
          ]
        },
        {
          category: "CLASSES - Constructors and Instance Methods",
          cases: [
            { id: "class-001", name: "constructor initializes fields and method reads them", code: "class Point { function constructor(x, y) { this.x = x; this.y = y; } function magnitude() { return sqrt(this.x^2 + this.y^2); } } p = new Point(3, 4); r = p.magnitude();", check: (r) => r.interp.env.r === 5, expect: "5" },
            { id: "class-002", name: "instances keep independent fields", code: "class Counter { function constructor(start) { this.value = start; } function increment() { this.value = this.value + 1; return this.value; } } a = new Counter(0); b = new Counter(10); r = a.increment() + b.increment() + a.value;", check: (r) => r.interp.env.r === 13, expect: "13" },
            { id: "class-003", name: "class without constructor allows fields", code: "class Empty {} a = new Empty(); a.value = 7; r = a.value;", check: (r) => r.interp.env.r === 7, expect: "7" },
            { id: "class-004", name: "constructor keyword lexes as an identifier", code: "r = 1;", check: () => new Lexer('constructor toString valueOf').tokenize().slice(0, 3).every(token => token.type === TT.IDENTIFIER), expect: "constructor and Object prototype names are identifiers" },
            { id: "class-010", name: "comma-separated null fields are initialized before constructor", code: "class ABC { x = null, o = null; function constructor(o, x) { this.o = 0; this.x = x; } } a = new ABC(9, 4); r = a.x + a.o;", check: (r) => r.interp.env.r === 4, expect: "4 (constructor overrides initialized fields)" },
            { id: "class-011", name: "field defaults are evaluated independently per instance", code: "class Meter { value = 0, limit = 3 + 2; function increment() { this.value = this.value + 1; return this.value; } } a = new Meter(); b = new Meter(); r = a.increment() + b.value + a.limit;", check: (r) => r.interp.env.r === 6, expect: "6 (each instance starts with its own fields)" },
            { id: "class-005", name: "unknown class is rejected", code: "p = new Missing();", expectError: "Unknown class", expect: "unknown class is rejected" },
            { id: "class-006", name: "constructor arity is checked", code: "class Pair { function constructor(x, y) {} } p = new Pair(1);", expectError: "no matching constructor for 1 argument", expect: "constructor argument count is checked" },
            { id: "class-007", name: "missing field is rejected", code: "class Empty {} p = new Empty(); r = p.value;", expectError: "has no field 'value'", expect: "undefined fields are rejected" },
            { id: "class-008", name: "missing method is rejected", code: "class Empty {} p = new Empty(); r = p.run();", expectError: "has no method 'run'", expect: "undefined methods are rejected" },
            { id: "class-009", name: "class names cannot be reassigned", code: "class Point {} Point = 1;", expectError: "Cannot assign to class 'Point'", expect: "class bindings are immutable" },
            { id: "class-012", name: "constructor overloads match argument count", code: "class Choice { value = null; function constructor() { this.value = 1; } function constructor(v) { this.value = v; } } a = new Choice(); b = new Choice(7); r = a.value * 10 + b.value;", check: (r) => r.interp.env.r === 17, expect: "17 (zero- and one-argument constructors selected)" },
            { id: "class-013", name: "unsupported constructor arity lists available overloads", code: "class Choice { function constructor() {} function constructor(v) {} } a = new Choice(1, 2);", expectError: "constructor() or constructor(v)", expect: "supported constructor signatures are reported" },
            { id: "class-014", name: "duplicate constructor signature is rejected", code: "class Choice { function constructor(x) {} function constructor(x) {} } a = new Choice(1);", expectError: "duplicate constructor signature (x)", expect: "duplicate signatures are rejected" },
            { id: "class-015", name: "constructor overloads can use several parameters", code: "class Vector { x = 0, y = 0; function constructor(x) { this.x = x; } function constructor(x, y) { this.x = x; this.y = y; } } a = new Vector(3); b = new Vector(3, 4); r = a.x + a.y + b.x + b.y;", check: (r) => r.interp.env.r === 10, expect: "10" },
            { id: "class-016", name: "Point print method and trailing field comma", code: "class Point { x = null, y = null, function constructor(x, y) { this.x = x; this.y = y; } function print() { print(\"x:\", this.x, \"y:\", this.y); } } point = new Point(10, 20); point.print(); r = point.x;", check: (r) => r.interp.env.r === 10 && r.interp.logs[0] === "x: 10 y: 20", expect: "Point fields and print method work" },
            { id: "class-017", name: "named arguments select same-arity constructor", code: "class Point { x = 0, y = 0; function constructor(x) { this.x = x; } function constructor(y) { this.y = y; } } a = new Point(x = 7); b = new Point(y = 9); r = a.x + b.y;", check: (r) => r.interp.env.r === 16, expect: "16" },
            { id: "class-018", name: "positional same-arity constructor call is explicit ambiguity", code: "class Point { function constructor(x) {} function constructor(y) {} } p = new Point(1);", expectError: "constructor call is ambiguous", expect: "named arguments are required to disambiguate" },
            { id: "class-019", name: "Point example with same-arity overloads and print method", code: "class Point { x = null, y = null, function constructor(x, y) { this.x = x; this.y = y; } function constructor(x) { this.x = x; } function constructor(y) { this.y = y; } function print() { print(\"x:\", this.x, \"y:\", this.y); } } point = new Point(10, 20); point.print(); r = point.x + point.y;", check: (r) => r.interp.env.r === 30 && r.interp.logs[0] === "x: 10 y: 20", expect: "30 with printed point fields" },
          ]
        },
        // ============ CATEGORY 6: SIGNAL FUNCTIONS ============
        {
          category: "SIGNALS - Signal Functions",
          cases: [
            { id: "sig-001", name: "rect(0) = 1", code: "r = rect(0);", check: (r) => r.interp.env.r === 1.0, expect: "1.0" },
            { id: "sig-002", name: "rect(1) = 0 (|t|>0.5)", code: "r = rect(1);", check: (r) => r.interp.env.r === 0.0, expect: "0.0" },
            { id: "sig-003", name: "sinc(0) = 1", code: "r = sinc(0);", check: (r) => r.interp.env.r === 1.0, expect: "1.0" },
            { id: "sig-004", name: "u(0) = 1, u(-1) = 0", code: "a = u(0); b = u(-1);", check: (r) => r.interp.env.a === 1.0 && r.interp.env.b === 0.0, expect: "a=1, b=0" },
            { id: "sig-005", name: "tri(0) = 1, tri(2) = 0", code: "a = tri(0); b = tri(2);", check: (r) => r.interp.env.a === 1.0 && r.interp.env.b === 0.0, expect: "a=1, b=0" },
          ]
        },
        // ============ CATEGORY 7: LOGICAL OPERATORS ============
        {
          category: "LOGIC - Boolean & Logic",
          cases: [
            { id: "log-001", name: "1 and 1 = 1", code: "r = 1 and 1;", check: (r) => r.interp.env.r === 1.0, expect: "1" },
            { id: "log-002", name: "1 and 0 = 0", code: "r = 1 and 0;", check: (r) => r.interp.env.r === 0.0, expect: "0" },
            { id: "log-003", name: "0 or 1 = 1", code: "r = 0 or 1;", check: (r) => r.interp.env.r === 1.0, expect: "1" },
            { id: "log-004", name: "not 1 = 0", code: "r = not 1;", check: (r) => r.interp.env.r === 0.0, expect: "0" },
            { id: "log-005", name: "not 0 = 1", code: "r = not 0;", check: (r) => r.interp.env.r === 1.0, expect: "1" },
          ]
        },
        // ============ CATEGORY 8: SET OPERATIONS ============
        {
          category: "SETS - Set Operations",
          cases: [
            { id: "set-001", name: "set literal creation", code: "s = {1, 2, 3};", check: (r) => r.interp.env.s?.isSet === true, expect: "is a Set" },
            { id: "set-002", name: "union {1,2} union {2,3}", code: "r = {1, 2} union {2, 3};", check: (r) => r.interp.env.r?.elements?.size === 3, expect: "3 elements {1,2,3}" },
            { id: "set-003", name: "intersect {1,2,3} intersect {2}", code: "r = {1, 2, 3} intersect {2};", check: (r) => r.interp.env.r?.elements?.has(2), expect: "contains 2" },
          ]
        }
      ];

      for (const group of tests) {
        reportLines.push("--- " + group.category + " ---");
        for (const tc of group.cases) {
          try {
            let result = null;
            let passed;
            let actual;
            if (tc.expectError) {
              try {
                executeCode(tc.code);
                passed = false;
                actual = 'No error was thrown';
              } catch (error) {
                passed = error.message.includes(tc.expectError);
                actual = error.message;
              }
            } else {
              result = executeCode(tc.code);
              passed = tc.check(result);
              actual = result.interp.env.r ?? result.interp.env.y ?? result.lastResult;
            }
            logTestResult(group.category, tc.id, tc.name, tc.code, passed, actual, tc.expect, null);
            const icon = passed ? "PASS" : "FAIL";
            const color = passed ? "" : " [FAIL]";
            reportLines.push(`  ${icon} [${tc.id}] ${tc.name}${color}`);
            if (!passed) {
              reportLines.push(`      Input: ${tc.code.trim()}`);
              reportLines.push(`      Expected: ${tc.expect}`);
              logError(group.category, tc.id, tc.name, tc.code, `Assertion failed: expected ${tc.expect}`, actual, tc.expect);
            }
          } catch (e) {
            logTestResult(group.category, tc.id, tc.name, tc.code, false, null, tc.expect, e.message);
            reportLines.push("  FAIL [" + tc.id + "] " + tc.name + " [EXCEPTION]");
            reportLines.push(`      Error: ${e.message}`);
            logError(group.category, tc.id, tc.name, tc.code, e.message, null, tc.expect);
          }
        }
        reportLines.push("");
      }

      const s = ERROR_LOG.summary;
      const pct = s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0;
      reportLines.unshift("========================================");
      reportLines.unshift("TEST SUITE COMPLETE | Passed: " + s.passed + "/" + s.total + " (" + pct + "%) | Failed: " + s.failed);
      reportLines.unshift("========================================");
      reportLines.push("========================================");
      reportLines.push("Click the Log button to download the structured JSON error log.");
      reportLines.push("========================================");

      consoleBox.style.color = s.failed === 0 ? "#98c379" : "#e06c75";
      consoleBox.innerText = reportLines.join("\n");
    }

    function downloadSignalFrequencyImage() {
      const fullscreenOpen = document.getElementById('fullscreen-modal')?.classList.contains('active');
      const charts = fullscreenOpen && fsTimeChart?.canvas?.width && fsFreqChart?.canvas?.width
        ? [fsTimeChart, fsFreqChart]
        : [timeChart, freqChart];
      if (!charts[0]?.canvas?.width || !charts[0]?.canvas?.height ||
          !charts[1]?.canvas?.width || !charts[1]?.canvas?.height) return;
      const padding = 32;
      const titleHeight = 30;
      const scale = 2;
      const panelWidth = Math.max(charts[0].canvas.width, charts[1].canvas.width) * scale;
      const panelHeight = Math.max(charts[0].canvas.height, charts[1].canvas.height) * scale;
      const width = panelWidth * 2 + padding * 3;
      const height = titleHeight * scale + panelHeight + padding * 2;
      const output = document.createElement('canvas');
      output.width = width;
      output.height = height;
      const ctx = output.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-main').trim() || '#181a1f';
      ctx.fillRect(0, 0, output.width, output.height);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-main').trim() || '#abb2bf';
      ctx.font = `bold ${14 * scale}px Consolas, monospace`;
      const titles = ['Axiom Studio — Time domain', 'Axiom Studio — Frequency domain'];
      charts.forEach((chart, index) => {
        const x = padding + index * (panelWidth + padding);
        ctx.fillText(titles[index], x, padding + 16 * scale);
        ctx.drawImage(chart.canvas, x, padding + titleHeight * scale,
          chart.canvas.width * scale, chart.canvas.height * scale);
      });
      const link = document.createElement('a');
      link.download = `axiom_signal_frequency_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      link.href = output.toDataURL('image/png');
      link.click();
    }

    function getExportCharts() {
      const fullscreenOpen = document.getElementById('fullscreen-modal')?.classList.contains('active');
      return fullscreenOpen && fsTimeChart?.canvas?.width && fsFreqChart?.canvas?.width
        ? [fsTimeChart, fsFreqChart] : [timeChart, freqChart];
    }

    function downloadSignalCSV() {
      const rows = [['domain', 'signal', 'x', 'y']];
      Object.entries(registeredSignals).forEach(([name, sig]) => {
        const xTime = sig.discrete ? sig.nAxis : (sig.tAxis || timeAxis);
        Array.from(xTime || []).forEach((x, index) => {
          const y = sig.yTime?.[index];
          if (Number.isFinite(y)) rows.push(['time', name, x, y]);
        });
        Array.from(sig.discrete ? sig.fAxis : freqAxis || []).forEach((x, index) => {
          const y = sig.yFreq?.[index];
          if (Number.isFinite(y)) rows.push(['frequency', name, x, y]);
        });
      });
      const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = `axiom_signals_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    function downloadSignalSVG() {
      const charts = getExportCharts();
      if (!charts[0]?.canvas?.width || !charts[1]?.canvas?.width) return;
      const panelWidth = 720;
      const panelHeight = 420;
      const width = panelWidth * 2 + 40;
      const height = panelHeight + 70;
      const images = charts.map((chart, index) => {
        const x = 20 + index * panelWidth;
        const href = chart.canvas.toDataURL('image/png');
        return `<text x="${x}" y="25" fill="currentColor" font-family="Consolas,monospace" font-weight="bold">${index ? 'Frequency domain' : 'Time domain'}</text><image x="${x}" y="40" width="${panelWidth - 20}" height="${panelHeight}" preserveAspectRatio="none" href="${href}"/>`;
      }).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#181a1f"/><g>${images}</g></svg>`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      a.download = `axiom_signals_${new Date().toISOString().replace(/[:.]/g, '-')}.svg`;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    function downloadErrorLog() {
      if (!ERROR_LOG.createdAt) ERROR_LOG.createdAt = new Date().toISOString();
      const logData = JSON.stringify(ERROR_LOG, null, 2);
      const blob = new Blob([logData], { type: 'application/json' });
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = URL.createObjectURL(blob);
      a.download = `axiom_error_log_${ts}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      const consoleBox = document.getElementById('console');
      consoleBox.style.color = "var(--accent)";
      consoleBox.innerText += "\n\nError log saved: " + a.download;
    }

    /* ---- DRAG SPLITTERS ---- */
    let activeSplitter = null;
    let activeSplitterPointerId = null;

    function initSplitters() {
      const hsplitter = document.getElementById('hsplitter');
      const vsplitter = document.getElementById('vsplitter');
      const explorerSplitter = document.getElementById('explorer-splitter');
      const explorerPanel = document.getElementById('project-explorer');
      const workspace = document.getElementById('workspace');
      const editorContainer = document.getElementById('editor-container');
      const signalsDock = document.getElementById('signals-dock');

      try {
        const savedWidth = Number(localStorage.getItem('axiom-ui-explorer-width'));
        if (Number.isFinite(savedWidth) && savedWidth >= 150 && savedWidth <= 420) {
          document.documentElement.style.setProperty('--explorer-width', `${savedWidth}px`);
        }
      } catch {}

      const beginSplitterDrag = (e, orientation) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        activeSplitter = orientation;
        activeSplitterPointerId = e.pointerId;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        document.body.classList.add(orientation === 'h' ? 'dragging-splitter-h' : 'dragging-splitter-v');
      };
      explorerSplitter.addEventListener('pointerdown', e => beginSplitterDrag(e, 'explorer'));
      hsplitter.addEventListener('pointerdown', e => beginSplitterDrag(e, 'v'));
      vsplitter.addEventListener('pointerdown', e => beginSplitterDrag(e, 'h'));

      window.addEventListener('pointermove', (e) => {
        if (e.pointerId !== activeSplitterPointerId) return;
        if (!activeSplitter) return;
        if (activeSplitter === 'explorer') {
          const rect = workspace.getBoundingClientRect();
          const availableWidth = rect.width - signalsDock.getBoundingClientRect().width - 278;
          const maxWidth = Math.max(150, Math.min(420, availableWidth));
          const width = Math.max(150, Math.min(maxWidth, e.clientX - rect.left));
          document.documentElement.style.setProperty('--explorer-width', `${width}px`);
          try { localStorage.setItem('axiom-ui-explorer-width', String(Math.round(width))); } catch {}
        } else if (activeSplitter === 'v') {
          const rect = workspace.getBoundingClientRect();
          const newSignalsWidthPx = rect.right - e.clientX;
          const workspaceWidthPx = rect.width;
          const minSignalsPx = 260;
          const maxSignalsPx = Math.max(minSignalsPx, workspaceWidthPx - explorerPanel.getBoundingClientRect().width - 308);
          const clamped = Math.max(minSignalsPx, Math.min(maxSignalsPx, newSignalsWidthPx));
          const pct = (clamped / workspaceWidthPx) * 100;
          document.documentElement.style.setProperty('--signals-width', pct + '%');
          const wsSlider = document.getElementById('signals-width-scale');
          const wsLabel = document.getElementById('signals-width-label');
          const sliderVal = Math.max(20, Math.min(85, Math.round(pct)));
          if (wsSlider) wsSlider.value = sliderVal;
          if (wsLabel) wsLabel.textContent = sliderVal + '%';
        } else if (activeSplitter === 'h') {
          const rect = editorContainer.getBoundingClientRect();
          const newBottomPx = rect.bottom - e.clientY;
          const editorHeightPx = rect.height;
          const minBottomPx = 80;
          const maxBottomPx = editorHeightPx - 150;
          const clamped = Math.max(minBottomPx, Math.min(maxBottomPx, newBottomPx));
          const pct = (clamped / editorHeightPx) * 100;
          document.documentElement.style.setProperty('--terminal-height', pct + '%');
          const thSlider = document.getElementById('terminal-height-scale');
          const thLabel = document.getElementById('terminal-height-label');
          const sliderVal = Math.max(15, Math.min(65, Math.round(pct)));
          if (thSlider) thSlider.value = sliderVal;
          if (thLabel) thLabel.textContent = sliderVal + '%';
        }
        [timeChart, freqChart, fsTimeChart, fsFreqChart].forEach(c => { if (c) c.resize(); });
      });

      const endSplitterDrag = (e) => {
        if (e.pointerId !== activeSplitterPointerId) return;
        if (activeSplitter === 'v' || activeSplitter === 'explorer') {
          document.body.classList.remove('dragging-splitter-v');
        } else if (activeSplitter === 'h') {
          document.body.classList.remove('dragging-splitter-h');
        }
        activeSplitter = null;
        activeSplitterPointerId = null;
        [timeChart, freqChart, fsTimeChart, fsFreqChart].forEach(c => { if (c) c.resize(); });
      };
      window.addEventListener('pointerup', endSplitterDrag);
      window.addEventListener('pointercancel', endSplitterDrag);
    }

    function updateFsTimeSpan() {
      const input = document.getElementById('fs-time-span-input');
      const val = parseFloat(input.value);
      const mainInput = document.getElementById('time-span-input');
      if (Number.isFinite(val)) {
        const boundedValue = Math.min(MAX_TIME_SPAN, Math.max(1, val));
        input.value = boundedValue;
        tSpan = boundedValue;
        if (mainInput) mainInput.value = boundedValue;
        recalculateAxes();
        recompute();
      }
    }

    function updateFullscreenChannelDropdown() {
      const fsDropdown = document.getElementById('fs-channel-selector');
      const mainDropdown = document.getElementById('channel-selector');
      if (!fsDropdown || !mainDropdown) return;
      fsDropdown.innerHTML = mainDropdown.innerHTML;
      fsDropdown.value = mainDropdown.value;
    }

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

# Use the Test button in the toolbar to run the validation suite!`;
      recompute();

      let t;
      ed.addEventListener('input', () => {
        recomputeVersion += 1;
        cancelFourierJob();
        clearTimeout(t);
        t = setTimeout(recompute, 350);
      });
    };
