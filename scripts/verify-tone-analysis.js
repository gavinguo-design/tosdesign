const fs = require('fs');
const path = require('path');
const vm = require('vm');

const target = path.join(__dirname, '..', 'desktop-card', 'index.html');
const source = fs.readFileSync(target, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert(start >= 0, `Missing ${name}() in ${target}`);

  let braceIndex = source.indexOf('{', start);
  assert(braceIndex >= 0, `Missing opening brace for ${name}()`);

  let depth = 0;
  for (let i = braceIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  throw new Error(`Unclosed function ${name}()`);
}

const parseToneAnalysisSrc = extractFunction('parseToneAnalysis');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`${parseToneAnalysisSrc}; this.parseToneAnalysis = parseToneAnalysis;`, sandbox);

const parseToneAnalysis = sandbox.parseToneAnalysis;
assert(typeof parseToneAnalysis === 'function', 'parseToneAnalysis() did not load');

const fullReply = [
  '调性分析：',
  'VA2 视觉吸引力：常驻桌面顺手瞄一眼，轻点缀即可',
  'IS3 信息显著性：有精确数字与截止时间，必须一目了然',
  'AA1 行动权威性：纯展示卡，无需任何操作',
  '综合调性 VA2+IS3+AA1',
].join('\n');

const parsedFull = parseToneAnalysis(fullReply);
assert(parsedFull.rows.length === 3, 'Expected 3 tone rows from full reply');
assert(parsedFull.summary === 'VA2+IS3+AA1', 'Expected explicit tone summary to be preserved');
assert(parsedFull.rows[1].ax === 'IS' && parsedFull.rows[1].level === '3', 'Expected IS3 row to parse');

const rowsOnlyReply = [
  '调性分析：',
  'VA3 视觉吸引力：需要强视觉抓住注意力',
  'IS1 信息显著性：只有一句轻量描述',
  'AA2 行动权威性：有轻引导但不强迫点击',
].join('\n');

const parsedRowsOnly = parseToneAnalysis(rowsOnlyReply);
assert(parsedRowsOnly.summary === 'VA3+IS1+AA2', 'Expected fallback summary to be derived from parsed rows');

assert(source.includes('currentCardToneRows = toneRows;'), 'Tone rows are not persisted into workbench state');
assert(source.includes('currentCardToneSummary = tone.summary;'), 'Tone summary is not persisted into workbench state');
assert(source.includes("renderWbTone(toneRows, tone.summary)"), 'Workbench pre-render does not pass tone summary fallback');
assert(source.includes("? `<div class=\"wb-tone-reason\">${escapeHtml(toneSummary)}</div>`"), 'renderWbTone no longer renders tone summary fallback');

console.log('tone-analysis verification passed');
