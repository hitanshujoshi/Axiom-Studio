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
        case 'WHOLE': return Number.isInteger(value) && value >= 0;
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

    function formatSetValue(value) {
      const values = Array.from(value.elements).map(item => isComplexNumber(item) ? item.toString() : String(item));
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
      if (!isComplexNumber(left) && !isComplexNumber(right)) return left + right;
      const a = asComplex(left), b = asComplex(right);
      return makeComplex(a.real + b.real, a.imaginary + b.imaginary);
    }

    function subtractMathValues(left, right) {
      if (!isComplexNumber(left) && !isComplexNumber(right)) return left - right;
      const a = asComplex(left), b = asComplex(right);
      return makeComplex(a.real - b.real, a.imaginary - b.imaginary);
    }

    function multiplyMathValues(left, right) {
      if (!isComplexNumber(left) && !isComplexNumber(right)) return left * right;
      const a = asComplex(left), b = asComplex(right);
      return makeComplex(a.real * b.real - a.imaginary * b.imaginary, a.real * b.imaginary + a.imaginary * b.real);
    }

    function divideMathValues(left, right) {
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
      if (!values.length) throw new Error(`${name}() expects at least one observation`);
      return values.map((value, index) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new Error(`${name}() observation ${index + 1} must be a finite real number`);
        }
        return value;
      });
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
        this.plots = [];
        this.functions = new Map();
        this.classes = new Map();
        this.loopDepth = 0;
        this.switchDepth = 0;
        this.functionDepth = 0;
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
          (condition.op === 'in' || condition.op === 'belongsto') &&
          condition.left.type === 'Variable' && condition.left.name === node.resultName);
        const resultType = membership ? this.execute(membership.right) : null;
        if (!resultType?.isMathSetType || !['N', 'WHOLE', 'Z'].includes(resultType.name)) {
          throw new Error('Finite set-builder results currently require the output to belong to N, WHOLE, or Z');
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
      callUserFunction(definition, argumentNodes, instance = null) {
        if (argumentNodes.length !== definition.parameters.length) {
          throw new Error(`${definition.name}() expects ${definition.parameters.length} arguments, got ${argumentNodes.length}`);
        }
        const argumentsEvaluated = argumentNodes.map(argument => this.execute(argument));
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
            this.env[node.name] = val;
            return val;
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
            this.logs.push(ev.map(value => isComplexNumber(value) ? value.toString() : value).join(' '));
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
              else if (op === 'in' || op === 'belongsto') ok = testMembership(a, b);
              if (!ok) return 0.0;
            }
            return 1.0;
          }
          case 'BinaryExpression': {
            if (node.op === 'and') {
              const left = this.execute(node.left);
              return Boolean(left) ? (Boolean(this.execute(node.right)) ? 1.0 : 0.0) : 0.0;
            }
            if (node.op === 'or') {
              const left = this.execute(node.left);
              return Boolean(left) ? 1.0 : (Boolean(this.execute(node.right)) ? 1.0 : 0.0);
            }
            const l = this.execute(node.left), r = this.execute(node.right);
            if ((isComplexNumber(l) || isComplexNumber(r)) && ['<', '<=', '>', '>='].includes(node.op)) {
              throw new Error('Complex numbers cannot be ordered or tested for set membership');
            }
            if (node.op === '<') return l < r ? 1.0 : 0.0;
            if (node.op === '<=') return l <= r ? 1.0 : 0.0;
            if (node.op === '>') return l > r ? 1.0 : 0.0;
            if (node.op === '>=') return l >= r ? 1.0 : 0.0;
            if (node.op === '==') return (isComplexNumber(l) || isComplexNumber(r) ? complexEqual(l, r) : l === r) ? 1.0 : 0.0;
            if (node.op === '!=') return (isComplexNumber(l) || isComplexNumber(r) ? !complexEqual(l, r) : l !== r) ? 1.0 : 0.0;
            if (node.op === 'in' || node.op === 'belongsto') return testMembership(l, r) ? 1.0 : 0.0;
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
          case 'FunctionCall': return this.executeFunction(node.name, node.args);
        }
      }

      executeFunction(name, args) {
        const lower = name.toLowerCase();
        const evaluateWithVariable = (varName, value, callback) => {
          const hadOwnValue = Object.prototype.hasOwnProperty.call(this.env, varName);
          const oldValue = this.env[varName];
          this.env[varName] = value;
          try {
            return callback();
          } finally {
            if (hadOwnValue) this.env[varName] = oldValue;
            else delete this.env[varName];
          }
        };

        const userFunction = this.functions.get(lower);
        if (userFunction) return this.callUserFunction(userFunction, args);

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

        if (lower === 'type') {
          if (args.length !== 1) throw new Error('type() expects exactly one argument');
          const value = this.execute(args[0]);
          if (value === null) return 'null';
          if (isComplexNumber(value)) return 'complex';
          if (value?.isSet) return 'set';
          if (value?.isAxiomObject) return value.className || 'object';
          if (value instanceof SymbolicFunction) return 'function';
          if (Array.isArray(value)) return Object.prototype.hasOwnProperty.call(value, 'variable') ? 'range' : 'array';
          return typeof value;
        }

        if (lower === 'integrate') {
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
          const simpson = (sample, start, stop, steps) => {
            const h = (stop - start) / steps;
            let sum = addMathValues(sample(start), sample(stop));
            for (let i = 1; i < steps; i += 2) sum = addMathValues(sum, multiplyMathValues(4, sample(start + i * h)));
            for (let i = 2; i < steps - 1; i += 2) sum = addMathValues(sum, multiplyMathValues(2, sample(start + i * h)));
            return multiplyMathValues(h / 3, sum);
          };

          if (from === to) return 0;
          const direction = from < to ? 1 : -1;
          const lower = Math.min(from, to);
          const upper = Math.max(from, to);
          let result;

          if (Number.isFinite(lower) && Number.isFinite(upper)) {
            result = simpson(evaluateAt, lower, upper, 1000);
            result = addImpulseContributions(result, lower, upper);
          } else {
            const steps = 4000;
            const epsilon = 1e-5;
            const magnitude = value => isComplexNumber(value) ? Math.hypot(value.real, value.imaginary) : Math.abs(value);
            const requireDecayingTail = (innerPoint, outerPoint) => {
              const innerMagnitude = magnitude(evaluateAt(innerPoint));
              const outerMagnitude = magnitude(evaluateAt(outerPoint));
              if (!Number.isFinite(innerMagnitude) || !Number.isFinite(outerMagnitude) ||
                  (outerMagnitude > 1e-10 && (innerMagnitude <= 1e-10 || outerMagnitude >= innerMagnitude * 0.85))) {
                throw new Error('integrate() infinite bounds require a decaying integrand; include a signal such as x(t)');
              }
            };
            if (lower === -Infinity) requireDecayingTail(Number.isFinite(upper) ? upper - 64 : -64, Number.isFinite(upper) ? upper - 256 : -256);
            if (upper === Infinity) requireDecayingTail(Number.isFinite(lower) ? lower + 64 : 64, Number.isFinite(lower) ? lower + 256 : 256);
            const integrateMapped = (map, jacobian, start, stop) => {
              const sample = (u) => multiplyMathValues(evaluateAt(map(u)), jacobian(u));
              return simpson(sample, start, stop, steps);
            };

            if (lower === -Infinity && upper === Infinity) {
              result = integrateMapped(
                u => Math.tan(Math.PI * (u - 0.5)),
                u => Math.PI / Math.pow(Math.cos(Math.PI * (u - 0.5)), 2),
                epsilon,
                1 - epsilon
              );
            } else if (Number.isFinite(lower) && upper === Infinity) {
              result = integrateMapped(
                u => lower + u / (1 - u),
                u => 1 / Math.pow(1 - u, 2),
                0,
                1 - epsilon
              );
            } else if (lower === -Infinity && Number.isFinite(upper)) {
              result = integrateMapped(
                u => upper - (1 - u) / u,
                u => 1 / (u * u),
                epsilon,
                1
              );
            } else {
              throw new Error('integrate() requires ordered finite or infinite real bounds');
            }
            result = addImpulseContributions(result, lower, upper);
          }

          return multiplyMathValues(direction, result);
        }

        if (lower === 'diff') {
          let exprNode = args[0];
          const targetNode = args[1];
          let atVal = args.length >= 3 ? this.execute(args[2]) : null;
          const isSimpleVar = targetNode.type === 'Variable';
          const varName = isSimpleVar ? targetNode.name : 't';

          const substituteKnownVars = (node) => {
            if (!node) return node;
            if (node.type === 'Variable' && node.name !== varName && this.env[node.name + '_ast']) {
              return this.env[node.name + '_ast'];
            }
            if (node.type === 'BinaryExpression') {
              return { ...node, left: substituteKnownVars(node.left), right: substituteKnownVars(node.right) };
            }
            if (node.type === 'UnaryExpression') {
              return { ...node, operand: substituteKnownVars(node.operand) };
            }
            if (node.type === 'FunctionCall') {
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

          const rawDeriv = SymbolicEngine.diff(exprNode, varName);
          const cleanDeriv = SymbolicEngine.simplify(rawDeriv);
          const formulaStr = SymbolicEngine.toPrettyMathString(cleanDeriv);

          if (atVal === null) return new SymbolicFunction(cleanDeriv, varName, formulaStr);

          const num = evaluateWithVariable(varName, atVal, () => this.execute(cleanDeriv));
          return `${formulaStr} = ${formatRoundedValue(num)}`;
        }

        if (lower === 'ft' || lower === 'fouriertransform') {
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

        if (lower === 'fs' || lower === 'fourierseries') {
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
        const x = evaluated[0] ?? 0;

        const statisticalFunctions = new Set([
          'count', 'sum', 'mean', 'average', 'median', 'mode', 'variance', 'populationvariance',
          'samplevariance', 'stddev', 'standarddeviation', 'samplestddev', 'samplestandarddeviation',
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
          if (lower === 'mean' || lower === 'average') return runningMean * scale;
          const isSample = lower === 'samplevariance' || lower === 'samplestddev' || lower === 'samplestandarddeviation';
          if (isSample && values.length < 2) throw new Error(`${name}() requires at least two observations`);
          const divisor = isSample ? values.length - 1 : values.length;
          const normalizedVariance = Math.max(0, squaredDeviationTotal / divisor);
          if (lower === 'variance' || lower === 'populationvariance' || lower === 'samplevariance') {
            const variance = normalizedVariance * scale * scale;
            if (!Number.isFinite(variance)) throw new Error(`${name}() result is outside the finite numeric range`);
            return variance;
          }
          return Math.sqrt(normalizedVariance) * scale;
        }

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
          case 'deg':
          case 'degrees': return multiplyMathValues(x, 180 / Math.PI);
          case 'rad':
          case 'radians': return multiplyMathValues(x, Math.PI / 180);
          case 'delta': {
            const width = this.deltaWidth;
            if (!(width > 0 && Number.isFinite(width))) return 0;
            const scaled = requireReal(x, lower) / width;
            return Math.exp(-0.5 * scaled * scaled) / (Math.sqrt(2 * Math.PI) * width);
          }
          default: throw new Error(`Unknown function ${name}()`);
        }
      }
    }

    /* ==========================================================================
       7. MULTI-CHANNEL OSCILLOSCOPE (TRUE 2D TIME & FREQ INSPECTOR)
       ========================================================================== */
