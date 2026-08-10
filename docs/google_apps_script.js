const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

function doGet(e) {
  const action = e.parameter.action;
  let result = { success: false, data: null, message: "" };

  try {
    if (action === "verify_owner") {
      const email = e.parameter.email;
      const owners = getSheetData("owners");
      if (!owners) {
        result = { success: false, message: "'owners' 시트를 찾을 수 없습니다." };
      } else {
        const owner = owners.find(o => o.email === email);
        if (owner) {
          result = { success: true, data: owner };
        } else {
          result = { success: false, message: "등록되지 않은 이메일입니다." };
        }
      }
    } 
    else if (action === "get_questions") {
      const questionsData = getSheetData("questions");
      if (!questionsData) {
        result = { success: false, message: "'questions' 시트를 찾을 수 없습니다." };
      } else {
        // 프론트엔드 전송용 문항 데이터 가공 (정답 제외)
        const formattedQuestions = questionsData.map(q => {
          let options = [];
          if (q.type === 'MC') {
            options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean);
          } else if (q.type === 'OX') {
            options = ['O', 'X'];
          }
          
          return {
            id: q.id,
            number: Number(q.number),
            type: q.type,
            section_id: q.section_id,
            text: String(q.text).replace(/\\n/g, '\n'), // 개행문자 복구
            options: options,
            points: Number(q.points)
          };
        });
        result = { success: true, data: formattedQuestions };
      }
    }
    else if (action === "get_submissions") {
      const submissions = getSheetData("submissions");
      result = { success: true, data: submissions };
    }
    else {
      result = { success: false, message: "잘못된 액션입니다." };
    }
  } catch (error) {
    result = { success: false, message: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result = { success: false, message: "" };
  
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    if (action === "submit_exam") {
      const submissionsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("submissions");
      const headers = submissionsSheet.getDataRange().getValues()[0];
      
      const ownerData = postData.data.ownerData;
      const answers = postData.data.answers;
      
      // 정답 데이터 가져오기 및 채점
      const questions = getSheetData("questions") || [];
      let mcScore = 0;
      let oxScore = 0;
      
      questions.forEach(q => {
        const userAnswer = answers[q.id];
        if (q.type === 'MC' && userAnswer === q.answer) {
          mcScore += Number(q.points);
        } else if (q.type === 'OX' && userAnswer === q.answer) {
          oxScore += Number(q.points);
        }
      });
      
      const essayScore = 0;
      const essayScores = {};
      const totalScore = mcScore + oxScore + essayScore;
      const passStatus = "채점중";
      const submissionId = "sub-" + new Date().getTime();
      const submittedAt = new Date().toISOString();

      // 저장할 데이터 객체 구성
      const submissionData = {
        id: submissionId,
        owner_id: ownerData.id || ownerData.email,
        examinee_name: ownerData.name,
        center_name: ownerData.center_name,
        submitted_at: submittedAt,
        mc_score: mcScore,
        ox_score: oxScore,
        essay_scores: JSON.stringify(essayScores),
        essay_score: essayScore,
        total_score: totalScore,
        pass_status: passStatus,
        ...answers // q1, q2... 등 답안 
      };
      
      const newRow = headers.map(header => {
        return submissionData[header] !== undefined ? submissionData[header] : "";
      });
      
      submissionsSheet.appendRow(newRow);
      result = { success: true, message: "제출이 완료되었습니다.", data: submissionData };
    }
    else if (action === "update_grade") {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("submissions");
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idIndex = headers.indexOf("id");
      
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === postData.id) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex > -1) {
        Object.keys(postData.updates).forEach(key => {
          const colIndex = headers.indexOf(key) + 1;
          if (colIndex > 0) {
            let val = postData.updates[key];
            if (typeof val === 'object') val = JSON.stringify(val);
            sheet.getRange(rowIndex, colIndex).setValue(val);
          }
        });
        result = { success: true, message: "채점이 완료되었습니다." };
      } else {
        result = { success: false, message: "제출 내역을 찾을 수 없습니다." };
      }
    }
  } catch (error) {
    result = { success: false, message: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// === 이 아래에 함수가 위치해야 정상적으로 인식됩니다 ===
function setupSheetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. owners 시트 세팅
  let owners = ss.getSheetByName('owners');
  if (!owners) owners = ss.insertSheet('owners');
  owners.getRange("A1:D1").setValues([["id", "email", "name", "center_name"]]);
  
  // 2. questions 시트 세팅
  let questions = ss.getSheetByName('questions');
  if (!questions) questions = ss.insertSheet('questions');
  const qHeaders = ["id", "number", "type", "section_id", "text", "option1", "option2", "option3", "option4", "points", "answer"];
  questions.getRange(1, 1, 1, qHeaders.length).setValues([qHeaders]);
  
  // 3. submissions 시트 세팅
  let submissions = ss.getSheetByName('submissions');
  if (!submissions) submissions = ss.insertSheet('submissions');
  let subHeaders = [
    "id", "owner_id", "examinee_name", "center_name", "submitted_at", 
    "mc_score", "ox_score", "essay_scores", "essay_score", "total_score", "pass_status"
  ];
  for(let i=1; i<=40; i++) subHeaders.push("q" + i);
  submissions.getRange(1, 1, 1, subHeaders.length).setValues([subHeaders]);
  
  // 기존 answer_key 시트가 있다면 삭제
  const oldAnswerKey = ss.getSheetByName('answer_key');
  if (oldAnswerKey) {
    ss.deleteSheet(oldAnswerKey);
  }
  
  // 알림
  SpreadsheetApp.getUi().alert('✅ 시트 세팅 완료! (answer_key가 삭제되고 questions 시트로 통합되었습니다)');
}
