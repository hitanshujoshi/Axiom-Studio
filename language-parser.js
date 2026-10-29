/* ==========================================================================
4. LEXER & PARSER
       ========================================================================== */
    const TT = {
      LET: 'LET', PRINT: 'PRINT', UNION: 'UNION', INTERSECT: 'INTERSECT',
      FUNCTION: 'FUNCTION', CLASS: 'CLASS', NEW: 'NEW', RETURN: 'RETURN', IF: 'IF', ELSE: 'ELSE', WHILE: 'WHILE', FOR: 'FOR',
      SWITCH: 'SWITCH', CASE: 'CASE', DEFAULT: 'DEFAULT', BREAK: 'BREAK', CONTINUE: 'CONTINUE',
      INCREMENT: 'INCREMENT', DECREMENT: 'DECREMENT',
      ADD_ASSIGN: 'ADD_ASSIGN', SUB_ASSIGN: 'SUB_ASSIGN', MUL_ASSIGN: 'MUL_ASSIGN', DIV_ASSIGN: 'DIV_ASSIGN',
      AND: 'AND', OR: 'OR', NOT: 'NOT', OTHERWISE: 'OTHERWISE',
      IN: 'IN', IS: 'IS', NULL: 'NULL',
      ARROW: 'ARROW', ELLIPSIS: 'ELLIPSIS', TRUE: 'TRUE', FALSE: 'FALSE', LBRACKET: '[', RBRACKET: ']',
      IDENTIFIER: 'IDENTIFIER', NUMBER: 'NUMBER', STRING: 'STRING',
      PLUS: '+', MINUS: '-', MUL: '*', DIV: '/', MOD: '%', POW: '^',
      ASSIGN: '=', COLON: ':', QUESTION: '?', SEMICOLON: ';', COMMA: ',', DOT: '.', BAR: '|',
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
          if (this.c === '#' || (this.c === '/' && this.peek() === '/')) {
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
          if (this.c === '\u2203') { this.advance(); pushToken({ type: TT.IDENTIFIER, value: '\u2203' }); continue; }
          if (this.c === '"' || this.c === "'") { pushToken(this.readString()); continue; }
          if (/\d/.test(this.c) || (this.c === '.' && /\d/.test(this.peek() || ''))) { pushToken(this.readNumber()); continue; }
          if (/[a-zA-Z_\u03B4\u0394]/.test(this.c)) { pushToken(this.readId()); continue; }

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
          if ((c === '+' || c === '-' || c === '*' || c === '/') && this.peek() === '=') {
            this.advance();
            this.advance();
            const compoundTypes = { '+': TT.ADD_ASSIGN, '-': TT.SUB_ASSIGN, '*': TT.MUL_ASSIGN, '/': TT.DIV_ASSIGN };
            pushToken({ type: compoundTypes[c], value: `${c}=` });
            continue;
          }
          if (c === '=' && this.peek() === '=') { this.advance(); this.advance(); pushToken({ type: TT.EQ, value: '==' }); continue; }
          if (c === '<' && this.peek() === '=') { this.advance(); this.advance(); pushToken({ type: TT.LTE, value: '<=' }); continue; }
          if (c === '>' && this.peek() === '=') { this.advance(); this.advance(); pushToken({ type: TT.GTE, value: '>=' }); continue; }
          if (c === '!' && this.peek() === '=') { this.advance(); this.advance(); pushToken({ type: TT.NEQ, value: '!=' }); continue; }
          if (c === '\u2260') { this.advance(); pushToken({ type: TT.NEQ, value: '!=' }); continue; }
          if (c === '!') { this.advance(); pushToken({ type: TT.NOT, value: 'not' }); continue; }
          if (c === '\u2264') { this.advance(); pushToken({ type: TT.LTE, value: '<=' }); continue; }
          if (c === '\u2265') { this.advance(); pushToken({ type: TT.GTE, value: '>=' }); continue; }
          if (c === '\u2264') { this.advance(); pushToken({ type: TT.LTE, value: '<=' }); continue; }
          if (c === '\u2265') { this.advance(); pushToken({ type: TT.GTE, value: '>=' }); continue; }
          if (c === '\u2260') { this.advance(); pushToken({ type: TT.NEQ, value: '!=' }); continue; }
          if (c === '\u00D7' || c === '\u00B7') { this.advance(); pushToken({ type: TT.MUL, value: '*' }); continue; }
          if (c === '\u00F7') { this.advance(); pushToken({ type: TT.DIV, value: '/' }); continue; }
          if (c === '\u2212') { this.advance(); pushToken({ type: TT.MINUS, value: '-' }); continue; }
          if (c === '\u221E') { this.advance(); pushToken({ type: TT.IDENTIFIER, value: 'inf' }); continue; }
          if (c === '*' && this.peek() === '*') { this.advance(); this.advance(); pushToken({ type: TT.POW, value: '^' }); continue; }

          const singles = {
            '+': TT.PLUS, '-': TT.MINUS, '*': TT.MUL, '/': TT.DIV, '%': TT.MOD, '^': TT.POW,
            '=': TT.ASSIGN, ':': TT.COLON, '?': TT.QUESTION, ';': TT.SEMICOLON, ',': TT.COMMA, '.': TT.DOT,
            '[': TT.LBRACKET, ']': TT.RBRACKET,
            '(': TT.LPAREN, ')': TT.RPAREN, '{': TT.LBRACE, '}': TT.RBRACE,
            '<': TT.LT, '>': TT.GT, '|': TT.BAR
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
        if (this.c === 'e' || this.c === 'E') {
          const n1 = this.src[this.pos + 1] || '', n2 = this.src[this.pos + 2] || '';
          if (/\d/.test(n1) || ((n1 === '+' || n1 === '-') && /\d/.test(n2))) {
            r += 'e'; this.advance();
            if (this.c === '+' || this.c === '-') { r += this.c; this.advance(); }
            while (this.c !== null && /\d/.test(this.c)) { r += this.c; this.advance(); }
          }
        }
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
        while (this.c !== null && /[a-zA-Z0-9_\u03B4\u0394]/.test(this.c)) { r += this.c; this.advance(); }
        const lower = r.toLowerCase();
        if (lower === 'null') return { type: TT.NULL, value: null };
        if (lower === 'true') return { type: TT.TRUE, value: true };
        if (lower === 'false') return { type: TT.FALSE, value: false };
        const kw = {
          'let': TT.LET, 'print': TT.PRINT, 'function': TT.FUNCTION, 'fn': TT.FUNCTION,
          'class': TT.CLASS, 'new': TT.NEW,
          'return': TT.RETURN, 'if': TT.IF, 'else': TT.ELSE, 'while': TT.WHILE, 'for': TT.FOR,
          'switch': TT.SWITCH, 'case': TT.CASE, 'default': TT.DEFAULT,
          'break': TT.BREAK, 'continue': TT.CONTINUE, 'in': TT.IN, 'is': TT.IS,
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

      endStatement() {
        if (this.match(TT.SEMICOLON)) return;
        const prev = this.tokens[this.idx - 1], next = this.peek();
        if (!prev || next.type === TT.EOF || next.type === TT.RBRACE || prev.type === TT.RBRACE ||
            next.type === TT.CASE || next.type === TT.DEFAULT) return;
        if (next.line === prev.line) {
          throw new Error(`Unexpected '${next.value}' after a complete statement. Separate statements with ; or a new line (write 2*x or 2x for multiplication).`);
        }
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
            this.endStatement();
          } catch (error) {
            throw attachSourceLocation(error, this.peek());
          }
        }
        return stmts;
      }
      parseStatement() {
        if (this.match(TT.CLASS)) return this.parseClassDeclaration();
        if (this.match(TT.FUNCTION)) return this.parseFunctionDeclaration();
        {
          const at = offset => this.tokens[this.idx + offset]?.type;
          if (at(0) === TT.IDENTIFIER && at(1) === TT.LBRACKET && at(2) === TT.IDENTIFIER && at(3) === TT.RBRACKET &&
              (at(4) === TT.ASSIGN || at(4) === TT.COLON)) {
            return this.parseDiscreteSignalDefinition();
          }
        }
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
          const printOpened = this.match(TT.LPAREN);
          const args = [];
          if (this.peek().type !== TT.RPAREN) {
            args.push(this.parseExpression());
            while (this.match(TT.COMMA)) args.push(this.parseExpression());
          }
          if (printOpened) this.expect(TT.RPAREN, 'Expected ) after print arguments');
          return { type: 'PrintStatement', args };
        }
        if (this.match(TT.LET)) {
          const id = this.advance().value;
          this.expect(TT.ASSIGN, `Expected = after 'let ${id}'`);
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
        if (this.peek().type === TT.IDENTIFIER && [TT.ASSIGN, TT.ADD_ASSIGN, TT.SUB_ASSIGN, TT.MUL_ASSIGN, TT.DIV_ASSIGN].includes(this.tokens[this.idx + 1]?.type)) {
          const id = this.advance().value;
          const assignmentType = this.advance().type;
          const expr = this.parseExpression();
          if (assignmentType === TT.ASSIGN) return { type: 'AssignStatement', name: id, expr };
          const operators = {
            [TT.ADD_ASSIGN]: '+',
            [TT.SUB_ASSIGN]: '-',
            [TT.MUL_ASSIGN]: '*',
            [TT.DIV_ASSIGN]: '/'
          };
          return { type: 'CompoundAssignStatement', name: id, operator: operators[assignmentType], expr };
        }
        const expression = this.parseExpression();
        if (this.match(TT.ASSIGN)) {
          const value = this.parseExpression();
          if (expression.type === 'AbsoluteValueExpression' && expression.expression.type === 'Variable') {
            return { type: 'AbsoluteValueAssignment', name: expression.expression.name, value };
          }
          throw new Error('Assignment target must be a variable; |variable| = value solves for both signed values');
        }
        return expression;
      }
      parseDiscreteSignalDefinition() {
        // x[n] = expr      or      x[n]: Z -> R, x[n] = expr
        const name = this.advance().value;
        this.advance();
        const indexName = this.advance().value;
        this.advance();
        let domain = null, range = null;
        if (this.match(TT.COLON)) {
          domain = this.parseTypeSpec();
          this.expect(TT.ARROW, 'Expected -> between the signal domain and range');
          range = this.parseTypeSpec();
          this.expect(TT.COMMA, 'Expected , before the signal definition');
          const again = this.expect(TT.IDENTIFIER, `Expected ${name}[${indexName}] = ...`).value;
          if (again !== name) throw new Error(`Signal name '${again}' must match '${name}'`);
          this.expect(TT.LBRACKET, 'Expected [ after the signal name');
          const secondIndex = this.expect(TT.IDENTIFIER, 'Expected the index name').value;
          if (secondIndex !== indexName) throw new Error(`Index '${secondIndex}' must match '${indexName}'`);
          this.expect(TT.RBRACKET, 'Expected ] after the index name');
        }
        this.expect(TT.ASSIGN, `Expected = in the definition of ${name}[${indexName}]`);
        return { type: 'DiscreteSignalDefinition', name, indexName, domain, range, expr: this.parseExpression() };
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
        const formWord = this.peek();
        if (formWord.type === TT.IDENTIFIER && INTERVAL_WORD_FORMS.has(String(formWord.value).toLowerCase()) && this.tokens[this.idx + 1]?.type === TT.LPAREN) {
          const [includeLower, includeUpper] = INTERVAL_WORD_FORMS.get(String(formWord.value).toLowerCase());
          this.advance(); this.advance();
          const lower = this.parseAdditive();
          this.expect(TT.COMMA, 'Expected , between interval bounds');
          const upper = this.parseAdditive();
          this.expect(TT.RPAREN, 'Expected ) after interval bounds');
          return { type: 'MathIntervalType', lower, upper, includeLower, includeUpper };
        }
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
          this.endStatement();
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
          this.endStatement();
          if (this.idx === previousIndex) throw new Error('Unable to parse switch case statement');
        }
        return body;
      }
      parseExpression() {
        let expr = this.parseTernary();
        for (;;) {
          const word = this.peek();
          const lowerWord = word.type === TT.IDENTIFIER ? String(word.value).toLowerCase() : '';
          if (lowerWord === 'given') {
            // expr given cond  ->  expr where cond holds, NaN (undefined) elsewhere
            this.advance();
            const cond = this.parseTernary();
            expr = { type: 'TernaryExpression', cond, trueBranch: expr, falseBranch: { type: 'NumberLiteral', value: NaN } };
          } else if (lowerWord === 'where') {
            // expr where a = 1, b = a + 1  ->  local definitions substituted into expr
            this.advance();
            const bindings = [];
            do {
              const name = this.expect(TT.IDENTIFIER, 'Expected a name after where').value;
              this.expect(TT.ASSIGN, `Expected = after '${name}' in where`);
              bindings.push({ name, value: this.parseTernary() });
            } while (this.match(TT.COMMA));
            for (let i = 0; i < bindings.length; i++) {
              for (let j = i + 1; j < bindings.length; j++) bindings[j].value = substituteVariableNode(bindings[j].value, bindings[i].name, bindings[i].value);
            }
            bindings.forEach(binding => { expr = substituteVariableNode(expr, binding.name, binding.value); });
          } else break;
        }
        return expr;
      }
      parseTernary() {
        let cond = this.parseLogicalOr();
        if (this.match(TT.QUESTION)) {
          const trueBranch = this.parseExpression();
          this.expect(TT.COLON, "Expected : between the two branches of '? :'");
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
        const compOps = [TT.LT, TT.LTE, TT.GT, TT.GTE, TT.EQ, TT.NEQ, TT.IN, TT.IS];
        const isTypeOperator = token => token?.type === TT.IS;
        if (compOps.includes(this.peek().type) || isTypeOperator(this.peek())) {
          const operands = [left];
          const operators = [];
          const embeddedAssignments = [];
          while (compOps.includes(this.peek().type) || isTypeOperator(this.peek())) {
            const op = this.advance();
            operators.push(op.type === TT.IN ? 'in' : String(op.value).toLowerCase());
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
      startsImplicitProduct(left) {
        const next = this.peek(), prev = this.tokens[this.idx - 1];
        if (!prev || next.line !== prev.line) return false;
        const afterNumber = left.type === 'NumberLiteral' && prev.type === TT.NUMBER;
        const afterGroup = prev.type === TT.RPAREN;
        if (!afterNumber && !afterGroup) return false;
        if (next.type === TT.LPAREN) return true;
        if (next.type === TT.IDENTIFIER) {
          const word = String(next.value).toLowerCase();
          if (['diff', 'forall', 'given', 'where'].includes(word)) return false;
          return this.tokens[this.idx + 1]?.type !== TT.ASSIGN;
        }
        return false;
      }
      parseMultiplicative() {
        let left = this.parseUnary();
        while (true) {
          if ([TT.MUL, TT.DIV, TT.MOD].includes(this.peek().type)) {
            const op = this.advance().value;
            const right = this.parseUnary();
            left = { type: 'BinaryExpression', left, op, right };
          } else if (this.startsImplicitProduct(left)) {
            const right = this.parseUnary();
            left = { type: 'BinaryExpression', left, op: '*', right };
          } else break;
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
        if (tok.type === TT.LBRACKET) {
          this.advance();
          const items = [];
          if (this.peek().type !== TT.RBRACKET) {
            const expression = this.parseExpression();
            if (this.match(TT.FOR)) {
              const variable = this.expect(TT.IDENTIFIER, 'List comprehension requires a variable').value;
              this.expect(TT.IN, 'Expected in after list-comprehension variable');
              const start = this.parseAdditive();
              this.expect(TT.COLON, 'List-comprehension ranges use start:stop syntax');
              const stop = this.parseAdditive();
              this.expect(TT.RBRACKET, 'Expected ] after list comprehension');
              return {
                type: 'ArrayComprehensionExpression',
                expression,
                variable,
                start,
                stop
              };
            }
            items.push(expression);
            while (this.match(TT.COMMA)) items.push(this.parseExpression());
          }
          this.expect(TT.RBRACKET, 'Expected ] after array items');
          return { type: 'ArrayLiteral', items };
        }
        if (tok.type === TT.BAR) {
          this.advance();
          const expression = this.parseExpression();
          this.expect(TT.BAR, 'Expected closing | after absolute-value expression');
          return this.parsePostfix({ type: 'AbsoluteValueExpression', expression });
        }
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
            branches.push({ value: firstExpr, condition: this.peek().type === TT.OTHERWISE ? (this.advance(), { type: 'NumberLiteral', value: 1, isOtherwise: true }) : this.parseExpression() });
            while (this.match(TT.COMMA)) {
              const branchValue = this.parseExpression();
              if (!this.match(TT.COLON)) {
                throw new Error('Piecewise branch requires value:condition syntax');
              }
              let branchCond;
              if (this.peek().type === TT.OTHERWISE) {
                this.advance();
                branchCond = { type: 'NumberLiteral', value: 1, isOtherwise: true };
              } else {
                branchCond = this.parseExpression();
              }
              branches.push({ value: branchValue, condition: branchCond });
            }
            this.expect(TT.RBRACE, 'Expected } to close the piecewise definition');
            const lastBranch = branches[branches.length - 1];
            let piecewise = lastBranch.condition.isOtherwise
              ? lastBranch.value
              : { type: 'TernaryExpression', cond: lastBranch.condition, trueBranch: lastBranch.value, falseBranch: { type: 'NumberLiteral', value: NaN } };
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
            this.expect(TT.RBRACE, 'Expected } to close the set');
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
          this.expect(TT.RPAREN, 'Expected ) to close the opening (');
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
        while (true) {
          if (this.match(TT.LBRACKET)) {
            const index = this.parseExpression();
            this.expect(TT.RBRACKET, 'Expected ] after index');
            expression = { type: 'IndexExpression', object: expression, index };
            continue;
          }
          if (!this.match(TT.DOT)) break;
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
