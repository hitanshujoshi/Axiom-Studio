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
        if (a.type === 'AbsoluteValueExpression') return this.areNodesIdentical(a.expression, b.expression);
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
            case 'AbsoluteValueExpression':
              return this.bin(this.fn('sign', [node.expression]), '*', this.diff(node.expression, varName));
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
                  if (expression.type === 'AbsoluteValueExpression') return hasFreeVariable(expression.expression, targetName, boundName);
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
              else if (name === 'deg') outer = { type: 'NumberLiteral', value: 180 / Math.PI };
              else if (name === 'rad') outer = { type: 'NumberLiteral', value: Math.PI / 180 };
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
                throw Object.assign(new Error(`diff() does not know how to differentiate ${node.name}(); define it as a function or use a built-in`), { axiomDiff: true });
              }
              if (name === 'abs') return outer;
              return this.bin(outer, '*', du);
            }
          }
        } catch (e) {
          if (e && e.axiomDiff) throw e;
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

        if (node.type === 'AbsoluteValueExpression') {
          const expression = this.simplify(node.expression);
          if (expression.type === 'NumberLiteral') return this.num(Math.abs(expression.value));
          return { type: 'AbsoluteValueExpression', expression };
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
          case 'AbsoluteValueExpression': return `|${this.toPrettyMathString(node.expression, 0)}|`;
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
          case 'UnaryExpression': return node.op === 'not'
            ? `not ${this.toPrettyMathString(node.operand, 4)}`
            : `-${this.toPrettyMathString(node.operand, 4)}`;
          case 'FunctionCall': return `${node.name}(${node.args.map(a => this.toPrettyMathString(a, 0)).join(', ')})`;
          case 'SetLiteral': return `{${node.items.map(item => this.toPrettyMathString(item, 0)).join(', ')}}`;
          case 'SequenceSetLiteral': return `{${node.items.map(item => this.toPrettyMathString(item, 0)).join(', ')}}`;
          case 'IndexExpression': return `${this.toPrettyMathString(node.object, 4)}[${this.toPrettyMathString(node.index, 0)}]`;
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

    /* ========================================================================
       EXTERNAL MATH BACKEND ADAPTER
       Axiom keeps its parser, syntax, signals, and teaching semantics. This
       adapter delegates ordinary scalar calculus to Nerdamer when available,
       while preserving the local implementation as a safe fallback for
       Axiom-specific signals and unsupported expressions.
    ======================================================================== */
    function axiomAstToBackendText(node) {
      if (!node) return null;
      switch (node.type) {
        case 'NumberLiteral': return String(node.value);
        case 'Variable': return node.name;
        case 'UnaryExpression': {
          const operand = axiomAstToBackendText(node.operand);
          return operand === null ? null : `(${node.op === '-' ? '-' : ''}${operand})`;
        }
        case 'AbsoluteValueExpression': {
          const expression = axiomAstToBackendText(node.expression);
          return expression === null ? null : `abs(${expression})`;
        }
        case 'BinaryExpression': {
          const left = axiomAstToBackendText(node.left);
          const right = axiomAstToBackendText(node.right);
          return left === null || right === null ? null : `(${left})${node.op}(${right})`;
        }
        case 'FunctionCall': {
          const args = node.args.map(axiomAstToBackendText);
          if (args.some(argument => argument === null)) return null;
          const aliases = { ln: 'log', u: 'heaviside', step: 'heaviside', signum: 'sign', sgn: 'sign' };
          const lowerName = node.name.toLowerCase();
          const supported = new Set(['abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'cos', 'cosh', 'cot', 'csc', 'exp', 'floor', 'ln', 'log', 'log10', 'max', 'min', 'pow', 'sec', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'ceil', 'round', 'trunc']);
          if (lowerName === 'cbrt') return `(${args[0]})^(1/3)`;
          if (lowerName === 'log2') return `(log(${args[0]}))/(log(2))`;
          if (lowerName === 'deg') return `((${args[0]})*180)/pi`;
          if (lowerName === 'rad') return `((${args[0]})*pi)/180`;
          if (lowerName === 'hypot') return `sqrt(${args.map(argument => `(${argument})^2`).join('+')})`;
          const name = aliases[lowerName] || node.name;
          if (!supported.has(lowerName) || ['delta', 'rect', 'pulse', 'tri', 'ramp', 'square', 'sawtooth'].includes(lowerName)) return null;
          return `${name}(${args.join(',')})`;
        }
        default: return null;
      }
    }

    function parseBackendExpression(text) {
      if (!text || typeof text !== 'string') return null;
      try {
        const statements = parseSource(`${text};`);
        const expression = statements[0];
        return expression && !expression.type.endsWith('Statement') ? expression : null;
      } catch {
        return null;
      }
    }

    function tryBackendDerivative(node, variableName) {
      if (typeof nerdamer !== 'function') return null;
      const expression = axiomAstToBackendText(node);
      if (!expression) return null;
      try {
        const result = nerdamer.diff(expression, variableName);
        const text = result.text();
        if (/\b(diff|integrate|sech|csch|coth)\s*\(/i.test(text) || /\b(diff|integrate|sech|csch|coth)\b/i.test(text)) return null;
        return parseBackendExpression(text);
      } catch {
        return null;
      }
    }

    function tryBackendAntiderivative(node, variableName) {
      if (typeof nerdamer !== 'function' || typeof nerdamer.integrate !== 'function') return null;
      const expression = axiomAstToBackendText(node);
      if (!expression) return null;
      try {
        const result = nerdamer.integrate(expression, variableName);
        const text = result.text();
        if (/\b(integrate|diff)\s*\(/i.test(text)) return null;
        return parseBackendExpression(text);
      } catch {
        return null;
      }
    }

    function tryBackendFormula(node) {
      if (typeof nerdamer !== 'function' || !node) return null;
      if (node.type === 'FunctionCall') {
        const lowerName = node.name.toLowerCase();
        if (lowerName === 'diff' && node.args.length >= 2) {
          const variableName = node.args[1]?.type === 'Variable' ? node.args[1].name : 't';
          return tryBackendDerivative(node.args[0], variableName);
        }
        if (lowerName === 'integrate' && node.args.length === 4 && node.args[1]?.type === 'Variable') {
          return tryBackendAntiderivative(node.args[0], node.args[1].name);
        }
      }
      const expression = axiomAstToBackendText(node);
      if (!expression) return null;
      try {
        const result = nerdamer(expression);
        const text = result.text();
        if (/\b(diff|integrate|defint|sech|csch|coth)\s*\(/i.test(text)) return null;
        return parseBackendExpression(text);
      } catch {
        return null;
      }
    }

    function tryBackendDefiniteIntegral(node, variableName, from, to) {
      if (typeof nerdamer !== 'function' || typeof nerdamer.defint !== 'function') return null;
      const expression = axiomAstToBackendText(node);
      if (!expression || !Number.isFinite(from) && from !== -Infinity || !Number.isFinite(to) && to !== Infinity) return null;
      try {
        const result = nerdamer.defint(expression, variableName, String(from), String(to));
        const text = typeof result?.text === 'function' ? result.text() : String(result);
        const numeric = Number(text);
        return Number.isFinite(numeric) ? numeric : null;
      } catch {
        return null;
      }
    }
