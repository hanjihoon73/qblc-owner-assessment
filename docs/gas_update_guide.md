# 구글 앱스 스크립트(GAS) 최종 통합본

제이슨님, 기존 스크립트에 1회 응시 제한 및 재응시 허용 로직을 모두 병합한 **최종 완성본**입니다!
기존 스크립트를 모두 지우시고, **아래 코드를 전체 복사해서 통째로 덮어쓰기** 하시면 됩니다. 

> **[필수 작업 순서]**
> 1. 구글 앱스 스크립트 편집기에 아래 코드를 통째로 덮어씁니다.
> 2. 스크립트 편집기 상단 메뉴에서 실행할 함수를 `setupSheetHeaders`로 선택하고 **[실행]** 버튼을 한 번 눌러주세요. (이 작업을 해야 `owners` 시트에 `allow_retake` 열이 자동으로 추가됩니다!)
> 3. 우측 상단의 **[배포] -> [새 배포]** (또는 배포 관리에서 연필 모양 클릭 후 새 버전)를 진행해 주시면 끝납니다.

---

```javascript
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
          // --- [신규 로직] 응시 이력 및 재응시 권한 검사 ---
          const submissions = getSheetData("submissions") || [];
          const hasSubmitted = submissions.some(sub => sub.owner_id === email || sub.owner_id === owner.id);
          
          if (hasSubmitted && owner.allow_retake !== true && owner.allow_retake !== 'TRUE') {
            // 이미 제출했고 재응시 권한도 없는 경우 차단
            result = { 
              success: false, 
              code: 'ALREADY_SUBMITTED', 
              message: '이미 평가를 완료하셨습니다. 재응시가 필요한 경우 본사로 문의해 주세요.' 
            };
          } else {
            // 정상 통과 (미응시자 또는 재응시 권한 보유자)
            result = { success: true, data: owner };
          }
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

    // --- [신규 액션] 어드민 재응시 권한 부여 ---
    if (action === "allow_retake") {
      const ownerEmail = postData.email;
      const ownerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("owners");
      const ownerData = ownerSheet.getDataRange().getValues();
      const headers = ownerData[0];
      const allowRetakeIdx = headers.indexOf('allow_retake');
      const emailIdx = headers.indexOf('email');
      
      if (allowRetakeIdx === -1) {
        result = { success: false, message: "owners 시트에 'allow_retake' 열이 없습니다. setupSheetHeaders 함수를 실행해주세요." };
      } else {
        let found = false;
        for (let i = 1; i < ownerData.length; i++) {
          if (ownerData[i][emailIdx] === ownerEmail) {
            ownerSheet.getRange(i + 1, allowRetakeIdx + 1).setValue(true);
            found = true;
            break;
          }
        }
        if (found) {
          result = { success: true, message: `재응시 권한 부여 완료` };
        } else {
          result = { success: false, message: "해당 이메일의 원장님을 찾을 수 없습니다." };
        }
      }
    }
    else if (action === "submit_exam") {
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
      
      // --- [신규 로직] 제출 완료 후 재응시 권한 회수 ---
      const ownerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("owners");
      if (ownerSheet) {
        const ownerRows = ownerSheet.getDataRange().getValues();
        const oHeaders = ownerRows[0];
        const allowRetakeIdx = oHeaders.indexOf('allow_retake');
        const emailIdx = oHeaders.indexOf('email');
        
        if (allowRetakeIdx !== -1) {
          for (let k = 1; k < ownerRows.length; k++) {
            if (ownerRows[k][emailIdx] === (ownerData.email || ownerData.id)) {
              ownerSheet.getRange(k + 1, allowRetakeIdx + 1).setValue(false); // 다시 FALSE로 변경
              break;
            }
          }
        }
      }
      
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
  
  // [수정] allow_retake 열 추가!
  owners.getRange("A1:E1").setValues([["id", "email", "name", "center_name", "allow_retake"]]);
  
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
  SpreadsheetApp.getUi().alert('✅ 시트 세팅 완료! (allow_retake 열이 owners 시트에 업데이트 되었습니다)');
}
```
