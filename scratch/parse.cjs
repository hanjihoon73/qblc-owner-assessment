const fs = require('fs');

const markdownContent = fs.readFileSync('docs/qblc-owner-assessment-test-data.md', 'utf8');

const lines = markdownContent.split('\n');

const questions = [];
let currentQuestion = null;
const answers = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.startsWith('# 배점 요약')) {
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    currentQuestion = null;
    break; // Stop parsing after questions end
  }
  
  if (line.startsWith('### Q')) {
    const match = line.match(/### Q(\d+)\. \[(.*?)\]/);
    if (match) {
      if (currentQuestion) questions.push(currentQuestion);
      const num = parseInt(match[1]);
      const typeStr = match[2];
      const type = typeStr === '사지선다' ? 'MC' : typeStr === 'O/X' ? 'OX' : 'ESSAY';
      const points = type === 'MC' ? 2 : type === 'OX' ? 1 : 3;
      
      currentQuestion = {
        id: `q${num}`,
        number: num,
        type: type,
        text: '',
        options: type === 'OX' ? ['O', 'X'] : [],
        points: points
      };
    }
  } else if (currentQuestion && line.match(/^[①②③④]/)) {
    currentQuestion.options.push(line.replace(/\*\*/g, ''));
  } else if (currentQuestion && line.startsWith('> **정답:')) {
    const ansMatch = line.match(/> \*\*정답:\s*(.*?)\*\*/);
    if (ansMatch) {
      answers[currentQuestion.number - 1] = ansMatch[1].trim();
    }
  } else if (currentQuestion && currentQuestion.type === 'ESSAY' && line.startsWith('> **채점 요소:**')) {
    // For essay questions, we don't need a specific exact match answer for the student side,
    // but we can put "채점대기" in the answer key.
    answers[currentQuestion.number - 1] = "채점대기";
  } else if (currentQuestion && !line.startsWith('>') && !line.startsWith('##') && !line.startsWith('---') && line !== '') {
    if (currentQuestion.text !== '') currentQuestion.text += '\n';
    currentQuestion.text += line.replace(/\*\*/g, '');
  }
}
if (currentQuestion) questions.push(currentQuestion);

// Build JS file content
const jsContent = `export const SECTIONS = [
  { id: 'sec1', title: 'Section 1: 교육 철학 및 교수법', start: 1, end: 10 },
  { id: 'sec2', title: 'Section 2: 과정별 커리큘럼', start: 11, end: 16 },
  { id: 'sec3', title: 'Section 3: 운영 매뉴얼', start: 17, end: 26 },
  { id: 'sec4', title: 'Section 4: 시스템 사용 방법', start: 27, end: 30 },
  { id: 'sec5', title: 'Section 5: 학부모 상담', start: 31, end: 40 },
];

export const QUESTIONS = ${JSON.stringify(questions, null, 2)};
`;

fs.writeFileSync('src/utils/questions.js', jsContent);

// Build answer TSV (tab-separated values)
const tsvHeader = "id\tnumber\ttype\tsection_id\ttext\toption1\toption2\toption3\toption4\tpoints\tanswer";
const tsvLines = [tsvHeader];

// Map section numbers based on question number ranges
const getSectionId = (num) => {
  if (num <= 10) return 'sec1';
  if (num <= 16) return 'sec2';
  if (num <= 26) return 'sec3';
  if (num <= 30) return 'sec4';
  return 'sec5';
};

questions.forEach(q => {
  const qid = q.id;
  const num = q.number;
  const type = q.type;
  const secId = getSectionId(num);
  const text = q.text.replace(/\n/g, '\\n');
  const o1 = q.options[0] || '';
  const o2 = q.options[1] || '';
  const o3 = q.options[2] || '';
  const o4 = q.options[3] || '';
  const pts = q.points;
  const ans = answers[num - 1] || '';

  tsvLines.push(`${qid}\t${num}\t${type}\t${secId}\t${text}\t${o1}\t${o2}\t${o3}\t${o4}\t${pts}\t${ans}`);
});

fs.writeFileSync('docs/questions_upload.tsv', tsvLines.join('\n'));
console.log('Successfully generated questions.js and questions_upload.tsv');
