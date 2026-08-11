const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../docs/qblc-owner-assessment-test-data.md');
const tsvPath = path.join(__dirname, '../docs/questions.tsv');

const content = fs.readFileSync(mdPath, 'utf8');
const lines = content.split('\n');

const questions = [];
let currentSectionId = '';
let currentQuestion = null;

let state = 'NORMAL'; // NORMAL, IN_QUESTION_TEXT, IN_ANSWER, IN_SCORE_GUIDE

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Section
  const secMatch = line.match(/^## Section (\d+)\./);
  if (secMatch) {
    currentSectionId = `sec${secMatch[1]}`;
    continue;
  }

  // Question Start
  const qMatch = line.match(/^### Q(\d+)\.\s*\[(.*?)\]/);
  if (qMatch) {
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    const num = parseInt(qMatch[1], 10);
    const typeKor = qMatch[2];
    let type = 'MC';
    if (typeKor === '선다형') type = 'MC';
    else if (typeKor === 'O/X' || typeKor === 'O/X형') type = 'OX';
    else if (typeKor === '서술형') type = 'ESSAY';

    currentQuestion = {
      id: `q${num}`,
      set_id: 'A',
      number: num,
      type: type,
      section_id: currentSectionId,
      text: [],
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      points: type === 'ESSAY' ? 4 : 2,
      answer: [],
      score_guide: [],
      last_modified: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    state = 'IN_QUESTION_TEXT';
    continue;
  }

  if (!currentQuestion) continue;

  if (state === 'IN_QUESTION_TEXT') {
    if (line.startsWith('①')) currentQuestion.option1 = line.substring(1).trim();
    else if (line.startsWith('②')) currentQuestion.option2 = line.substring(1).trim();
    else if (line.startsWith('③')) currentQuestion.option3 = line.substring(1).trim();
    else if (line.startsWith('④')) currentQuestion.option4 = line.substring(1).trim();
    else if (line.startsWith('> **정답:')) {
      const match = line.match(/[①②③④OX]/);
      if (match) {
        currentQuestion.answer.push(match[0]);
      }
      state = 'NORMAL';
    } else if (line.startsWith('> **모범 답안:**')) {
      state = 'IN_ANSWER';
    } else if (line !== '') {
      currentQuestion.text.push(line);
    }
  } else if (state === 'IN_ANSWER') {
    if (line.startsWith('> **채점 기준:**')) {
      state = 'IN_SCORE_GUIDE';
    } else {
      if (line.startsWith('>')) {
         currentQuestion.answer.push(line.substring(1).trim());
      }
    }
  } else if (state === 'IN_SCORE_GUIDE') {
    if (line === '' || line.startsWith('---')) {
      // End of question block
      state = 'NORMAL';
    } else if (line.startsWith('>')) {
      currentQuestion.score_guide.push(line.substring(1).trim());
    }
  }
}
if (currentQuestion) questions.push(currentQuestion);

// Prepare TSV
const header = ['id', 'set_id', 'number', 'type', 'section_id', 'text', 'option1', 'option2', 'option3', 'option4', 'points', 'answer', 'score_guide', 'last_modified'];

const tsvRows = [];
tsvRows.push(header.join('\t'));

const removeMd = (str) => str.replace(/\*\*/g, '');

questions.forEach(q => {
  const answerStr = removeMd(q.type === 'ESSAY' ? q.answer.join('\n').trim() : (q.answer.length ? q.answer[0] : ''));
  const scoreGuideStr = removeMd(q.score_guide.join('\n').trim());
  const textStr = removeMd(q.text.join('\n').trim());

  // Escape newlines and quotes for TSV if needed, or just surround with double quotes
  const row = [
    q.id,
    q.set_id,
    q.number,
    q.type,
    q.section_id,
    `"${textStr.replace(/"/g, '""')}"`,
    `"${removeMd(q.option1).replace(/"/g, '""')}"`,
    `"${removeMd(q.option2).replace(/"/g, '""')}"`,
    `"${removeMd(q.option3).replace(/"/g, '""')}"`,
    `"${removeMd(q.option4).replace(/"/g, '""')}"`,
    q.points,
    `"${answerStr.replace(/"/g, '""')}"`,
    `"${scoreGuideStr.replace(/"/g, '""')}"`,
    q.last_modified
  ];
  tsvRows.push(row.join('\t'));
});

fs.writeFileSync(tsvPath, tsvRows.join('\n'), 'utf8');
console.log(`TSV generated at ${tsvPath}`);
