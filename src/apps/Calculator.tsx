// ============================================================================
// Webuntu — Calculator (GNOME Calculator style)
// ============================================================================
import { createSignal, type Component } from 'solid-js';

interface CalculatorProps { windowId: string; }

export const Calculator: Component<CalculatorProps> = () => {
  const [display, setDisplay] = createSignal('0');
  const [expression, setExpression] = createSignal('');
  const [newNumber, setNewNumber] = createSignal(true);

  function inputDigit(d: string) {
    if (newNumber()) {
      setDisplay(d);
      setNewNumber(false);
    } else {
      setDisplay(display() === '0' ? d : display() + d);
    }
  }

  function inputDot() {
    if (newNumber()) { setDisplay('0.'); setNewNumber(false); return; }
    if (!display().includes('.')) setDisplay(display() + '.');
  }

  function inputOp(op: string) {
    setExpression(expression() + display() + ` ${op} `);
    setNewNumber(true);
  }

  function calculate() {
    try {
      const expr = expression() + display();
      // Safe eval using Function constructor (sandboxed, no access to globals)
      const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '');
      const result = new Function(`return (${sanitized})`)();
      setDisplay(String(result));
      setExpression('');
      setNewNumber(true);
    } catch {
      setDisplay('Error');
      setExpression('');
      setNewNumber(true);
    }
  }

  function clear() {
    setDisplay('0');
    setExpression('');
    setNewNumber(true);
  }

  function backspace() {
    if (display().length > 1) {
      setDisplay(display().slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  }

  function toggleSign() {
    if (display() !== '0') {
      setDisplay(display().startsWith('-') ? display().slice(1) : '-' + display());
    }
  }

  function percent() {
    setDisplay(String(parseFloat(display()) / 100));
  }

  const buttons = [
    { label: 'C', action: clear, class: 'calc-fn' },
    { label: '±', action: toggleSign, class: 'calc-fn' },
    { label: '%', action: percent, class: 'calc-fn' },
    { label: '÷', action: () => inputOp('/'), class: 'calc-op' },
    { label: '7', action: () => inputDigit('7'), class: 'calc-num' },
    { label: '8', action: () => inputDigit('8'), class: 'calc-num' },
    { label: '9', action: () => inputDigit('9'), class: 'calc-num' },
    { label: '×', action: () => inputOp('*'), class: 'calc-op' },
    { label: '4', action: () => inputDigit('4'), class: 'calc-num' },
    { label: '5', action: () => inputDigit('5'), class: 'calc-num' },
    { label: '6', action: () => inputDigit('6'), class: 'calc-num' },
    { label: '−', action: () => inputOp('-'), class: 'calc-op' },
    { label: '1', action: () => inputDigit('1'), class: 'calc-num' },
    { label: '2', action: () => inputDigit('2'), class: 'calc-num' },
    { label: '3', action: () => inputDigit('3'), class: 'calc-num' },
    { label: '+', action: () => inputOp('+'), class: 'calc-op' },
    { label: '0', action: () => inputDigit('0'), class: 'calc-num calc-zero' },
    { label: '.', action: inputDot, class: 'calc-num' },
    { label: '⌫', action: backspace, class: 'calc-num' },
    { label: '=', action: calculate, class: 'calc-eq' },
  ];

  return (
    <div class="calculator">
      <div class="calc-display">
        <div class="calc-expression">{expression()}</div>
        <div class="calc-result">{display()}</div>
      </div>
      <div class="calc-buttons">
        {buttons.map(btn => (
          <button class={`calc-btn ${btn.class}`} onClick={btn.action}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};
