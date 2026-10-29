/* ==========================================================================
6. INTERPRETER
       ========================================================================== */
    class ComplexNumber {
      constructor(real, imaginary = 0) {
        this.real = real;
        this.imaginary = imaginary;
      }
      toString() {
        const real = formatRealNumber(this.real);
        const imaginary = formatRealNumber(Math.abs(this.imaginary));
        if (this.imaginary === 0) return real;
        const imaginaryPart = `${imaginary === '1' ? '' : imaginary}i`;
        if (this.real === 0) return `${this.imaginary < 0 ? '-' : ''}${imaginaryPart}`;
        return `${real} ${this.imaginary < 0 ? '-' : '+'} ${imaginaryPart}`;
      }
    }

    class SymbolicFunction {
      constructor(expression, variableName, formula) {
        this.expression = expression;
        this.variableName = variableName;
        this.formula = formula;
      }
      evaluate(interpreter, value) {
        const hadOwnValue = Object.prototype.hasOwnProperty.call(interpreter.env, this.variableName);
        const previousValue = interpreter.env[this.variableName];
        interpreter.env[this.variableName] = value;
        try {
          return interpreter.execute(this.expression);
        } finally {
          if (hadOwnValue) interpreter.env[this.variableName] = previousValue;
          else delete interpreter.env[this.variableName];
        }
      }
      toString() { return this.formula; }
    }

    class FormulaValue {
      constructor(expression) {
        this.expression = expression;
        this.isFormulaValue = true;
      }
      toString() { return SymbolicEngine.toPrettyMathString(this.expression); }
    }

    function formatRealNumber(value) {
      if (Object.is(value, -0) || Math.abs(value) < 1e-14) value = 0;
      return Number.isFinite(value) ? Number(value.toPrecision(10)).toString() : String(value);
    }

    function formatRoundedValue(value, digits = 4) {
      if (isComplexNumber(value)) {
        return new ComplexNumber(Number(value.real.toFixed(digits)), Number(value.imaginary.toFixed(digits))).toString();
      }
      return Number(value.toFixed(digits)).toString();
    }

    function isComplexNumber(value) {
      return value instanceof ComplexNumber;
    }

    function isValueInMathSet(value, name) {
      if (name === 'COMPLEX') {
        return isComplexNumber(value)
          ? Number.isFinite(value.real) && Number.isFinite(value.imaginary)
          : typeof value === 'number' && Number.isFinite(value);
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) return false;
      switch (name) {
        case 'N': return Number.isInteger(value) && value > 0;
        case 'WHOLE':
        case 'W': return Number.isInteger(value) && value >= 0;
        case 'Z': return Number.isInteger(value);
        case 'Q':
        case 'R': return true;
        case '+R': return value > 0;
        case '-R': return value < 0;
        default: return false;
      }
    }

    function isValueInMathType(value, type) {
      if (type && typeof type.contains === 'function') return !!type.contains(value);
      if (type?.isMathSetType) return isValueInMathSet(value, type.name);
      if (!type?.isMathInterval || typeof value !== 'number' || !Number.isFinite(value)) return false;
      const aboveLower = type.includeLower ? value >= type.lower : value > type.lower;
      const belowUpper = type.includeUpper ? value <= type.upper : value < type.upper;
      return aboveLower && belowUpper;
    }
    function testMembership(value, container) {
      if (Array.isArray(container)) return container.some(el => deepEqual(el, value));
      if (container && typeof container.contains === 'function') return !!container.contains(value);
      if (container?.isSet) return isValueInSet(value, container);
      if (container?.isMathSetType || container?.isMathInterval) return isValueInMathType(value, container);
      return false;
    }

    function isValueInSet(value, set) {
      if (!set?.isSet) return false;
      if (set.elements.has(value)) return true;
      if (!set.sequence || typeof value !== 'number' || !Number.isFinite(value)) return false;
      const { start, step } = set.sequence;
      const index = (value - start) / step;
      return index >= 0 && Math.abs(index - Math.round(index)) <= 1e-10 * Math.max(1, Math.abs(index));
    }

    function formatSetValue(value, seen = new WeakSet()) {
      const values = Array.from(value.elements).map(item => formatTerminalValue(item, seen));
      return `{${values.join(', ')}${value.sequence ? `${values.length ? ', ' : ''}...` : ''}}`;
    }

    function makeComplex(real, imaginary = 0) {
      const normalizedReal = Math.abs(real) < 1e-14 || Object.is(real, -0) ? 0 : real;
      const normalizedImaginary = Math.abs(imaginary) < 1e-14 || Object.is(imaginary, -0) ? 0 : imaginary;
      if (normalizedImaginary === 0) return normalizedReal;
      return new ComplexNumber(normalizedReal, normalizedImaginary);
    }

    function asComplex(value) {
      return isComplexNumber(value) ? value : new ComplexNumber(value, 0);
    }

    function addMathValues(left, right) {
      if (left?.isFormulaValue || right?.isFormulaValue) {
        return new FormulaValue(SymbolicEngine.bin(
          left?.isFormulaValue ? left.expression : SymbolicEngine.num(left), '+',
          right?.isFormulaValue ? right.expression : SymbolicEngine.num(right)
        ));
      }
      if (!isComplexNumber(left) && !isComplexNumber(right)) return left + right;
      const a = asComplex(left), b = asComplex(right);
      return makeComplex(a.real + b.real, a.imaginary + b.imaginary);
    }

    function subtractMathValues(left, right) {
      if (left?.isFormulaValue || right?.isFormulaValue) {
        return new FormulaValue(SymbolicEngine.bin(
          left?.isFormulaValue ? left.expression : SymbolicEngine.num(left), '-',
          right?.isFormulaValue ? right.expression : SymbolicEngine.num(right)
        ));
      }
      if (!isComplexNumber(left) && !isComplexNumber(right)) return left - right;
      const a = asComplex(left), b = asComplex(right);
      return makeComplex(a.real - b.real, a.imaginary - b.imaginary);
    }

    let zeroTimesInfinityDepth = 0;
    function isZeroMathValue(v) { return v === 0 || (isComplexNumber(v) && v.real === 0 && v.imaginary === 0); }
    function isInfiniteMathValue(v) {
      if (typeof v === 'number') return v === Infinity || v === -Infinity;
      return isComplexNumber(v) && (Math.abs(v.real) === Infinity || Math.abs(v.imaginary) === Infinity) && !Number.isNaN(v.real) && !Number.isNaN(v.imaginary);
    }
    function multiplyMathValues(left, right) {
      if (zeroTimesInfinityDepth > 0 && !left?.isFormulaValue && !right?.isFormulaValue &&
          ((isZeroMathValue(left) && isInfiniteMathValue(right)) || (isZeroMathValue(right) && isInfiniteMathValue(left)))) return 0;
      if (left?.isFormulaValue || right?.isFormulaValue) {
        return new FormulaValue(SymbolicEngine.bin(
          left?.isFormulaValue ? left.expression : SymbolicEngine.num(left), '*',
          right?.isFormulaValue ? right.expression : SymbolicEngine.num(right)
        ));
      }
      if (!isComplexNumber(left) && !isComplexNumber(right)) return left * right;
      const a = asComplex(left), b = asComplex(right);
      return makeComplex(a.real * b.real - a.imaginary * b.imaginary, a.real * b.imaginary + a.imaginary * b.real);
    }

    function divideMathValues(left, right) {
      if (left?.isFormulaValue || right?.isFormulaValue) {
        return new FormulaValue(SymbolicEngine.bin(
          left?.isFormulaValue ? left.expression : SymbolicEngine.num(left), '/',
          right?.isFormulaValue ? right.expression : SymbolicEngine.num(right)
        ));
      }
      if (!isComplexNumber(left) && !isComplexNumber(right)) return left / right;
      const a = asComplex(left), b = asComplex(right);
      const denominator = b.real * b.real + b.imaginary * b.imaginary;
      if (denominator === 0) throw new Error('Division by zero');
      return makeComplex(
        (a.real * b.real + a.imaginary * b.imaginary) / denominator,
        (a.imaginary * b.real - a.real * b.imaginary) / denominator
      );
    }

    function complexExp(value) {
      const z = asComplex(value), magnitude = Math.exp(z.real);
      return makeComplex(magnitude * Math.cos(z.imaginary), magnitude * Math.sin(z.imaginary));
    }

    function complexLog(value) {
      const z = asComplex(value);
      return makeComplex(Math.log(Math.hypot(z.real, z.imaginary)), Math.atan2(z.imaginary, z.real));
    }

    function complexPower(base, exponent) {
      if (!isComplexNumber(base) && !isComplexNumber(exponent)) {
        if (base >= 0 || Number.isInteger(exponent)) return Math.pow(base, exponent);
      }
      if ((!isComplexNumber(exponent) && exponent === 0) ||
          (isComplexNumber(exponent) && exponent.real === 0 && exponent.imaginary === 0)) return 1;
      if ((base === 0 || (isComplexNumber(base) && base.real === 0 && base.imaginary === 0)) &&
          !isComplexNumber(exponent) && exponent > 0) return 0;
      return complexExp(multiplyMathValues(complexLog(base), exponent));
    }

    function complexSqrt(value) {
      const z = asComplex(value);
      const magnitude = Math.hypot(z.real, z.imaginary);
      return makeComplex(
        Math.sqrt(Math.max(0, (magnitude + z.real) / 2)),
        Math.sign(z.imaginary || 1) * Math.sqrt(Math.max(0, (magnitude - z.real) / 2))
      );
    }

    function complexSin(value) {
      const z = asComplex(value);
      return makeComplex(Math.sin(z.real) * Math.cosh(z.imaginary), Math.cos(z.real) * Math.sinh(z.imaginary));
    }

    function complexCos(value) {
      const z = asComplex(value);
      return makeComplex(Math.cos(z.real) * Math.cosh(z.imaginary), -Math.sin(z.real) * Math.sinh(z.imaginary));
    }

    function complexSinh(value) {
      const z = asComplex(value);
      return makeComplex(Math.sinh(z.real) * Math.cos(z.imaginary), Math.cosh(z.real) * Math.sin(z.imaginary));
    }

    function complexCosh(value) {
      const z = asComplex(value);
      return makeComplex(Math.cosh(z.real) * Math.cos(z.imaginary), Math.sinh(z.real) * Math.sin(z.imaginary));
    }

    function complexAsin(value) {
      const z = asComplex(value);
      const iz = multiplyMathValues(new ComplexNumber(0, 1), z);
      const root = complexSqrt(subtractMathValues(1, multiplyMathValues(z, z)));
      return multiplyMathValues(new ComplexNumber(0, -1), complexLog(addMathValues(iz, root)));
    }

    function complexAcos(value) {
      return subtractMathValues(Math.PI / 2, complexAsin(value));
    }

    function complexAtan(value) {
      const iz = multiplyMathValues(new ComplexNumber(0, 1), value);
      const difference = subtractMathValues(complexLog(subtractMathValues(1, iz)), complexLog(addMathValues(1, iz)));
      return multiplyMathValues(new ComplexNumber(0, 0.5), difference);
    }

    function complexEqual(left, right) {
      const a = asComplex(left), b = asComplex(right);
      return Math.abs(a.real - b.real) < 1e-12 && Math.abs(a.imaginary - b.imaginary) < 1e-12;
    }

    function requireReal(value, functionName) {
      if (isComplexNumber(value)) throw new Error(`${functionName}() expects a real number`);
      return value;
    }

    function collectStatisticsValues(name, inputs) {
      const values = inputs.flatMap(value => {
        if (Array.isArray(value)) return value;
        if (value?.isSet) return Array.from(value.elements);
        return [value];
      });
      if (!values.length && !['sum', 'count'].includes(String(name).toLowerCase())) throw new Error(`${name}() expects at least one observation`);
      return values.map((value, index) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new Error(`${name}() observation ${index + 1} must be a finite real number`);
        }
        return value;
      });
    }

    const INTERVAL_WORD_FORMS = new Map([
      ['open', [false, false]], ['exclusive', [false, false]],
      ['closed', [true, true]], ['inclusive', [true, true]],
      ['openclosed', [false, true]], ['closedopen', [true, false]]
    ]);
    function substituteVariableNode(tree, name, replacement) {
      if (!tree || typeof tree !== 'object') return tree;
      if (Array.isArray(tree)) return tree.map(child => substituteVariableNode(child, name, replacement));
      if (tree.type === 'Variable' && tree.name === name) return replacement;
      const copy = { ...tree };
      for (const [key, value] of Object.entries(tree)) if (value && typeof value === 'object') copy[key] = substituteVariableNode(value, name, replacement);
      return copy;
    }
    class DiscreteSignal {
      constructor(name, compute, meta = {}) {
        this.name = name; this.compute = compute; this.indexName = meta.indexName || 'n';
        this.isDiscreteSignal = true; this.cache = new Map();
      }
      at(k) {
        if (!Number.isInteger(k)) throw new Error(`${this.name}[${this.indexName}] is only defined for integer ${this.indexName} (got ${k})`);
        if (this.cache.has(k)) return this.cache.get(k);
        const value = this.compute(k);
        this.cache.set(k, value);
        return value;
      }
      toString() { return `${this.name}[${this.indexName}] (discrete-time signal)`; }
    }

    class ReturnSignal {
      constructor(value) { this.value = value; }
    }

    class BreakSignal {}
    class ContinueSignal {}

    class Interpreter {
      constructor() {
        const stdSets = buildStandardMathSets();
        this.env = Object.assign(stdSets, {
          'pi': Math.PI,
          'omega': 1.0,
          'w': 1.0,
          'tau': Math.PI * 2,
          'e': Math.E,
          'phi': (1 + Math.sqrt(5)) / 2,
          'inf': Infinity,
          'c': 2.99792e8,
          't': 0,
          'i': new ComplexNumber(0, 1)
        });
        this.logs = [];
        this.discreteEvaluation = false;
        this.plots = [];
        this.functions = new Map();
        this.classes = new Map();
        this.loopDepth = 0;
        this.switchDepth = 0;
        this.functionDepth = 0;
        this.animationFrame = 0;
        this.lastFormulaExpression = null;
      }
      assertAssignableName(name) {
        const normalizedName = name.toLowerCase();
        if (isReservedName(name)) throw new Error(`Cannot assign to reserved name '${name}'`);
        if (this.functions.has(normalizedName)) throw new Error(`Cannot assign to function '${name}'`);
        const classDefinition = this.classes.get(normalizedName);
        if (classDefinition?.name === name) throw new Error(`Cannot assign to class '${name}'`);
      }
      executeStatements(statements) {
        let result = null;
        for (const statement of statements) {
          result = this.execute(statement);
          if (result instanceof ReturnSignal || result instanceof BreakSignal || result instanceof ContinueSignal) return result;
        }
        return result;
      }
      executeBlock(block) {
        return this.executeStatements(block.body);
      }
      applyCompoundAssignment(operator, left, right) {
        if (operator === '+') return addMathValues(left, right);
        if (operator === '-') return subtractMathValues(left, right);
        if (operator === '*') return multiplyMathValues(left, right);
        if (operator === '/') return divideMathValues(left, right);
        throw new Error(`Unsupported compound assignment '${operator}='`);
      }
      executeSetComprehension(node) {
        const bounds = node.conditions.find(condition => condition.type === 'ChainComparison' &&
          condition.operands.length === 3 && condition.operands[1]?.type === 'Variable' &&
          condition.operands[1].name !== node.resultName && ['<', '<='].includes(condition.operators[0]) &&
          ['<', '<='].includes(condition.operators[1]));
        if (!bounds) throw new Error('Set-builder requires finite lower and upper bounds for its generator');
        const generatorName = bounds.operands[1].name;
        const lower = requireReal(this.execute(bounds.operands[0]), 'set-builder');
        const upper = requireReal(this.execute(bounds.operands[2]), 'set-builder');
        if (!Number.isFinite(lower) || !Number.isFinite(upper)) throw new Error('Set-builder bounds must be finite');

        const membership = node.conditions.find(condition => condition.type === 'BinaryExpression' &&
          condition.op === 'in' &&
          condition.left.type === 'Variable' && condition.left.name === node.resultName);
        const resultType = membership ? this.execute(membership.right) : null;
        if (!resultType?.isMathSetType || !['N', 'WHOLE', 'W', 'Z'].includes(resultType.name)) {
          throw new Error('Finite set-builder results currently require the output to belong to N, WHOLE, W, or Z');
        }

        const affine = expression => {
          if (expression.type === 'NumberLiteral') return { slope: 0, intercept: expression.value };
          if (expression.type === 'Variable') {
            if (expression.name === generatorName) return { slope: 1, intercept: 0 };
            const value = this.env[expression.name];
            return typeof value === 'number' && Number.isFinite(value) ? { slope: 0, intercept: value } : null;
          }
          if (expression.type === 'UnaryExpression' && expression.op === '-') {
            const value = affine(expression.operand);
            return value ? { slope: -value.slope, intercept: -value.intercept } : null;
          }
          if (expression.type !== 'BinaryExpression') return null;
          const left = affine(expression.left);
          const right = affine(expression.right);
          if (!left || !right) return null;
          if (expression.op === '+') return { slope: left.slope + right.slope, intercept: left.intercept + right.intercept };
          if (expression.op === '-') return { slope: left.slope - right.slope, intercept: left.intercept - right.intercept };
          if (expression.op === '*' && left.slope === 0) return { slope: right.slope * left.intercept, intercept: right.intercept * left.intercept };
          if (expression.op === '*' && right.slope === 0) return { slope: left.slope * right.intercept, intercept: left.intercept * right.intercept };
          if (expression.op === '/' && right.slope === 0 && right.intercept !== 0) {
            return { slope: left.slope / right.intercept, intercept: left.intercept / right.intercept };
          }
          return null;
        };
        const formula = affine(node.expression);
        if (!formula || !Number.isFinite(formula.slope) || formula.slope === 0) {
          throw new Error('Set-builder result must be a nonconstant affine expression of its bounded generator');
        }
        const firstResult = formula.slope * lower + formula.intercept;
        const lastResult = formula.slope * upper + formula.intercept;
        const firstInteger = Math.ceil(Math.min(firstResult, lastResult));
        const lastInteger = Math.floor(Math.max(firstResult, lastResult));
        if (lastInteger - firstInteger > 100000) throw new Error('Set-builder result exceeds 100000 candidate values');

        const values = new Set();
        const outerEnv = this.env;
        this.env = Object.create(outerEnv);
        try {
          for (let resultValue = firstInteger; resultValue <= lastInteger; resultValue++) {
            if (!isValueInMathSet(resultValue, resultType.name)) continue;
            const generatorValue = (resultValue - formula.intercept) / formula.slope;
            this.env[generatorName] = generatorValue;
            this.env[node.resultName] = resultValue;
            if (node.conditions.every(condition => this.isTruthy(this.execute(condition)))) values.add(resultValue);
          }
        } finally {
          this.env = outerEnv;
        }
        return { isSet: true, elements: values };
      }
      isTruthy(value) {
        if (isComplexNumber(value)) return value.real !== 0 || value.imaginary !== 0;
        if (typeof value === 'number') return value !== 0 && !Number.isNaN(value);
        return Boolean(value);
      }
      evaluateTypeSpec(spec, value) {
        if (!spec) return true;
        if (spec.type === 'MathSetType') {
          const setValue = this.env[spec.name];
          return valueBelongsToSet(value, setValue);
        }
        if (spec.type === 'MathIntervalType') {
          let l, u;
          try {
            const prev = this.env;
            l = this.execute(spec.lower);
            u = this.execute(spec.upper);
          } catch (e) {
            return false;
          }
          const isReal = (v) => typeof v === 'number' || isComplexNumber(v);
          if (!isReal(value) || !isReal(l) || !isReal(u)) return false;
          const vn = isComplexNumber(value) ? value.real : value;
          const ln = isComplexNumber(l) ? (l.real === -Infinity || l.real === Infinity ? l.real : l.real) : l;
          const un = isComplexNumber(u) ? (u.real === -Infinity || u.real === Infinity ? u.real : u.real) : u;
          const aboveL = spec.includeLower ? vn >= ln : vn > ln;
          const belowU = spec.includeUpper ? vn <= un : vn < un;
          return aboveL && belowU;
        }
        return false;
      }
      animationStateNodes(args) {
        if (args.length !== 2) throw new Error('animate() expects animate(startSignal, signalSteps)');
        let listNode = args[1];
        const seen = new Set();
        while (listNode?.type === 'Variable' && !seen.has(listNode.name)) {
          seen.add(listNode.name);
          const assigned = this.env[`${listNode.name}_ast`];
          if (!assigned) break;
          listNode = assigned;
        }
        if (listNode?.type === 'ArrayComprehensionExpression') {
          const start = requireReal(this.execute(listNode.start), 'list-comprehension range');
          const stop = requireReal(this.execute(listNode.stop), 'list-comprehension range');
          const direction = start <= stop ? 1 : -1;
          const count = Math.floor(Math.abs(stop - start)) + 1;
          if (count > 100000) throw new Error('List comprehension is limited to 100000 items');
          const replace = (node, value) => {
            if (!node || typeof node !== 'object') return node;
            if (node.type === 'Variable' && node.name === listNode.variable) return { type: 'NumberLiteral', value };
            if (Array.isArray(node)) return node.map(child => replace(child, value));
            const copy = {};
            for (const [key, child] of Object.entries(node)) copy[key] = replace(child, value);
            return copy;
          };
          const states = [];
          for (let i = 0; i < count; i++) {
            const value = start + direction * i;
            if ((direction > 0 && value > stop) || (direction < 0 && value < stop)) break;
            states.push(replace(listNode.expression, value));
          }
          return [args[0], ...states];
        }
        if (listNode?.type !== 'ArrayLiteral' || listNode.items.length === 0) {
          throw new Error('animate() signalSteps must be a non-empty list, for example [u(t - 1), u(t - 2)]');
        }
        return [args[0], ...listNode.items];
      }
      inlineTimeSignals(node, seen = new Set()) {
        // Replaces names of time-dependent signals with their equations so a time shift reaches the whole chain.
        const dependsOnT = (tree, visited) => {
          if (!tree || typeof tree !== 'object') return false;
          if (Array.isArray(tree)) return tree.some(child => dependsOnT(child, visited));
          if (tree.type === 'Variable') {
            if (tree.name === 't') return true;
            const ast = this.env[`${tree.name}_ast`];
            if (ast && !visited.has(tree.name)) { visited.add(tree.name); return dependsOnT(ast, visited); }
            return false;
          }
          return Object.values(tree).some(value => value && typeof value === 'object' && dependsOnT(value, visited));
        };
        const inline = (tree, visited) => {
          if (!tree || typeof tree !== 'object') return tree;
          if (Array.isArray(tree)) return tree.map(child => inline(child, visited));
          if (tree.type === 'Variable' && tree.name !== 't') {
            const ast = this.env[`${tree.name}_ast`];
            if (ast && !visited.has(tree.name) && dependsOnT(ast, new Set([tree.name]))) return inline(ast, new Set([...visited, tree.name]));
            return tree;
          }
          const copy = { ...tree };
          for (const [key, value] of Object.entries(tree)) if (value && typeof value === 'object') copy[key] = inline(value, visited);
          return copy;
        };
        return inline(node, seen);
      }
      callUserFunction(definition, argumentNodes, instance = null, preEvaluated = false) {
        if (argumentNodes.length !== definition.parameters.length) {
          throw new Error(`${definition.name}() expects ${definition.parameters.length} arguments, got ${argumentNodes.length}`);
        }
        const argumentsEvaluated = preEvaluated ? argumentNodes : argumentNodes.map(argument => this.execute(argument));
        if (definition.isTyped && definition.domain) {
          for (let idx = 0; idx < argumentsEvaluated.length; idx++) {
            if (!this.evaluateTypeSpec(definition.domain, argumentsEvaluated[idx])) {
              const paramName = definition.parameters[idx] || String(idx);
              const valueStr = typeof argumentsEvaluated[idx] === 'object' && argumentsEvaluated[idx] !== null
                ? argumentsEvaluated[idx].toString?.() ?? String(argumentsEvaluated[idx])
                : String(argumentsEvaluated[idx]);
              const domStr = definition.domain.type === 'MathSetType'
                ? definition.domain.name
                : `${definition.domain.includeLower ? '[' : '('}?, ${definition.domain.includeUpper ? ']' : ')'}?`;
              throw new Error(`Argument ${paramName} = ${valueStr} does not belong to domain ${domStr}`);
            }
          }
        }
        const outerEnv = this.env;
        const outerLoopDepth = this.loopDepth;
        const outerSwitchDepth = this.switchDepth;
        this.env = Object.create(outerEnv);
        if (instance) this.env.this = instance;
        this.loopDepth = 0;
        this.switchDepth = 0;
        this.functionDepth += 1;
        definition.parameters.forEach((parameter, index) => {
          this.assertAssignableName(parameter);
          this.env[parameter] = argumentsEvaluated[index];
        });
        try {
          const execResult = this.executeBlock(definition.body);
          let result = null;
          if (execResult instanceof ReturnSignal) result = execResult.value;
          else if (execResult instanceof BreakSignal || execResult instanceof ContinueSignal) throw new Error('Loop control escaped a function body');
          if (definition.isTyped && definition.range && result !== null && result !== undefined) {
            if (!this.evaluateTypeSpec(definition.range, result)) {
              const resStr = typeof result === 'object' && result !== null ? (result.toString?.() ?? String(result)) : String(result);
              const rngStr = definition.range.type === 'MathSetType'
                ? definition.range.name
                : `${definition.range.includeLower ? '[' : '('}?, ${definition.range.includeUpper ? ']' : ')'}?`;
              throw new Error(`Return value ${resStr} does not belong to codomain ${rngStr}`);
            }
          }
          return result;
        } finally {
          this.env = outerEnv;
          this.loopDepth = outerLoopDepth;
          this.switchDepth = outerSwitchDepth;
          this.functionDepth -= 1;
        }
      }
      execute(node) {
        switch (node.type) {
          case 'NullLiteral': return null;
          case 'BooleanLiteral': return node.value;
          case 'NumberLiteral': return node.value;
          case 'StringLiteral': return node.value;
          case 'ArrayLiteral': return node.items.map(item => this.execute(item));
          case 'ArrayComprehensionExpression': {
            const start = requireReal(this.execute(node.start), 'list-comprehension range');
            const stop = requireReal(this.execute(node.stop), 'list-comprehension range');
            if (!Number.isFinite(start) || !Number.isFinite(stop)) {
              throw new Error('List-comprehension range bounds must be finite');
            }
            const direction = start <= stop ? 1 : -1;
            const count = Math.floor(Math.abs(stop - start)) + 1;
            if (count > 100000) throw new Error('List comprehension is limited to 100000 items');
            const hadValue = Object.prototype.hasOwnProperty.call(this.env, node.variable);
            const previousValue = this.env[node.variable];
            const values = [];
            try {
              for (let i = 0; i < count; i++) {
                const value = start + direction * i;
                if ((direction > 0 && value > stop) || (direction < 0 && value < stop)) break;
                this.env[node.variable] = value;
                values.push(this.execute(node.expression));
              }
            } finally {
              if (hadValue) this.env[node.variable] = previousValue;
              else delete this.env[node.variable];
            }
            return values;
          }
          case 'AbsoluteValueExpression': {
            const value = this.execute(node.expression);
            if (value?.isFormulaValue) return new FormulaValue({ type: 'AbsoluteValueExpression', expression: value.expression });
            return isComplexNumber(value) ? Math.hypot(value.real, value.imaginary) : Math.abs(value);
          }
          case 'IntervalExpression': {
            const lower = requireReal(this.execute(node.start), 'range');
            const upper = requireReal(this.execute(node.stop), 'range');
            if (lower > upper) throw new Error('range() interval bounds must be ordered (lower <= upper)');
            const includeStartRaw = typeof node.includeStart === 'boolean'
              ? node.includeStart
              : node.includeStart?.type === 'BooleanLiteral'
                ? node.includeStart.value
                : this.isTruthy(this.execute(node.includeStart));
            const includeStopRaw = typeof node.includeStop === 'boolean'
              ? node.includeStop
              : node.includeStop?.type === 'BooleanLiteral'
                ? node.includeStop.value
                : this.isTruthy(this.execute(node.includeStop));
            return { isMathInterval: true, lower, upper, includeLower: includeStartRaw, includeUpper: includeStopRaw };
          }
          case 'SetComprehensionExpression': return this.executeSetComprehension(node);
          case 'MathSetType': return { isMathSetType: true, name: node.name };
          case 'MathIntervalType': return {
            isMathInterval: true,
            lower: requireReal(this.execute(node.lower), 'interval'),
            upper: requireReal(this.execute(node.upper), 'interval'),
            includeLower: node.includeLower,
            includeUpper: node.includeUpper
          };
          case 'DiscreteSignalDefinition': {
            this.assertAssignableName(node.name);
            const interpreter = this;
            const definitionEnv = this.env;
            if (node.expr?.type === 'FunctionCall' && node.expr.name.toLowerCase() === 'animate') {
              const states = this.animationStateNodes(node.expr.args);
              const firstState = states[0];
              const sourceName = firstState?.type === 'Variable' ? firstState.name : 'signal';
              const signal = new DiscreteSignal(node.name, k => {
                if (node.domain && !interpreter.evaluateTypeSpec(node.domain, k)) {
                  throw new Error(`${node.name}[${k}] is outside the declared domain`);
                }
                const savedEnv = interpreter.env;
                interpreter.env = Object.create(definitionEnv);
                interpreter.env[node.indexName] = k;
                try {
                  const frame = Math.min(interpreter.animationFrame, states.length - 1);
                  const state = interpreter.execute(states[frame]);
                  const value = state?.isDiscreteSignal ? state.at(k) : state;
                  if (node.range && value !== null && value !== undefined && !interpreter.evaluateTypeSpec(node.range, value)) {
                    throw new Error(`${node.name}[${k}] = ${formatTerminalValue(value)} is outside the declared range`);
                  }
                  return value;
                } finally {
                  interpreter.env = savedEnv;
                }
              }, { indexName: node.indexName });
              signal.cache = { has: () => false, get: () => undefined, set: () => {} };
              signal.animated = true;
              signal.animationSequenceLength = states.length;
              signal.sourceName = sourceName;
              this.env[node.name] = signal;
              return signal;
            }
            const signal = new DiscreteSignal(node.name, k => {
              if (node.domain && !interpreter.evaluateTypeSpec(node.domain, k)) {
                throw new Error(`${node.name}[${k}] is outside the declared domain`);
              }
              const savedEnv = interpreter.env;
              interpreter.env = Object.create(definitionEnv);
              interpreter.env[node.indexName] = k;
              const previousDiscreteEvaluation = interpreter.discreteEvaluation;
              try {
                interpreter.discreteEvaluation = true;
                const value = interpreter.execute(node.expr);
                if (node.range && value !== null && value !== undefined && !interpreter.evaluateTypeSpec(node.range, value)) {
                  throw new Error(`${node.name}[${k}] = ${formatTerminalValue(value)} is outside the declared range`);
                }
                return value;
              } finally {
                interpreter.discreteEvaluation = previousDiscreteEvaluation;
                interpreter.env = savedEnv;
              }
            }, { indexName: node.indexName });
            this.env[node.name] = signal;
            return signal;
          }
          case 'TypedFunctionDeclaration': {
            const normalizedName = node.name.toLowerCase();
            if (isReservedName(node.name)) throw new Error(`Cannot define reserved function '${node.name}'`);
            if (this.functions.has(normalizedName) || this.classes.has(normalizedName) || Object.prototype.hasOwnProperty.call(this.env, node.name)) {
              throw new Error(`Cannot redefine '${node.name}'`);
            }
            const domainType = this.execute(node.domain);
            const rangeType = this.execute(node.range);
            const formula = SymbolicEngine.toPrettyMathString(node.expression);
            const symbolicFunction = new SymbolicFunction(node.expression, 'x', formula);
            symbolicFunction.domainType = domainType;
            symbolicFunction.rangeType = rangeType;
            this.env[node.name] = symbolicFunction;
            return symbolicFunction;
          }
          case 'BlockStatement': return this.executeBlock(node);
          case 'Variable':
            if (node.name in this.env) return this.env[node.name];
            throw new Error(`Undefined variable '${node.name}'`);
          case 'AssignStatement': {
            this.assertAssignableName(node.name);
            const val = this.execute(node.expr);
            this.env[node.name] = node.expr.type === 'NullLiteral'
              ? new FormulaValue(SymbolicEngine.symVar(node.name))
              : val;
            return val;
          }
          case 'CompoundAssignStatement': {
            this.assertAssignableName(node.name);
            const current = this.env[node.name];
            if (!(node.name in this.env)) throw new Error(`Undefined variable '${node.name}'`);
            const right = this.execute(node.expr);
            const value = this.applyCompoundAssignment(node.operator, current, right);
            this.env[node.name] = value;
            return value;
          }
          case 'AbsoluteValueAssignment': {
            this.assertAssignableName(node.name);
            const value = this.execute(node.value);
            let solutions;
            if (value?.isFormulaValue) {
              solutions = [multiplyMathValues(-1, value), value];
            } else {
              const target = requireReal(value, '|x| assignment');
              if (!Number.isFinite(target)) throw new Error('|x| assignment requires a finite value');
              solutions = target < 0 ? [] : target === 0 ? [0] : [-target, target];
            }
            this.env[node.name] = solutions;
            return solutions;
          }
          case 'UpdateStatement': {
            this.assertAssignableName(node.name);
            const currentValue = requireReal(this.env[node.name], node.name);
            this.env[node.name] = currentValue + node.delta;
            return currentValue;
          }
          case 'FunctionDeclaration':
          case 'TypedFunctionDeclaration': {
            const isTyped = node.type === 'TypedFunctionDeclaration';
            const normalizedName = node.name.toLowerCase();
            if (isReservedName(node.name)) throw new Error(`Cannot define reserved function '${node.name}'`);
            if (this.functions.has(normalizedName) || this.classes.has(normalizedName) || Object.prototype.hasOwnProperty.call(this.env, node.name) ||
                Object.prototype.hasOwnProperty.call(this.env, `${node.name}_ast`)) {
              throw new Error(`Cannot redefine '${node.name}'`);
            }
            if (isTyped) {
              const paramNames = new Set();
              const seenOrdered = [];
              const visitor = (ast) => {
                if (!ast || typeof ast !== 'object') return;
                if (ast.type === 'Variable' && typeof ast.name === 'string') {
                  if (!paramNames.has(ast.name) && !(ast.name in this.env) && !isReservedName(ast.name)) {
                    paramNames.add(ast.name);
                    seenOrdered.push(ast.name);
                  }
                }
                for (const key of Object.keys(ast)) {
                  if (key === 'parent') continue;
                  const v = ast[key];
                  if (Array.isArray(v)) v.forEach(visitor);
                  else if (v && typeof v === 'object') visitor(v);
                }
              };
              visitor(node.expression);
              const parameters = seenOrdered.length > 0 ? seenOrdered : ['x'];
              parameters.forEach(parameter => this.assertAssignableName(parameter));
              const fnNode = {
                type: 'FunctionDeclaration',
                name: node.name,
                parameters,
                body: {
                  type: 'BlockStatement',
                  body: [{ type: 'ReturnStatement', value: node.expression }]
                },
                isTyped: true,
                domain: node.domain,
                range: node.range
              };
              this.functions.set(normalizedName, fnNode);
              this.env[`${node.name}_ast`] = node.expression;
              return null;
            }
            node.parameters.forEach(parameter => this.assertAssignableName(parameter));
            this.functions.set(normalizedName, node);
            return null;
          }
          case 'ClassDeclaration': {
            const normalizedName = node.name.toLowerCase();
            if (isReservedName(node.name)) throw new Error(`Cannot define reserved class '${node.name}'`);
            if (this.classes.has(normalizedName) || this.functions.has(normalizedName) ||
              Object.prototype.hasOwnProperty.call(this.env, node.name)) {
              throw new Error(`Cannot redefine '${node.name}'`);
            }
            this.classes.set(normalizedName, {
              name: node.name,
              fields: node.fields,
              constructors: node.methods.filter(method => method.name.toLowerCase() === 'constructor'),
              methods: new Map(node.methods
                .filter(method => method.name.toLowerCase() !== 'constructor')
                .map(method => [method.name.toLowerCase(), method]))
            });
            return null;
          }
          case 'NewExpression': {
            const definition = this.classes.get(node.name.toLowerCase());
            if (!definition) throw new Error(`Unknown class '${node.name}'`);
            const instance = { isAxiomObject: true, className: definition.name, fields: Object.create(null) };
            const outerEnv = this.env;
            this.env = Object.create(outerEnv);
            this.env.this = instance;
            try {
              definition.fields.forEach(field => {
                instance.fields[field.name] = this.execute(field.initializer);
              });
            } finally {
              this.env = outerEnv;
            }
            if (definition.constructors.length) {
              const matchingConstructors = definition.constructors.map(method => {
                const orderedArguments = new Array(method.parameters.length);
                let nextPosition = 0;
                for (const argument of node.args) {
                  if (argument.argName) {
                    const parameterIndex = method.parameters.findIndex(parameter => parameter.toLowerCase() === argument.argName.toLowerCase());
                    if (parameterIndex < 0 || orderedArguments[parameterIndex] !== undefined) return null;
                    orderedArguments[parameterIndex] = argument;
                  } else {
                    while (orderedArguments[nextPosition] !== undefined) nextPosition++;
                    if (nextPosition >= orderedArguments.length) return null;
                    orderedArguments[nextPosition++] = argument;
                  }
                }
                return Array.from(orderedArguments).every(argument => argument !== undefined)
                  ? { method, arguments: orderedArguments }
                  : null;
              }).filter(Boolean);
              if (matchingConstructors.length === 0) {
                const signatures = definition.constructors.map(method => `constructor(${method.parameters.join(', ')})`);
                throw new Error(`${definition.name} has no matching constructor for ${node.args.length} argument(s); available: ${signatures.join(' or ')}`);
              }
              if (matchingConstructors.length > 1) {
                throw new Error(`${definition.name} constructor call is ambiguous; use named arguments to select an overload`);
              }
              const selected = matchingConstructors[0];
              this.callUserFunction(selected.method, selected.arguments, instance);
            } else if (node.args.length) throw new Error(`${definition.name} has no constructor and expects no arguments`);
            return instance;
          }
          case 'MemberExpression': {
            const object = this.execute(node.object);
            if (!object?.isAxiomObject) throw new Error(`Cannot read property '${node.name}' from a non-object value`);
            if (!Object.prototype.hasOwnProperty.call(object.fields, node.name)) {
              throw new Error(`Object '${object.className}' has no field '${node.name}'`);
            }
            return object.fields[node.name];
          }
          case 'IndexExpression': {
            if (node.object.type === 'Variable' && !(node.object.name in this.env)) {
              // Math-style discrete notation for built-ins: u[n], delta[n], rect[n] ...
              const k = requireReal(this.execute(node.index), 'index');
              if (!Number.isInteger(k)) throw new Error(`${node.object.name}[n] is only defined for integer n (got ${k})`);
              const builtin = node.object.name.toLowerCase();
              if (builtin === 'delta' || builtin === 'impulse') return k === 0 ? 1 : 0;
              if (builtin === 'u' || builtin === 'step' || builtin === 'heaviside') return k >= 0 ? 1 : 0;
              try {
                return this.executeFunction(node.object.name, [{ type: 'NumberLiteral', value: k }]);
              } catch (error) {
                if (/unknown function|undefined function|not defined/i.test(String(error.message))) throw new Error(`Undefined variable '${node.object.name}'`);
                throw error;
              }
            }
            const object = this.execute(node.object);
            if (object && object.isDiscreteSignal) return object.at(requireReal(this.execute(node.index), 'index'));
            const index = requireReal(this.execute(node.index), 'index');
            if (!Number.isInteger(index) || index < 0) throw new Error('Array index must be a non-negative integer');
            if (!Array.isArray(object) || index >= object.length) throw new Error('Index is outside the array bounds');
            const value = object[index];
            return value && typeof value === 'object' && value.type
              ? new FormulaValue(value)
              : value;
          }
          case 'MemberAssignStatement': {
            const object = this.execute(node.object);
            if (!object?.isAxiomObject) throw new Error(`Cannot set property '${node.name}' on a non-object value`);
            object.fields[node.name] = this.execute(node.expr);
            return object.fields[node.name];
          }
          case 'MethodCallExpression': {
            const object = this.execute(node.object);
            if (!object?.isAxiomObject) throw new Error(`Cannot call method '${node.name}' on a non-object value`);
            const definition = this.classes.get(object.className.toLowerCase());
            const method = definition?.methods.get(node.name.toLowerCase());
            if (!method) throw new Error(`Class '${object.className}' has no method '${node.name}'`);
            return this.callUserFunction(method, node.args, object);
          }
          case 'ReturnStatement':
            if (this.functionDepth === 0) throw new Error('return is only valid inside a function');
            return new ReturnSignal(node.value ? this.execute(node.value) : null);
          case 'BreakStatement':
            if (this.loopDepth === 0 && this.switchDepth === 0) throw new Error('break is only valid inside a loop or switch');
            return new BreakSignal();
          case 'ContinueStatement':
            if (this.loopDepth === 0) throw new Error('continue is only valid inside a loop');
            return new ContinueSignal();
          case 'IfStatement': {
            const branch = this.isTruthy(this.execute(node.condition)) ? node.consequent : node.alternate;
            return branch ? (branch.type === 'IfStatement' ? this.execute(branch) : this.executeBlock(branch)) : null;
          }
          case 'WhileStatement': {
            let iterations = 0;
            this.loopDepth += 1;
            try {
              while (this.isTruthy(this.execute(node.condition))) {
                if (++iterations > 100000) throw new Error('while loop exceeded 100000 iterations');
                const result = this.executeBlock(node.body);
                if (result instanceof ReturnSignal) return result;
                if (result instanceof BreakSignal) break;
              }
            } finally {
              this.loopDepth -= 1;
            }
            return null;
          }
          case 'ForStatement': {
            if (node.initializer) this.execute(node.initializer);
            let iterations = 0;
            this.loopDepth += 1;
            try {
              while (!node.condition || this.isTruthy(this.execute(node.condition))) {
                if (++iterations > 100000) throw new Error('for loop exceeded 100000 iterations');
                const result = this.executeBlock(node.body);
                if (result instanceof ReturnSignal) return result;
                if (result instanceof BreakSignal) break;
                if (node.update) this.execute(node.update);
              }
            } finally {
              this.loopDepth -= 1;
            }
            return null;
          }
          case 'ForInStatement': {
            this.assertAssignableName(node.variable);
            const iterable = this.execute(node.iterable);
            const values = Array.isArray(iterable) ? iterable : iterable?.isSet ? Array.from(iterable.elements) : null;
            if (!values) throw new Error('for-in expects a range or set');
            let iterations = 0;
            this.loopDepth += 1;
            try {
              for (const value of values) {
                if (++iterations > 100000) throw new Error('for-in loop exceeded 100000 iterations');
                this.env[node.variable] = value;
                const result = this.executeBlock(node.body);
                if (result instanceof ReturnSignal) return result;
                if (result instanceof BreakSignal) break;
              }
            } finally {
              this.loopDepth -= 1;
            }
            return null;
          }
          case 'SwitchStatement': {
            const value = this.execute(node.expression);
            let matchedCase = node.cases.find(item => {
              const test = this.execute(item.test);
              return isComplexNumber(value) || isComplexNumber(test) ? complexEqual(value, test) : value === test;
            });
            this.switchDepth += 1;
            try {
              const result = matchedCase ? this.executeStatements(matchedCase.body) :
                node.defaultBody ? this.executeStatements(node.defaultBody) : null;
              return result instanceof BreakSignal ? null : result;
            } finally {
              this.switchDepth -= 1;
            }
          }
          case 'PrintStatement': {
            const ev = node.args.map(a => this.execute(a));
            this.logs.push(ev.map(value => formatTerminalValue(value)).join(' '));
            return null;
          }
          case 'TernaryExpression': {
            const c = this.execute(node.cond);
            return this.isTruthy(c) ? this.execute(node.trueBranch) : this.execute(node.falseBranch);
          }
          case 'SetLiteral': {
            const elements = new Set();
            for (const it of node.items) elements.add(this.execute(it));
            return { isSet: true, elements };
          }
          case 'SequenceSetLiteral': {
            const values = node.items.map(item => this.execute(item));
            if (values.some(value => typeof value !== 'number' || !Number.isFinite(value))) {
              throw new Error('Ellipsis sets require finite real numeric values');
            }
            const step = values[1] - values[0];
            if (step === 0 || values.some((value, index) => index > 0 &&
                Math.abs((value - values[index - 1]) - step) > 1e-10 * Math.max(1, Math.abs(step)))) {
              throw new Error('Ellipsis sets must begin with an arithmetic sequence');
            }
            return { isSet: true, elements: new Set(values), sequence: { start: values[0], step } };
          }
          case 'IntervalExpression': {
            const lower = requireReal(this.execute(node.start), 'range');
            const upper = requireReal(this.execute(node.stop), 'range');
            if (lower > upper) throw new Error('range() interval bounds must be ordered (lower <= upper)');
            const includeStartRaw = typeof node.includeStart === 'boolean' ? node.includeStart : this.isTruthy(this.execute(node.includeStart));
            const includeStopRaw = typeof node.includeStop === 'boolean' ? node.includeStop : this.isTruthy(this.execute(node.includeStop));
            return { isMathInterval: true, lower, upper, includeLower: includeStartRaw, includeUpper: includeStopRaw };
          }
          case 'SetComprehensionExpression': return this.executeSetComprehension(node);
          case 'RangeExpression': {
            const start = this.execute(node.start);
            const stop = this.execute(node.stop);
            const steps = this.execute(node.steps);
            if (!Number.isFinite(start) || !Number.isFinite(stop)) throw new Error('range() bounds must be finite numbers');
            if (!Number.isInteger(steps) || steps < 1 || steps > 100000) throw new Error('range() steps must be an integer from 1 to 100000');
            const samples = Array.from({ length: steps + 1 }, (_, i) => start + (stop - start) * i / steps);
            Object.defineProperty(samples, 'variable', { value: node.variable });
            return samples;
          }
          case 'SetOpExpression': {
            const l = this.execute(node.left), r = this.execute(node.right);
            if (!l?.isSet || !r?.isSet) throw new Error("Requires valid sets");
            if (l.sequence || r.sequence) throw new Error('Set operations on infinite ellipsis sets are not supported');
            const res = new Set();
            if (node.op === 'union') {
              for (const e of l.elements) res.add(e);
              for (const e of r.elements) res.add(e);
            } else if (node.op === 'intersect') {
              for (const e of l.elements) if (r.elements.has(e)) res.add(e);
            } else if (node.op === 'diff') {
              for (const e of l.elements) if (!r.elements.has(e)) res.add(e);
            }
            return { isSet: true, elements: res };
          }
          case 'ChainComparison': {
            const vals = node.operands.map(n => this.execute(n));
            for (let i = 0; i < node.operators.length; i++) {
              const op = node.operators[i], a = vals[i], b = vals[i + 1];
              if ((isComplexNumber(a) || isComplexNumber(b)) && !['==', '!=', 'in'].includes(op)) {
                throw new Error('Complex numbers cannot be ordered or tested for set membership');
              }
              let ok = false;
              if (op === '<') ok = a < b;
              else if (op === '<=') ok = a <= b;
              else if (op === '>') ok = a > b;
              else if (op === '>=') ok = a >= b;
              else if (op === '==') ok = isComplexNumber(a) || isComplexNumber(b) ? complexEqual(a, b) : a === b;
              else if (op === '!=') ok = isComplexNumber(a) || isComplexNumber(b) ? !complexEqual(a, b) : a !== b;
              else if (op === 'in') ok = testMembership(a, b);
              if (!ok) return 0.0;
            }
            return 1.0;
          }
          case 'BinaryExpression': {
            if (node.op === 'and') {
              const left = this.execute(node.left);
              if (left?.isFormulaValue) {
                const right = this.execute(node.right);
                return new FormulaValue(SymbolicEngine.bin(left.expression,
                  'and', right?.isFormulaValue ? right.expression : SymbolicEngine.num(right)));
              }
              return Boolean(left) ? (Boolean(this.execute(node.right)) ? 1.0 : 0.0) : 0.0;
            }
            if (node.op === 'or') {
              const left = this.execute(node.left);
              if (left?.isFormulaValue) {
                const right = this.execute(node.right);
                return new FormulaValue(SymbolicEngine.bin(left.expression,
                  'or', right?.isFormulaValue ? right.expression : SymbolicEngine.num(right)));
              }
              return Boolean(left) ? 1.0 : (Boolean(this.execute(node.right)) ? 1.0 : 0.0);
            }
            const l = this.execute(node.left), r = this.execute(node.right);
            if ((l?.isFormulaValue || r?.isFormulaValue) && ['<', '<=', '>', '>=', '==', '!='].includes(node.op)) {
              return new FormulaValue(SymbolicEngine.bin(
                l?.isFormulaValue ? l.expression : node.left, node.op,
                r?.isFormulaValue ? r.expression : node.right
              ));
            }
            if ((l?.isFormulaValue || r?.isFormulaValue) && ['+', '-', '*', '/', '^', '%'].includes(node.op)) {
              const left = l?.isFormulaValue ? l.expression : node.left;
              const right = r?.isFormulaValue ? r.expression : node.right;
              return new FormulaValue(SymbolicEngine.bin(left, node.op, right));
            }
            if ((isComplexNumber(l) || isComplexNumber(r)) && ['<', '<=', '>', '>='].includes(node.op)) {
              throw new Error('Complex numbers cannot be ordered or tested for set membership');
            }
            if (node.op === '<') return l < r ? 1.0 : 0.0;
            if (node.op === '<=') return l <= r ? 1.0 : 0.0;
            if (node.op === '>') return l > r ? 1.0 : 0.0;
            if (node.op === '>=') return l >= r ? 1.0 : 0.0;
            if (node.op === '==') return (isComplexNumber(l) || isComplexNumber(r) ? complexEqual(l, r) : l === r) ? 1.0 : 0.0;
            if (node.op === '!=') return (isComplexNumber(l) || isComplexNumber(r) ? !complexEqual(l, r) : l !== r) ? 1.0 : 0.0;
            if (node.op === 'in' || node.op === 'is') return testMembership(l, r) ? 1.0 : 0.0;
            if (node.op === '+') return addMathValues(l, r);
            if (node.op === '-') return subtractMathValues(l, r);
            if (node.op === '*') return multiplyMathValues(l, r);
            if (node.op === '/') return divideMathValues(l, r);
            if (node.op === '%') {
              if (isComplexNumber(l) || isComplexNumber(r)) throw new Error('Modulo is not defined for complex numbers');
              return l % r;
            }
            if (node.op === '^') return complexPower(l, r);
            break;
          }
          case 'UnaryExpression': {
            const value = this.execute(node.operand);
            if (value?.isFormulaValue) return new FormulaValue({ type: 'UnaryExpression', op: node.op, operand: value.expression });
            if (node.op === 'not') return Boolean(value) ? 0.0 : 1.0;
            return isComplexNumber(value) ? makeComplex(-value.real, -value.imaginary) : -value;
          }
          case 'SequenceExpression': {
            if (node.assignments) {
              for (const asgn of node.assignments) {
                this.assertAssignableName(asgn.name);
                this.env[asgn.name] = this.execute(asgn.value);
              }
            }
            return this.execute(node.result);
          }
          case 'FunctionCall': {
            // A named signal can be sampled with the same call syntax as a continuous signal:
            // x(2) is equivalent to x[2] when x is a discrete-time signal.
            const callable = this.env[node.name];
            if (callable?.isDiscreteSignal) {
              if (node.args.length !== 1) throw new Error(`${node.name}() expects one integer sample index`);
              return callable.at(requireReal(this.execute(node.args[0]), node.name));
            }
            return this.executeFunction(node.name, node.args);
          }
        }
      }

      executeFunction(name, args) {
        const lower = name.toLowerCase();
        const evaluateWithVariable = (varName, value, callback) => {
          const outerEnv = this.env;
          const boundEnv = Object.create(outerEnv);
          Object.defineProperty(boundEnv, varName, {
            value,
            writable: true,
            enumerable: true,
            configurable: true
          });
          this.env = boundEnv;
          try {
            return callback();
          } finally {
            this.env = outerEnv;
          }
        };

        if (lower === 'random') {
          if (args.length !== 0) throw new Error('random() expects no arguments');
          return Math.random();
        }

        if (lower === 'formula') {
          if (args.length !== 1) throw new Error('formula() expects exactly one argument');
          this.lastFormulaExpression = null;
          let value;
          try { value = this.execute(args[0]); }
          catch { value = new FormulaValue(args[0]); }
          const substituteVariables = (node, substitutions) => {
            if (!node || typeof node !== 'object') return node;
            if (Array.isArray(node)) return node.map(child => substituteVariables(child, substitutions));
            if (node.type === 'Variable' && Object.prototype.hasOwnProperty.call(substitutions, node.name)) {
              return substitutions[node.name];
            }
            const copy = { ...node };
            Object.entries(node).forEach(([key, child]) => {
              if (child && typeof child === 'object') copy[key] = substituteVariables(child, substitutions);
            });
            return copy;
          };
          const formulaExpression = node => {
            if (!node || typeof node !== 'object') return node;
            if (Array.isArray(node)) return node.map(formulaExpression);
            if (node.type === 'FunctionCall') {
              const lowerName = node.name.toLowerCase();
              const parameters = node.args.map(formulaExpression);
              const [x, y] = parameters;
              const unary = expression => ({ type: 'UnaryExpression', op: '-', operand: expression });
              const power = (base, exponent) => SymbolicEngine.bin(base, '^', exponent);
              const call = (functionName, callArgs) => SymbolicEngine.fn(functionName, callArgs);

              if (lowerName === 'diff' && node.args.length >= 2) {
                const target = node.args[1];
                const variableName = target.type === 'Variable' ? target.name : 't';
                return SymbolicEngine.simplify(SymbolicEngine.diff(node.args[0], variableName));
              }
              if (lowerName === 'ft') {
                const [signal, variable, frequency, suppliedStart, suppliedEnd] = parameters;
                if (!variable || variable.type !== 'Variable' || !frequency) return { ...node, args: parameters };
                const start = suppliedStart || unary(SymbolicEngine.symVar('inf'));
                const end = suppliedEnd || SymbolicEngine.symVar('inf');
                const exponent = unary(SymbolicEngine.bin(SymbolicEngine.bin(SymbolicEngine.symVar('i'), '*', frequency), '*', variable));
                return call('integrate', [SymbolicEngine.bin(signal, '*', call('exp', [exponent])), variable, start, end]);
              }
              if (lowerName === 'fs') {
                const [signal, variable, period, harmonic, suppliedStart] = parameters;
                if (!variable || variable.type !== 'Variable' || !period || !harmonic) return { ...node, args: parameters };
                const start = suppliedStart || SymbolicEngine.num(0);
                const angularFrequency = SymbolicEngine.bin(
                  SymbolicEngine.bin(SymbolicEngine.bin(SymbolicEngine.num(2), '*', SymbolicEngine.symVar('pi')), '*', harmonic),
                  '/', period
                );
                const exponent = unary(SymbolicEngine.bin(SymbolicEngine.bin(SymbolicEngine.symVar('i'), '*', angularFrequency), '*', variable));
                const integral = call('integrate', [SymbolicEngine.bin(signal, '*', call('exp', [exponent])), variable, start, SymbolicEngine.bin(start, '+', period)]);
                return SymbolicEngine.simplify(SymbolicEngine.bin(integral, '/', period));
              }

              const assignedSignal = this.env[`${node.name}_ast`];
              if (assignedSignal && parameters.length === 1) return formulaExpression(substituteVariables(assignedSignal, { t: parameters[0] }));
              const symbolicFunction = this.env[node.name];
              if (symbolicFunction instanceof SymbolicFunction && parameters.length === 1) {
                return formulaExpression(substituteVariables(symbolicFunction.expression, { [symbolicFunction.variableName]: parameters[0] }));
              }
              const userFunction = this.functions.get(lowerName);
              const returnStatement = userFunction?.body?.body?.length === 1 ? userFunction.body.body[0] : null;
              if (returnStatement?.type === 'ReturnStatement' && parameters.length === userFunction.parameters.length) {
                const substitutions = Object.fromEntries(userFunction.parameters.map((parameter, index) => [parameter, parameters[index]]));
                return formulaExpression(substituteVariables(returnStatement.value, substitutions));
              }

              if (lowerName === 'abs' && x) return { type: 'AbsoluteValueExpression', expression: x };
              if (lowerName === 'exp' && x) return power(SymbolicEngine.symVar('e'), x);
              if (lowerName === 'sqrt' && x) return power(x, SymbolicEngine.num(0.5));
              if (lowerName === 'cbrt' && x) return power(x, SymbolicEngine.num(1 / 3));
              if (lowerName === 'pow' && x && y) return power(x, y);
              if (lowerName === 'log10' && x) return SymbolicEngine.bin(call('ln', [x]), '/', call('ln', [SymbolicEngine.num(10)]));
              if (lowerName === 'log2' && x) return SymbolicEngine.bin(call('ln', [x]), '/', call('ln', [SymbolicEngine.num(2)]));
              if (lowerName === 'log' && x) return y ? SymbolicEngine.bin(call('ln', [x]), '/', call('ln', [y])) : call('ln', [x]);
              if (lowerName === 'deg') return SymbolicEngine.bin(x, '*', SymbolicEngine.bin(SymbolicEngine.num(180), '/', SymbolicEngine.symVar('pi')));
              if (lowerName === 'rad') return SymbolicEngine.bin(SymbolicEngine.bin(x, '*', SymbolicEngine.symVar('pi')), '/', SymbolicEngine.num(180));
              if (lowerName === 'stddev') return call('sqrt', [call('variance', parameters)]);
              if (lowerName === 'samplestddev') return call('sqrt', [call('sampleVariance', parameters)]);
              if (lowerName === 'heaviside' || lowerName === 'step') return call('u', parameters);
              if (lowerName === 'sgn' || lowerName === 'signum') return call('sign', parameters);
              if (lowerName === 'sinc' && x) {
                const scaled = SymbolicEngine.bin(SymbolicEngine.symVar('pi'), '*', x);
                return SymbolicEngine.bin(call('sin', [scaled]), '/', scaled);
              }
              if (lowerName === 'ramp' && x) return call('max', [x, SymbolicEngine.num(0)]);
              if (lowerName === 'tri' && x) return call('max', [SymbolicEngine.bin(SymbolicEngine.num(1), '-', call('abs', [x])), SymbolicEngine.num(0)]);
              if (lowerName === 'pulse' && x) return call('rect', [SymbolicEngine.bin(x, '/', y || SymbolicEngine.num(1))]);
              if (lowerName === 'u' && x) return {
                type: 'TernaryExpression',
                cond: SymbolicEngine.bin(x, '>=', SymbolicEngine.num(0)),
                trueBranch: SymbolicEngine.num(1),
                falseBranch: SymbolicEngine.num(0)
              };
              if (lowerName === 'rect' && x) return {
                type: 'TernaryExpression',
                cond: SymbolicEngine.bin(call('abs', [x]), '<=', SymbolicEngine.num(0.5)),
                trueBranch: SymbolicEngine.num(1),
                falseBranch: SymbolicEngine.num(0)
              };
              if (lowerName === 'sawtooth' && x) {
                const period = y || SymbolicEngine.bin(SymbolicEngine.num(2), '*', SymbolicEngine.symVar('pi'));
                const phase = SymbolicEngine.bin(
                  SymbolicEngine.bin(
                    SymbolicEngine.bin(SymbolicEngine.bin(x, '/', period), '%', SymbolicEngine.num(1)),
                    '+',
                    SymbolicEngine.num(1)
                  ),
                  '%',
                  SymbolicEngine.num(1)
                );
                return SymbolicEngine.bin(SymbolicEngine.bin(SymbolicEngine.num(2), '*', phase), '-', SymbolicEngine.num(1));
              }
              if (lowerName === 'square' && x) {
                const duty = y || SymbolicEngine.num(0.5);
                const phase = SymbolicEngine.bin(
                  SymbolicEngine.bin(
                    SymbolicEngine.bin(SymbolicEngine.bin(x, '/', SymbolicEngine.bin(SymbolicEngine.num(2), '*', SymbolicEngine.symVar('pi'))), '%', SymbolicEngine.num(1)),
                    '+',
                    SymbolicEngine.num(1)
                  ),
                  '%',
                  SymbolicEngine.num(1)
                );
                return {
                  type: 'TernaryExpression',
                  cond: SymbolicEngine.bin(phase, '<', duty),
                  trueBranch: SymbolicEngine.num(1),
                  falseBranch: SymbolicEngine.num(-1)
                };
              }
              if (lowerName === 'clamp' && parameters.length === 3) return call('min', [call('max', [x, y]), parameters[2]]);
              if (lowerName === 'hypot' && parameters.length) {
                const sumOfSquares = parameters.map(value => power(value, SymbolicEngine.num(2)))
                  .reduce((sum, value) => sum ? SymbolicEngine.bin(sum, '+', value) : value, null);
                return call('sqrt', [sumOfSquares]);
              }
              return { ...node, args: parameters };
            }
            if (node.type === 'AbsoluteValueExpression') return { ...node, expression: formulaExpression(node.expression) };
            if (node.type === 'BinaryExpression') return { ...node, left: formulaExpression(node.left), right: formulaExpression(node.right) };
            if (node.type === 'UnaryExpression') return { ...node, operand: formulaExpression(node.operand) };
            if (node.type === 'TernaryExpression') return { ...node, cond: formulaExpression(node.cond), trueBranch: formulaExpression(node.trueBranch), falseBranch: formulaExpression(node.falseBranch) };
            return node;
          };
          const backendFormula = tryBackendFormula(args[0]);
          const rawExpression = backendFormula || this.lastFormulaExpression || (value instanceof SymbolicFunction
            ? value.expression
            : value?.isFormulaValue
              ? value.expression
              : args[0]);
          let expression = formulaExpression(rawExpression);
          expression = SymbolicEngine.simplify(expression);
          return [expression, value];
        }

        const userFunction = this.functions.get(lower);
        if (userFunction) {
          const values = args.map(argument => this.execute(argument));
          if (values.some(value => value?.isFormulaValue)) {
            return new FormulaValue({ type: 'FunctionCall', name, args: values.map(value =>
              value?.isFormulaValue ? value.expression : SymbolicEngine.num(value)) });
          }
          return this.callUserFunction(userFunction, values, null, true);
        }

        if (lower === 'plot') {
          const positionalArgs = args.filter(argument => !argument.argName);
          const figureArgs = args.filter(argument => argument.argName === 'fig');
          if (args.some(argument => argument.argName && argument.argName !== 'fig')) {
            throw new Error('plot() only accepts the named argument fig');
          }
          if (figureArgs.length > 1) throw new Error('plot() accepts fig only once');
          if (positionalArgs.length < 1 || positionalArgs.length > 2) {
            throw new Error('plot() expects one value or x and y values');
          }

          const asValues = value => {
            const values = value?.isSet ? Array.from(value.elements) : Array.isArray(value) ? value : [value];
            if (!values.length) throw new Error('plot() requires at least one point');
            return values.map(point => {
              if (typeof point !== 'number' || !Number.isFinite(point)) {
                throw new Error('plot() coordinates must be finite real numbers');
              }
              return point;
            });
          };

          const first = this.execute(positionalArgs[0]);
          let xValues;
          let yValues;
          if (positionalArgs.length === 1 && typeof first === 'number') {
            xValues = [asValues(first)[0]];
            yValues = [0];
          } else if (positionalArgs.length === 1) {
            yValues = asValues(first);
            xValues = yValues.map((_, index) => index);
          } else {
            const second = this.execute(positionalArgs[1]);
            xValues = asValues(first);
            yValues = asValues(second);
            if (xValues.length !== yValues.length) {
              throw new Error('plot() x and y values must have the same number of points');
            }
          }

          const figureValue = figureArgs.length ? this.execute(figureArgs[0]) : 1;
          if (!(typeof figureValue === 'string' || (typeof figureValue === 'number' && Number.isFinite(figureValue)))) {
            throw new Error('plot() fig must be a finite number or string');
          }
          this.plots.push({
            figure: String(figureValue),
            points: xValues.map((x, index) => ({ x, y: yValues[index] })).sort((left, right) => left.x - right.x)
          });
          return null;
        }

        if (INTERVAL_WORD_FORMS.has(lower)) {
          if (args.length !== 2) throw new Error(`${name}() expects a lower and an upper bound, for example ${name}(0, 1)`);
          const [includeLower, includeUpper] = INTERVAL_WORD_FORMS.get(lower);
          return {
            isMathInterval: true,
            lower: requireReal(this.execute(args[0]), `${name}() lower bound`),
            upper: requireReal(this.execute(args[1]), `${name}() upper bound`),
            includeLower, includeUpper
          };
        }

        if (lower === 'exists') {
          if (args.length !== 3) throw new Error('exists() expects a variable, a finite set or range, and a condition');
          if (args[0]?.type !== 'Variable') throw new Error('exists() first argument must be a variable name');
          const collection = this.execute(args[1]);
          const values = collection?.isSet ? Array.from(collection.elements) : Array.isArray(collection) ? collection : null;
          if (!values) throw new Error('exists() expects a finite set or range as its second argument');
          for (const value of values) {
            const condition = evaluateWithVariable(args[0].name, value, () => this.execute(args[2]));
            if (this.isTruthy(condition)) return 1.0;
          }
          return 0.0;
        }

        if (lower === 'impulse') {
          if (args.length < 1 || args.length > 2) throw new Error('impulse() expects impulse(index) or impulse(values, zeroIndex)');
          const input = this.execute(args[0]);
          const values = input?.isSet ? Array.from(input.elements) : Array.isArray(input) ? input : null;
          if (values) {
            if (values.length === 0) throw new Error('impulse() value list must not be empty');
            if (values.some(value => typeof value !== 'number' || !Number.isInteger(value))) {
              throw new Error('impulse() value list must contain only integers');
            }
            const zeroIndex = args.length === 2 ? requireReal(this.execute(args[1]), 'impulse() zero index') : 0;
            if (!Number.isInteger(zeroIndex)) throw new Error('impulse() zero index must be an integer');
            return new DiscreteSignal(
              `impulse(${values.join(', ')})`,
              index => {
                const offset = index + zeroIndex;
                return offset >= 0 && offset < values.length ? values[offset] : 0;
              }
            );
          }
          if (args.length !== 1) throw new Error('impulse() zero index is only valid with an integer value list');
          return requireReal(input, 'impulse() argument') === 0 ? 1 : 0;
        }

        if (lower === 'delay' || lower === 'shift') {
          if (args.length !== 2) throw new Error(`${name}() expects ${name}(signal, amount)`);
          const amount = requireReal(this.execute(args[1]), `${name}() amount`);
          const target = args[0].type === 'Variable' && args[0].name in this.env ? this.env[args[0].name] : null;
          if (target && target.isDiscreteSignal) {
            if (!Number.isInteger(amount)) throw new Error(`${name}() of a discrete-time signal needs a whole number of samples`);
            return new DiscreteSignal(`${name}(${target.name})`, k => target.at(k - amount), { indexName: target.indexName });
          }
          // Continuous: x(t) becomes x(t - amount). Signals defined by name are expanded first so the whole chain shifts.
          const dependsOnT = (node, seen) => {
            if (!node || typeof node !== 'object') return false;
            if (Array.isArray(node)) return node.some(child => dependsOnT(child, seen));
            if (node.type === 'Variable') {
              if (node.name === 't') return true;
              const ast = this.env[`${node.name}_ast`];
              if (ast && !seen.has(node.name)) { seen.add(node.name); return dependsOnT(ast, seen); }
              return false;
            }
            return Object.values(node).some(value => value && typeof value === 'object' && dependsOnT(value, seen));
          };
          const inline = (node, seen) => {
            if (!node || typeof node !== 'object') return node;
            if (Array.isArray(node)) return node.map(child => inline(child, seen));
            if (node.type === 'Variable' && node.name !== 't') {
              const ast = this.env[`${node.name}_ast`];
              if (ast && !seen.has(node.name) && dependsOnT(ast, new Set([node.name]))) return inline(ast, new Set([...seen, node.name]));
              return node;
            }
            const copy = { ...node };
            for (const [key, value] of Object.entries(node)) if (value && typeof value === 'object') copy[key] = inline(value, seen);
            return copy;
          };
          const source = inline(args[0], new Set());
          const shifted = substituteVariableNode(source, 't', {
            type: 'BinaryExpression', left: { type: 'Variable', name: 't' }, op: '-', right: { type: 'NumberLiteral', value: amount }
          });
          return this.execute(shifted);
        }

        if (lower === 'animate') {
          const states = this.animationStateNodes(args);
          const target = this.execute(states[0]);
          const interpreter = this;
          if (target?.isDiscreteSignal) {
            const animated = new DiscreteSignal(`animate(${target.name})`, k => {
              const frame = Math.min(interpreter.animationFrame, states.length - 1);
              const signal = interpreter.execute(states[frame]);
              if (!signal?.isDiscreteSignal) throw new Error(`animate() state ${frame} must be a discrete-time signal`);
              return signal.at(k);
            }, { indexName: target.indexName });
            animated.cache = { has: () => false, get: () => undefined, set: () => {} };
            animated.animated = true; animated.animationSequenceLength = states.length; animated.sourceName = target.name;
            return animated;
          }
          return this.execute(states[Math.min(this.animationFrame, states.length - 1)]);
        }

        if (lower === 'conv') {
          if (args.length < 2 || args.length > 3) throw new Error('conv() expects conv(x, h) or conv(x, h, window)');
          const first = this.execute(args[0]), second = this.execute(args[1]);
          if (!first?.isDiscreteSignal || !second?.isDiscreteSignal) throw new Error('conv() works on discrete-time signals such as x[n] = ...');
          const windowSize = args.length === 3 ? Math.round(requireReal(this.execute(args[2]), 'conv() window')) : 64;
          if (!(windowSize >= 0 && windowSize <= 5000)) throw new Error('conv() window must be between 0 and 5000');
          return new DiscreteSignal('conv', k => {
            let sum = 0;
            for (let m = -windowSize; m <= windowSize; m++) {
              const left = first.at(m);
              if (left === 0) continue;
              sum = addMathValues(sum, multiplyMathValues(left, second.at(k - m)));
            }
            return sum;
          }, { indexName: 'n' });
        }

        if (lower === 'forall') {
          if (args.length !== 3) throw new Error('forall() expects a variable, a finite set or range, and a condition');
          if (args[0]?.type !== 'Variable') throw new Error('forall() first argument must be a variable name');
          const collection = this.execute(args[1]);
          const values = collection?.isSet
            ? Array.from(collection.elements)
            : Array.isArray(collection) ? collection : null;
          if (!values) throw new Error('forall() expects a finite set or range as its second argument');
          for (const value of values) {
            const condition = evaluateWithVariable(args[0].name, value, () => this.execute(args[2]));
            if (!this.isTruthy(condition)) return 0.0;
          }
          return 1.0;
        }

        if (lower === 'type') {
          if (args.length !== 1) throw new Error('type() expects exactly one argument');
          const value = this.execute(args[0]);
          if (value === null) return 'null';
          if (isComplexNumber(value)) return 'complex';
          if (value?.isSet) return 'set';
          if (value?.isDiscreteSignal) return 'discrete signal';
          if (value?.isAxiomObject) return value.className || 'object';
          if (value instanceof SymbolicFunction) return 'function';
          if (value?.isFormulaValue) return 'formula';
          if (Array.isArray(value)) return Object.prototype.hasOwnProperty.call(value, 'variable') ? 'range' : 'array';
          return typeof value;
        }

        if (lower === 'integrate') {
          if (args.length !== 4 || !args[1] || args[1].type !== 'Variable') {
            throw new Error('integrate() expects integrate(expression, variable, from, to)');
          }
          zeroTimesInfinityDepth++;
          try {
          const substituteVariable = (node, variableName, replacement) => {
            if (!node || typeof node !== 'object') return node;
            if (node.type === 'Variable' && node.name === variableName) return replacement;
            if (Array.isArray(node)) return node.map(child => substituteVariable(child, variableName, replacement));
            const copy = { ...node };
            for (const [key, value] of Object.entries(node)) {
              if (value && typeof value === 'object') copy[key] = substituteVariable(value, variableName, replacement);
            }
            return copy;
          };
          const expandSymbolicCalls = (node) => {
            if (!node || typeof node !== 'object') return node;
            if (Array.isArray(node)) return node.map(expandSymbolicCalls);
            if (node.type === 'FunctionCall') {
              const callable = this.env[node.name];
              if (callable instanceof SymbolicFunction && node.args.length === 1) {
                return expandSymbolicCalls(substituteVariable(callable.expression, callable.variableName, node.args[0]));
              }
              const assignedSignal = this.env[`${node.name}_ast`];
              if (assignedSignal && node.args.length === 1) {
                return expandSymbolicCalls(substituteVariable(assignedSignal, 't', node.args[0]));
              }
              return { ...node, args: node.args.map(expandSymbolicCalls) };
            }
            const copy = { ...node };
            for (const [key, value] of Object.entries(node)) {
              if (value && typeof value === 'object') copy[key] = expandSymbolicCalls(value);
            }
            return copy;
          };
          const exprNode = expandSymbolicCalls(args[0]);
          const varNameNode = args[1];
          const varName = varNameNode.name || 't';
          const from = requireReal(this.execute(args[2]), 'integrate');
          const to = requireReal(this.execute(args[3]), 'integrate');
          if (Number.isNaN(from) || Number.isNaN(to)) throw new Error('integrate() bounds must be real numbers');

          const backendAntiderivative = tryBackendAntiderivative(exprNode, varName);
          if (backendAntiderivative) this.lastFormulaExpression = backendAntiderivative;
          const backendIntegral = tryBackendDefiniteIntegral(exprNode, varName, from, to);
          if (backendIntegral !== null) return backendIntegral;

          const evaluateAt = (val) => {
            return evaluateWithVariable(varName, val, () => this.execute(exprNode));
          };
          const expandProducts = (node) => {
            if (node.type === 'UnaryExpression' && node.op === '-') {
              return expandProducts(node.operand).map(term => ({ sign: -term.sign, factors: term.factors }));
            }
            if (node.type === 'BinaryExpression' && (node.op === '+' || node.op === '-')) {
              const leftTerms = expandProducts(node.left);
              const rightTerms = expandProducts(node.right).map(term => ({
                sign: node.op === '+' ? term.sign : -term.sign,
                factors: term.factors
              }));
              return [...leftTerms, ...rightTerms];
            }
            if (node.type === 'BinaryExpression' && node.op === '*') {
              const leftTerms = expandProducts(node.left);
              const rightTerms = expandProducts(node.right);
              if (leftTerms.length * rightTerms.length > 256) throw new Error('Integral expression expands into too many terms');
              return leftTerms.flatMap(left => rightTerms.map(right => ({
                sign: left.sign * right.sign,
                factors: [...left.factors, ...right.factors]
              })));
            }
            return [{ sign: 1, factors: [node] }];
          };
          const integralTerms = expandProducts(exprNode);
          const impulseTerms = integralTerms.flatMap(term => {
            const deltaIndices = term.factors
              .map((factor, index) => factor.type === 'FunctionCall' && factor.name.toLowerCase() === 'delta' ? index : -1)
              .filter(index => index >= 0);
            if (deltaIndices.length !== 1) return [];
            const deltaIndex = deltaIndices[0];
            return [{ sign: term.sign, rootExpression: term.factors[deltaIndex].args[0], factors: term.factors.filter((_, index) => index !== deltaIndex) }];
          });
          const getImpulseContributions = (impulse, start, stop) => {
            const roots = [];
            const addRoot = root => {
              if (Number.isFinite(root) && !roots.some(existing =>
                Math.abs(existing - root) <= 1e-7 * Math.max(1, Math.abs(root), Math.abs(existing)))) {
                roots.push(root);
              }
            };
            const evaluateRootExpression = (root, expression = impulse.rootExpression) =>
              requireReal(evaluateWithVariable(varName, root, () => this.execute(expression)), 'delta');
            let derivative;
            try {
              derivative = SymbolicEngine.diff(impulse.rootExpression, varName);
              if (Number.isFinite(start) && Number.isFinite(stop)) {
                const divisions = 2048;
                const step = (stop - start) / divisions;
                let left = start;
                let leftValue = evaluateRootExpression(left);
                if (Math.abs(leftValue) < 1e-10) addRoot(left);
                for (let index = 1; index <= divisions; index++) {
                  const right = index === divisions ? stop : start + index * step;
                  const rightValue = evaluateRootExpression(right);
                  if (Math.abs(rightValue) < 1e-10) addRoot(right);
                  if (Number.isFinite(leftValue) && Number.isFinite(rightValue) && leftValue * rightValue < 0) {
                    let low = left;
                    let high = right;
                    let lowValue = leftValue;
                    for (let iteration = 0; iteration < 60; iteration++) {
                      const middle = (low + high) / 2;
                      const middleValue = evaluateRootExpression(middle);
                      if (Math.abs(middleValue) < 1e-12 || high - low < 1e-12 * Math.max(1, Math.abs(middle))) {
                        low = high = middle;
                        break;
                      }
                      if (lowValue * middleValue < 0) high = middle;
                      else {
                        low = middle;
                        lowValue = middleValue;
                      }
                    }
                    addRoot((low + high) / 2);
                  }
                  left = right;
                  leftValue = rightValue;
                }
              } else {
                let root = 0;
                for (let iteration = 0; iteration < 40; iteration++) {
                  const value = evaluateRootExpression(root);
                  if (Math.abs(value) < 1e-10) break;
                  const slope = evaluateRootExpression(root, derivative);
                  if (!Number.isFinite(slope) || Math.abs(slope) < 1e-12) break;
                  root -= value / slope;
                  if (!Number.isFinite(root)) break;
                }
                if (Math.abs(evaluateRootExpression(root)) < 1e-7 && root >= start && root <= stop) addRoot(root);
              }
            } catch {
              throw new Error('integrate() supports delta() impulses with differentiable real arguments');
            }
            let contribution = 0;
            for (const root of roots) {
              let slope;
              try {
                const residual = evaluateRootExpression(root);
                if (Math.abs(residual) > 1e-7) continue;
                slope = evaluateRootExpression(root, derivative);
              } catch {
                throw new Error('integrate() supports delta() impulses with differentiable real arguments');
              }
              if (!Number.isFinite(slope) || Math.abs(slope) < 1e-12) continue;
              let value = impulse.sign / Math.abs(slope);
              const onBound = bound => Number.isFinite(bound) && Math.abs(root - bound) <= 1e-9 * Math.max(1, Math.abs(bound));
              if (onBound(start) || onBound(stop)) value *= 0.5;
              for (const factor of impulse.factors) {
                value = multiplyMathValues(value, evaluateWithVariable(varName, root, () => this.execute(factor)));
              }
              contribution = addMathValues(contribution, value);
            }
            return contribution;
          };
          const addImpulseContributions = (value, start, stop) => impulseTerms.reduce(
            (sum, impulse) => addMathValues(sum, getImpulseContributions(impulse, start, stop)),
            value
          );
          const isNumeric = v => typeof v === 'number' || isComplexNumber(v);
          const magnitude = v => isComplexNumber(v) ? Math.hypot(v.real, v.imaginary) : Math.abs(v);
          const isFiniteValue = v => isComplexNumber(v) ? (Number.isFinite(v.real) && Number.isFinite(v.imaginary)) : Number.isFinite(v);
          const GK_X = [0.991455371120812639206854697526329, 0.949107912342758524526189684047851, 0.864864423359769072789712788640926, 0.741531185599394439863864773280788, 0.586087235467691130294144838258730, 0.405845151377397166906606412076961, 0.207784955007898467600689403773245, 0];
          const GK_WK = [0.022935322010529224963732008058970, 0.063092092629978553290700663189204, 0.104790010322250183839876322541518, 0.140653259715525918745189590510238, 0.169004726639267902826583426598550, 0.190350578064785409913256402421014, 0.204432940075298892414161999234649, 0.209482141084727828012999174891714];
          const GK_WG = [0.129484966168869693270611432679082, 0.279705391489276667901467771423780, 0.381830050505118944950369775488975, 0.417959183673469387755102040816327];
          const MAX_EVALUATIONS = 120000;
          // Adaptive Gauss-Kronrod (G7/K15). `sample(x)` returns the integrand (already including any change-of-variable jacobian).
          const adaptiveIntegral = (sample, a, b, panels, locate) => {
            let nonFinite = 0;
            const safeSample = x => {
              const v = sample(x);
              if (!isNumeric(v)) throw new Error('integrate() integrand must evaluate to a number');
              if (!isFiniteValue(v)) { nonFinite++; return 0; }
              return v;
            };
            const span = b - a;
            const minWidth = Math.abs(span) * 1e-13;
            const panel = (lo, hi) => {
              const before = nonFinite;
              const c = 0.5 * (lo + hi), h = 0.5 * (hi - lo);
              const fc = safeSample(c);
              let rk = multiplyMathValues(GK_WK[7], fc);
              let rg = multiplyMathValues(GK_WG[3], fc);
              for (let j = 0; j < 7; j++) {
                const dx = h * GK_X[j];
                const pair = addMathValues(safeSample(c - dx), safeSample(c + dx));
                rk = addMathValues(rk, multiplyMathValues(GK_WK[j], pair));
                if (j % 2 === 1) rg = addMathValues(rg, multiplyMathValues(GK_WG[(j - 1) / 2], pair));
              }
              const value = multiplyMathValues(h, rk);
              const gauss = multiplyMathValues(h, rg);
              let error = magnitude(addMathValues(value, multiplyMathValues(-1, gauss)));
              if (nonFinite > before && Math.abs(hi - lo) > minWidth) error = Infinity;
              return { lo, hi, value, error };
            };
            let segments = [];
            for (let k = 0; k < panels; k++) segments.push(panel(a + span * k / panels, a + span * (k + 1) / panels));
            let evaluations = panels * 15;
            for (;;) {
              let totalError = 0, totalAbs = 0, worst = -1, worstError = -1;
              segments.forEach((segment, index) => {
                totalError += segment.error;
                totalAbs += magnitude(segment.value);
                if (Math.abs(segment.hi - segment.lo) > minWidth && segment.error > worstError) { worst = index; worstError = segment.error; }
              });
              if (totalError <= Math.max(1e-14, 1e-10 * totalAbs) || worst < 0) break;
              if (evaluations > MAX_EVALUATIONS) {
                if (totalError <= 1e-6 * Math.max(1e-12, totalAbs)) break;
                throw new Error('integrate() did not converge. The integrand may diverge, oscillate too fast, or have a non-integrable singularity inside the bounds; try narrower bounds.');
              }
              const target = segments[worst];
              const mid = 0.5 * (target.lo + target.hi);
              segments.splice(worst, 1, panel(target.lo, mid), panel(mid, target.hi));
              evaluations += 30;
            }
            // A divergent singularity keeps contributing at every scale; a convergent one fades away.
            const totalAbs = segments.reduce((sum, segment) => sum + magnitude(segment.value), 0);
            const fine = segments.filter(segment => Math.abs(segment.hi - segment.lo) <= 1e-12 * Math.abs(span));
            const offender = fine.find(segment => magnitude(segment.value) > 2e-4 * Math.max(1, totalAbs));
            if (offender) {
              const where = locate(0.5 * (offender.lo + offender.hi));
              throw new Error(`integrate() does not converge: the integral diverges or has a non-integrable singularity near ${varName} = ${Number.isFinite(where) ? Number(where.toPrecision(6)) : where}`);
            }
            return segments.reduce((sum, segment) => addMathValues(sum, segment.value), 0);
          };

          if (from === to) return 0;
          const direction = from < to ? 1 : -1;
          const lower = Math.min(from, to);
          const upper = Math.max(from, to);
          let result;

          if (Number.isFinite(lower) && Number.isFinite(upper)) {
            result = adaptiveIntegral(evaluateAt, lower, upper, 16, x => x);
            result = addImpulseContributions(result, lower, upper);
          } else {
            const divergentTails = [];
            const requireDecayingTail = (nearStart, nearEnd, farStart, farEnd) => {
              const peak = (from, to) => {
                let best = 0, last;
                for (let k = 0; k < 8; k++) {
                  last = evaluateAt(from + (to - from) * k / 7);
                  best = Math.max(best, magnitude(last));
                }
                return { best, last };
              };
              const inner = peak(nearStart, nearEnd), outer = peak(farStart, farEnd);
              if (!Number.isFinite(inner.best) || !Number.isFinite(outer.best) ||
                  (outer.best > 1e-10 && (inner.best <= 1e-10 || outer.best >= inner.best * 0.85))) {
                const innerValue = evaluateAt(nearStart), outerValue = evaluateAt(farStart);
                const sameRealTail = typeof innerValue === 'number' && typeof outerValue === 'number' &&
                  Math.abs(innerValue - outerValue) <= 1e-10 * Math.max(1, Math.abs(innerValue), Math.abs(outerValue)) &&
                  Math.abs(outerValue) > 1e-10;
                if (sameRealTail) { divergentTails.push(Math.sign(outerValue)); return; }
                throw new Error('integrate() infinite bounds require a decaying integrand; include a signal such as x(t)');
              }
            };
            const hi = Number.isFinite(upper) ? upper : 0, lo = Number.isFinite(lower) ? lower : 0;
            if (lower === -Infinity) requireDecayingTail(hi - 64, hi - 100, hi - 200, hi - 256);
            if (upper === Infinity) requireDecayingTail(lo + 64, lo + 100, lo + 200, lo + 256);
            const integrateMapped = (map, jacobian) => {
              const sample = u => {
                const x = map(u);
                const value = evaluateAt(x);
                if (!isFiniteValue(value) && Math.abs(x) > 1e8) return 0;
                return multiplyMathValues(value, jacobian(u));
              };
              return adaptiveIntegral(sample, 0, 1, 256, map);
            };
            if (divergentTails.length) {
              result = divergentTails.every(sign => sign === divergentTails[0])
                ? (divergentTails[0] > 0 ? Infinity : -Infinity)
                : NaN;
            } else if (lower === -Infinity && upper === Infinity) {
              result = integrateMapped(u => Math.tan(Math.PI * (u - 0.5)), u => Math.PI / Math.pow(Math.cos(Math.PI * (u - 0.5)), 2));
            } else if (Number.isFinite(lower) && upper === Infinity) {
              result = integrateMapped(u => lower + u / (1 - u), u => 1 / Math.pow(1 - u, 2));
            } else if (lower === -Infinity && Number.isFinite(upper)) {
              result = integrateMapped(u => upper - (1 - u) / u, u => 1 / (u * u));
            } else {
              throw new Error('integrate() requires ordered finite or infinite real bounds');
            }
            result = addImpulseContributions(result, lower, upper);
          }

          if (backendAntiderivative) this.lastFormulaExpression = backendAntiderivative;
          return multiplyMathValues(direction, result);
          } finally {
            zeroTimesInfinityDepth--;
          }
        }

        if (lower === 'diff') {
          let exprNode = args[0];
          const targetNode = args[1];
          let atVal = args.length >= 3 ? this.execute(args[2]) : null;
          const isSimpleVar = targetNode.type === 'Variable';
          const varName = isSimpleVar ? targetNode.name : 't';

          const substituteKnownVars = (node) => {
            if (!node) return node;
            if (node.type === 'IndexExpression') {
              const indexed = this.execute(node);
              if (indexed?.isFormulaValue) return substituteKnownVars(indexed.expression);
            }
            if (node.type === 'Variable' && node.name !== varName) {
              if (this.env[node.name]?.isFormulaValue) return this.env[node.name].expression;
              if (this.env[node.name + '_ast']) return this.env[node.name + '_ast'];
            }
            if (node.type === 'BinaryExpression') {
              return { ...node, left: substituteKnownVars(node.left), right: substituteKnownVars(node.right) };
            }
            if (node.type === 'UnaryExpression') {
              return { ...node, operand: substituteKnownVars(node.operand) };
            }
            if (node.type === 'AbsoluteValueExpression') {
              return { ...node, expression: substituteKnownVars(node.expression) };
            }
            if (node.type === 'FunctionCall') {
              const substituteIn = (tree, name, replacement) => {
                if (!tree || typeof tree !== 'object') return tree;
                if (Array.isArray(tree)) return tree.map(child => substituteIn(child, name, replacement));
                if (tree.type === 'Variable' && tree.name === name) return replacement;
                const copy = { ...tree };
                for (const [key, value] of Object.entries(tree)) if (value && typeof value === 'object') copy[key] = substituteIn(value, name, replacement);
                return copy;
              };
              const callable = this.env[node.name];
              if (callable instanceof SymbolicFunction && node.args.length === 1) {
                return substituteKnownVars(substituteIn(callable.expression, callable.variableName, node.args[0]));
              }
              const userFunction = this.functions.get(String(node.name).toLowerCase());
              if (userFunction) {
                const statements = userFunction.body?.body || [];
                if (statements.length !== 1 || statements[0].type !== 'ReturnStatement' || !statements[0].value ||
                    userFunction.parameters.length !== node.args.length) {
                  throw new Error(`diff() can only differentiate '${node.name}()' when its body is a single return expression`);
                }
                let body = statements[0].value;
                userFunction.parameters.forEach((parameter, index) => { body = substituteIn(body, parameter, node.args[index]); });
                return substituteKnownVars(body);
              }
              const assignedSignal = this.env[`${node.name}_ast`];
              if (assignedSignal && node.args.length === 1) return substituteKnownVars(substituteIn(assignedSignal, 't', node.args[0]));
              return { ...node, args: node.args.map(substituteKnownVars) };
            }
            if (node.type === 'TernaryExpression') {
              return { ...node, cond: substituteKnownVars(node.cond), trueBranch: substituteKnownVars(node.trueBranch), falseBranch: substituteKnownVars(node.falseBranch) };
            }
            if (node.type === 'SequenceExpression') {
              return {
                ...node,
                assignments: node.assignments?.map(a => ({ ...a, value: substituteKnownVars(a.value) })),
                result: substituteKnownVars(node.result)
              };
            }
            if (node.type === 'ChainComparison') {
              return { ...node, operands: node.operands.map(substituteKnownVars) };
            }
            if (node.type === 'SetLiteral') {
              return { ...node, items: node.items.map(substituteKnownVars) };
            }
            return node;
          };
          exprNode = substituteKnownVars(exprNode);

          if (!isSimpleVar) {
            const targetDerivAST = SymbolicEngine.simplify(SymbolicEngine.diff(targetNode, 't'));
            const exprDerivT_AST = SymbolicEngine.simplify(SymbolicEngine.diff(exprNode, 't'));

            const combinedDerivAST = SymbolicEngine.simplify(
              SymbolicEngine.bin(exprDerivT_AST, '/', targetDerivAST)
            );

            let formulaStr = SymbolicEngine.toPrettyMathString(combinedDerivAST);
            formulaStr = formulaStr.replace(/t\s*\^\s*2\s*\/\s*2/g, 'u');
            this.lastFormulaExpression = combinedDerivAST;

            if (atVal === null) return formulaStr;

            const h = 1e-5;
            const targetDerivativeAST = SymbolicEngine.simplify(SymbolicEngine.diff(targetNode, 't'));
            let t0 = atVal;
            let resolved = false;
            for (let i = 0; i < 100; i++) {
              const targetValue = evaluateWithVariable('t', t0, () => this.execute(targetNode));
              const error = targetValue - atVal;
              if (Number.isFinite(error) && Math.abs(error) <= 1e-10 * Math.max(1, Math.abs(atVal))) {
                resolved = true;
                break;
              }
              const slope = evaluateWithVariable('t', t0, () => this.execute(targetDerivativeAST));
              if (!Number.isFinite(error) || !Number.isFinite(slope) || Math.abs(slope) < 1e-12) break;
              t0 -= error / slope;
              if (!Number.isFinite(t0)) break;
            }
            if (!resolved) throw new Error('Unable to resolve differentiation point for target expression');

            const evalSample = (tVal) => {
              return evaluateWithVariable('t', tVal, () => ({
                f: this.execute(exprNode),
                u: this.execute(targetNode)
              }));
            };

            const p1 = evalSample(t0 + h);
            const p0 = evalSample(t0 - h);
            const df_dt = (p1.f - p0.f) / (2 * h);
            const du_dt = (p1.u - p0.u) / (2 * h);
            const df_du = df_dt / du_dt;

            return `${formulaStr} = ${formatRoundedValue(df_du)}`;
          }

          const backendDerivative = tryBackendDerivative(exprNode, varName);
          const rawDeriv = backendDerivative || SymbolicEngine.diff(exprNode, varName);
          const cleanDeriv = SymbolicEngine.simplify(rawDeriv);
          this.lastFormulaExpression = cleanDeriv;
          const formulaStr = SymbolicEngine.toPrettyMathString(cleanDeriv);

          if (atVal === null) return new SymbolicFunction(cleanDeriv, varName, formulaStr);

          const num = evaluateWithVariable(varName, atVal, () => this.execute(cleanDeriv));
          return `${formulaStr} = ${formatRoundedValue(num)}`;
        }

        if (lower === 'ft') {
          if (![3, 5].includes(args.length)) throw new Error('FT() expects signal, variable, omega, and optional start/end bounds');
          if (args[1]?.type !== 'Variable') throw new Error('FT() variable must be an identifier');
          const frequency = requireReal(this.execute(args[2]), 'FT');
          const from = args.length === 5 ? args[3] : { type: 'UnaryExpression', op: '-', operand: { type: 'Variable', name: 'inf' } };
          const to = args.length === 5 ? args[4] : { type: 'Variable', name: 'inf' };
          const timeVariable = { type: 'Variable', name: args[1].name };
          const imaginaryFrequency = SymbolicEngine.bin(
            SymbolicEngine.bin({ type: 'Variable', name: 'i' }, '*', SymbolicEngine.num(frequency)),
            '*',
            timeVariable
          );
          const kernel = { type: 'FunctionCall', name: 'exp', args: [{ type: 'UnaryExpression', op: '-', operand: imaginaryFrequency }] };
          const integrand = SymbolicEngine.bin(args[0], '*', kernel);
          return this.executeFunction('integrate', [integrand, args[1], from, to]);
        }

        if (lower === 'fs') {
          if (![4, 5].includes(args.length)) throw new Error('FS() expects signal, variable, period, harmonic, and optional start time');
          if (args[1]?.type !== 'Variable') throw new Error('FS() variable must be an identifier');
          const period = requireReal(this.execute(args[2]), 'FS');
          const harmonic = requireReal(this.execute(args[3]), 'FS');
          const start = args.length === 5 ? requireReal(this.execute(args[4]), 'FS') : 0;
          if (!Number.isFinite(period) || period <= 0) throw new Error('FS() period must be a positive finite number');
          if (!Number.isInteger(harmonic)) throw new Error('FS() harmonic must be an integer');
          const angularFrequency = (2 * Math.PI * harmonic) / period;
          const coefficient = this.executeFunction('ft', [
            args[0],
            args[1],
            SymbolicEngine.num(angularFrequency),
            SymbolicEngine.num(start),
            SymbolicEngine.num(start + period)
          ]);
          return divideMathValues(coefficient, period);
        }

        const assignedValue = this.env[name];
        if (assignedValue instanceof SymbolicFunction) {
          if (args.length !== 1) throw new Error(`${name}() expects one input argument`);
          const inputValue = this.execute(args[0]);
          if (assignedValue.domainType) {
            if (!isValueInMathType(inputValue, assignedValue.domainType)) {
              throw new Error(`${name}() argument is outside its declared domain`);
            }
          } else {
            requireReal(inputValue, name);
          }
          const result = assignedValue.evaluate(this, inputValue);
          if (assignedValue.rangeType && !isValueInMathType(result, assignedValue.rangeType)) {
            throw new Error(`${name}() result is outside its declared range`);
          }
          return result;
        }

        const assignedSignal = this.env[`${name}_ast`];
        if (assignedSignal) {
          if (args.length !== 1) throw new Error(`${name}() expects one time argument`);
          const time = requireReal(this.execute(args[0]), name);
          return evaluateWithVariable('t', time, () => this.execute(assignedSignal));
        }

        const evaluated = args.map(a => this.execute(a));
        // Preserve the final callable step for formula(...). Specialized
        // operations such as diff() and integrate() replace this with their
        // resolved symbolic result before returning.
        this.lastFormulaExpression = SymbolicEngine.fn(name, args);
        if (evaluated.some(value => value?.isFormulaValue)) {
          return new FormulaValue({ type: 'FunctionCall', name, args: evaluated.map(value =>
            value?.isFormulaValue ? value.expression : SymbolicEngine.num(value)) });
        }
        const x = evaluated[0] ?? 0;

        const statisticalFunctions = new Set([
          'count', 'sum', 'mean', 'median', 'mode', 'variance',
          'samplevariance', 'stddev', 'samplestddev',
          'quantile', 'percentile', 'min', 'max'
        ]);
        if (statisticalFunctions.has(lower)) {
          let values;
          let probability = null;
          if (lower === 'quantile' || lower === 'percentile') {
            if (evaluated.length < 2) throw new Error(`${name}() expects data and a probability`);
            probability = evaluated[evaluated.length - 1];
            values = collectStatisticsValues(name, evaluated.slice(0, -1));
            if (typeof probability !== 'number' || !Number.isFinite(probability)) {
              throw new Error(`${name}() probability must be a finite real number`);
            }
            const maximum = lower === 'percentile' ? 100 : 1;
            if (probability < 0 || probability > maximum) {
              throw new Error(`${name}() probability must be between 0 and ${maximum}`);
            }
            if (lower === 'percentile') probability /= 100;
          } else {
            values = collectStatisticsValues(name, evaluated);
          }

          if (lower === 'count') return values.length;
          if (lower === 'sum') {
            let total = 0;
            let compensation = 0;
            for (const value of values) {
              const adjusted = value - compensation;
              const nextTotal = total + adjusted;
              compensation = (nextTotal - total) - adjusted;
              total = nextTotal;
            }
            if (!Number.isFinite(total)) throw new Error(`${name}() result is outside the finite numeric range`);
            return total;
          }
          if (lower === 'min' || lower === 'max') {
            return values.reduce((current, value) => lower === 'min' ? Math.min(current, value) : Math.max(current, value), values[0]);
          }
          if (lower === 'mode') {
            const frequencies = new Map();
            values.forEach(value => frequencies.set(value, (frequencies.get(value) || 0) + 1));
            let mode = values[0];
            let frequency = 0;
            for (const [value, count] of frequencies) {
              if (count > frequency || (count === frequency && value < mode)) {
                mode = value;
                frequency = count;
              }
            }
            return mode;
          }

          const sorted = values.slice().sort((left, right) => left - right);
          if (lower === 'median') {
            const middle = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[middle] : sorted[middle - 1] / 2 + sorted[middle] / 2;
          }
          if (lower === 'quantile' || lower === 'percentile') {
            const position = probability * (sorted.length - 1);
            const lowerIndex = Math.floor(position);
            const upperIndex = Math.ceil(position);
            const fraction = position - lowerIndex;
            return sorted[lowerIndex] * (1 - fraction) + sorted[upperIndex] * fraction;
          }

          const scale = values.reduce((largest, value) => Math.max(largest, Math.abs(value)), 0) || 1;
          let runningMean = 0;
          let squaredDeviationTotal = 0;
          values.forEach((value, index) => {
            const normalizedValue = value / scale;
            const count = index + 1;
            const deviation = normalizedValue - runningMean;
            runningMean += deviation / count;
            squaredDeviationTotal += deviation * (normalizedValue - runningMean);
          });
          if (lower === 'mean') return runningMean * scale;
          const isSample = lower === 'samplevariance' || lower === 'samplestddev';
          if (isSample && values.length < 2) throw new Error(`${name}() requires at least two observations`);
          const divisor = isSample ? values.length - 1 : values.length;
          const normalizedVariance = Math.max(0, squaredDeviationTotal / divisor);
          if (lower === 'variance' || lower === 'samplevariance') {
            const variance = normalizedVariance * scale * scale;
            if (!Number.isFinite(variance)) throw new Error(`${name}() result is outside the finite numeric range`);
            return variance;
          }
          return Math.sqrt(normalizedVariance) * scale;
        }

        const UNARY_BUILTINS = new Set(['sin','cos','tan','sec','csc','cot','asin','acos','atan','sinh','cosh','tanh','asinh','acosh','atanh','exp','ln','log10','log2','sqrt','cbrt','abs','floor','ceil','trunc','sign','signum','sgn','deg','rad','real','imag','conj','arg','u','step','heaviside','delta','ramp','rect','tri']);
        if (UNARY_BUILTINS.has(lower) && args.length !== 1) throw new Error(`${name}() expects exactly one argument`);
        switch (lower) {
          case 'sin': return isComplexNumber(x) ? complexSin(x) : Math.sin(x);
          case 'cos': return isComplexNumber(x) ? complexCos(x) : Math.cos(x);
          case 'tan': return isComplexNumber(x) ? divideMathValues(complexSin(x), complexCos(x)) : Math.tan(x);
          case 'sec': return isComplexNumber(x) ? divideMathValues(1, complexCos(x)) : 1 / Math.cos(x);
          case 'csc': return isComplexNumber(x) ? divideMathValues(1, complexSin(x)) : 1 / Math.sin(x);
          case 'cot': return isComplexNumber(x) ? divideMathValues(complexCos(x), complexSin(x)) : 1 / Math.tan(x);
          case 'asin': return isComplexNumber(x) || x < -1 || x > 1 ? complexAsin(x) : Math.asin(x);
          case 'acos': return isComplexNumber(x) || x < -1 || x > 1 ? complexAcos(x) : Math.acos(x);
          case 'atan': return isComplexNumber(x) ? complexAtan(x) : Math.atan(x);
          case 'atan2': return Math.atan2(requireReal(evaluated[0], lower), requireReal(evaluated[1], lower));
          case 'sinh': return isComplexNumber(x) ? complexSinh(x) : Math.sinh(x);
          case 'cosh': return isComplexNumber(x) ? complexCosh(x) : Math.cosh(x);
          case 'tanh': return isComplexNumber(x) ? divideMathValues(complexSinh(x), complexCosh(x)) : Math.tanh(x);
          case 'asinh': return Math.asinh(requireReal(x, lower));
          case 'acosh': return Math.acosh(requireReal(x, lower));
          case 'atanh': return Math.atanh(requireReal(x, lower));
          case 'rect': return Math.abs(requireReal(x, lower)) <= 0.5 ? 1.0 : 0.0;
          case 'sinc': {
            const scaled = multiplyMathValues(Math.PI, x);
            if (!isComplexNumber(scaled) && Math.abs(scaled) < 1e-6) return 1.0;
            if (isComplexNumber(scaled) && scaled.real === 0 && scaled.imaginary === 0) return 1.0;
            return divideMathValues(isComplexNumber(scaled) ? complexSin(scaled) : Math.sin(scaled), scaled);
          }
          case 'u':
          case 'step':
          case 'heaviside': return requireReal(x, lower) >= 0 ? 1.0 : 0.0;
          case 'tri': return Math.abs(requireReal(x, lower)) <= 1.0 ? 1.0 - Math.abs(x) : 0.0;
          case 'ramp': return Math.max(0, requireReal(x, lower));
          case 'sawtooth': {
            const input = requireReal(x, lower);
            const period = requireReal(evaluated[1] ?? Math.PI * 2, lower);
            if (period <= 0) throw new Error('sawtooth() period must be positive');
            const phase = ((input / period) % 1 + 1) % 1;
            return 2 * phase - 1;
          }
          case 'square': {
            const input = requireReal(x, lower);
            const duty = requireReal(evaluated[1] ?? 0.5, lower);
            if (duty < 0 || duty > 1) throw new Error('square() duty must be between 0 and 1');
            const phase = ((input / (2 * Math.PI)) % 1 + 1) % 1;
            return phase < duty ? 1 : -1;
          }
          case 'pulse': {
            const input = requireReal(x, lower);
            const width = requireReal(evaluated[1] ?? 1, lower);
            if (width <= 0) throw new Error('pulse() width must be positive');
            return Math.abs(input) <= width / 2 ? 1 : 0;
          }
          case 'exp': return isComplexNumber(x) ? complexExp(x) : Math.exp(x);
          case 'abs': return isComplexNumber(x) ? Math.hypot(x.real, x.imaginary) : Math.abs(x);
          case 'real': return isComplexNumber(x) ? x.real : x;
          case 'imag': return isComplexNumber(x) ? x.imaginary : 0;
          case 'conj': return isComplexNumber(x) ? makeComplex(x.real, -x.imaginary) : x;
          case 'arg': return isComplexNumber(x) ? Math.atan2(x.imaginary, x.real) : (x < 0 ? Math.PI : 0);
          case 'ln': return isComplexNumber(x) || x < 0 ? complexLog(x) : Math.log(x);
          case 'log': {
            const numerator = isComplexNumber(x) || x < 0 ? complexLog(x) : Math.log(x);
            if (evaluated.length <= 1) return numerator;
            const base = evaluated[1];
            const denominator = isComplexNumber(base) || base < 0 ? complexLog(base) : Math.log(base);
            return divideMathValues(numerator, denominator);
          }
          case 'log10': return isComplexNumber(x) || x < 0 ? divideMathValues(complexLog(x), Math.LN10) : Math.log10(x);
          case 'log2': return isComplexNumber(x) || x < 0 ? divideMathValues(complexLog(x), Math.LN2) : Math.log2(x);
          case 'sqrt': return isComplexNumber(x) || x < 0 ? complexSqrt(x) : Math.sqrt(x);
          case 'cbrt': return isComplexNumber(x) ? complexPower(x, 1 / 3) : Math.cbrt(x);
          case 'floor': return Math.floor(requireReal(x, lower));
          case 'ceil': return Math.ceil(requireReal(x, lower));
          case 'trunc': return Math.trunc(requireReal(x, lower));
          case 'round': {
            requireReal(x, lower);
            const digits = evaluated[1] ?? 0;
            const factor = Math.pow(10, digits);
            return Math.round(x * factor) / factor;
          }
          case 'sign':
          case 'signum':
          case 'sgn': return Math.sign(requireReal(x, lower));
          case 'pow': return complexPower(evaluated[0], evaluated[1]);
          case 'hypot':
            evaluated.forEach(value => requireReal(value, lower));
            return Math.hypot(...evaluated);
          case 'clamp':
            if (evaluated.length !== 3) throw new Error('clamp() expects value, minimum, maximum');
            evaluated.forEach(value => requireReal(value, lower));
            return Math.min(evaluated[2], Math.max(evaluated[1], evaluated[0]));
          case 'deg': return multiplyMathValues(x, 180 / Math.PI);
          case 'rad': return multiplyMathValues(x, Math.PI / 180);
          case 'delta': {
            if (this.discreteEvaluation) return requireReal(x, lower) === 0 ? 1 : 0;
            const width = this.deltaWidth;
            if (!(width > 0 && Number.isFinite(width))) return requireReal(x, lower) === 0 ? 1 : 0;
            const scaled = requireReal(x, lower) / width;
            return Math.exp(-0.5 * scaled * scaled) / (Math.sqrt(2 * Math.PI) * width);
          }
          default: throw new Error(`Unknown function ${name}()`);
        }
      }
    }
