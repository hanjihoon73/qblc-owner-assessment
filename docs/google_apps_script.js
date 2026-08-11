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
    if (action === "get_settings") {
      const settings = getSheetData("settings");
      let activeSet = "A"; // 기본값
      if (settings && settings.length > 0) {
        const activeSetting = settings.find(s => s.key === 'active_exam_set');
        if (activeSetting) activeSet = activeSetting.value;
      }
      result = { success: true, data: { active_exam_set: activeSet } };
    }
    else if (action === "verify_owner") {
      const email = e.parameter.email;
      const owners = getSheetData("owners");
      if (!owners) {
        result = { success: false, message: "'owners' 시트를 찾을 수 없습니다." };
      } else {
        const owner = owners.find(o => o.email === email);
        if (owner) {
          // 응시 이력 검사
          const submissions = getSheetData("submissions") || [];
          const hasSubmitted = submissions.some(sub => sub.owner_id === email || sub.owner_id === owner.id);
          
          if (hasSubmitted && owner.allow_retake !== true && owner.allow_retake !== 'TRUE') {
            result = { 
              success: false, 
              code: 'ALREADY_SUBMITTED', 
              message: '이미 평가를 완료하셨습니다. 재응시가 필요한 경우 본사로 문의해 주세요.' 
            };
          } else {
            // [어드민] 배정된 세트 ID 계산 (개별 지정이 우선, 없으면 글로벌 설정)
            let assignedSetId = owner.exam_set_id;
            if (!assignedSetId) {
              const settings = getSheetData("settings");
              assignedSetId = "A"; // 글로벌 기본값
              if (settings) {
                const activeSetting = settings.find(s => s.key === 'active_exam_set');
                if (activeSetting) assignedSetId = activeSetting.value;
              }
            }
            owner.assigned_set_id = assignedSetId;
            
            result = { success: true, data: owner };
          }
        } else {
          result = { success: false, message: "등록되지 않은 이메일입니다." };
        }
      }
    } 
    else if (action === "get_questions") {
      const setId = e.parameter.set_id;
      const questionsData = getSheetData("questions");
      if (!questionsData) {
        result = { success: false, message: "'questions' 시트를 찾을 수 없습니다." };
      } else {
        // [어드민] 요청된 set_id 필터링 (파라미터가 없으면 전체 반환 - 어드민용)
        let filteredData = questionsData;
        if (setId) {
          filteredData = questionsData.filter(q => q.set_id === setId || !q.set_id); // 빈 값은 공통으로 간주할 수도 있음
        }
        
        // 프론트엔드 전송용 문항 데이터 가공
        const formattedQuestions = filteredData.map(q => {
          let options = [];
          if (q.type === 'MC') {
            options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean);
          } else if (q.type === 'OX') {
            options = ['O', 'X'];
          }
          
          return {
            id: q.id,
            set_id: q.set_id,
            number: Number(q.number),
            type: q.type,
            section_id: q.section_id,
            text: String(q.text).replace(/\\n/g, '\n'),
            options: options,
            points: Number(q.points),
            answer: q.answer, // 어드민 편집을 위해 answer도 포함
            score_guide: q.score_guide,
            last_modified: q.last_modified
          };
        });
        result = { success: true, data: formattedQuestions };
      }
    }
    else if (action === "get_submissions") {
      const submissions = getSheetData("submissions");
      result = { success: true, data: submissions };
    }
    else if (action === "get_owners") {
      const owners = getSheetData("owners");
      result = { success: true, data: owners };
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

    // --- 관리자 이메일 인증 요청 ---
    if (action === "request_admin_auth") {
      const email = postData.email;
      if (!email || !email.endsWith('@quebon.com')) {
        result = { success: false, message: "접근 권한이 없습니다. 깨봉 사내 이메일을 사용해 주세요." };
      } else {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        CacheService.getScriptCache().put('admin_auth_' + email, code, 300); // 5분 유지
        MailApp.sendEmail({
          to: email,
          subject: "[깨봉수학] 러닝센터 원장 평가 어드민 로그인",
          htmlBody: `<div style="font-family: sans-serif; color: #333333;">
            <p style="font-size: 20px; margin-bottom: 24px;">어드민에 로그인하기 위한 인증 번호입니다.</p>
            <span style="display:inline-block; padding: 18px 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 24px; font-weight: bold; letter-spacing: 12px; color: #2563eb; cursor: text; user-select: all;">${code}</span>
            <p style="font-size: 20px; margin-top: 24px;">위 인증 번호를 복사하여 5분 내에 화면에 붙여넣기 해주세요.</p>
          </div>`
        });
        result = { success: true, message: "인증 메일이 발송되었습니다." };
      }
    }
    // --- 관리자 이메일 인증 확인 ---
    else if (action === "verify_admin_auth") {
      const email = postData.email;
      const code = postData.code;
      const savedCode = CacheService.getScriptCache().get('admin_auth_' + email);
      
      if (savedCode && savedCode === code) {
        CacheService.getScriptCache().remove('admin_auth_' + email);
        result = { success: true, message: "인증 성공" };
      } else {
        result = { success: false, message: "인증 번호가 일치하지 않거나 만료되었습니다." };
      }
    }
    // --- 글로벌 세팅 업데이트 ---
    else if (action === "update_settings") {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("settings");
      const data = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === postData.key) {
          sheet.getRange(i + 1, 2).setValue(postData.value);
          found = true;
          break;
        }
      }
      if (!found) sheet.appendRow([postData.key, postData.value]);
      result = { success: true, message: "설정이 저장되었습니다." };
    }
    
    // --- 원장님 개별 세트 지정 ---
    else if (action === "assign_exam_set") {
      const ownerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("owners");
      const ownerData = ownerSheet.getDataRange().getValues();
      const headers = ownerData[0];
      const examSetIdx = headers.indexOf('exam_set_id');
      const emailIdx = headers.indexOf('email');
      
      let found = false;
      for (let i = 1; i < ownerData.length; i++) {
        if (ownerData[i][emailIdx] === postData.email) {
          ownerSheet.getRange(i + 1, examSetIdx + 1).setValue(postData.set_id);
          found = true;
          break;
        }
      }
      if (found) {
        result = { success: true, message: `개별 세트 지정 완료` };
      } else {
        result = { success: false, message: "원장님을 찾을 수 없습니다." };
      }
    }

    // --- 재응시 상태 변경 ---
    else if (action === "allow_retake") {
      const ownerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("owners");
      const ownerData = ownerSheet.getDataRange().getValues();
      const headers = ownerData[0];
      const allowRetakeIdx = headers.indexOf('allow_retake');
      const emailIdx = headers.indexOf('email');
      
      let found = false;
      let targetValue = postData.allow !== undefined ? postData.allow : true;

      for (let i = 1; i < ownerData.length; i++) {
        if (ownerData[i][emailIdx] === postData.email) {
          ownerSheet.getRange(i + 1, allowRetakeIdx + 1).setValue(targetValue);
          found = true;
          break;
        }
      }
      if (found) result = { success: true, message: `재응시 상태 변경 완료` };
      else result = { success: false, message: "원장님을 찾을 수 없습니다." };
    }
    
    // --- 원장 관리 (추가) ---
    else if (action === "add_owner") {
      const oSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("owners");
      const headers = oSheet.getDataRange().getValues()[0];
      
      const newOwner = postData.owner;
      const newId = "own-" + new Date().getTime(); // 고유 ID 자동 부여
      
      const newRow = headers.map(h => {
        if (h === 'id') return newId;
        if (h === 'allow_retake') return false; // 기본값
        if (h === 'exam_set_id') return "A"; // 기본값
        return newOwner[h] !== undefined ? newOwner[h] : "";
      });
      oSheet.appendRow(newRow);
      result = { success: true, message: "원장님이 등록되었습니다." };
    }
    
    // --- 원장 관리 (삭제) ---
    else if (action === "delete_owner") {
      const oSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("owners");
      const data = oSheet.getDataRange().getValues();
      const idIdx = data[0].indexOf("id");
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] === postData.id) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex > -1) {
        oSheet.deleteRow(rowIndex);
        result = { success: true, message: "원장님이 삭제되었습니다." };
      } else {
        result = { success: false, message: "원장님을 찾을 수 없습니다." };
      }
    }

    // --- 문항 관리 (추가) ---
    else if (action === "add_question") {
      const qSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("questions");
      const headers = qSheet.getDataRange().getValues()[0];
      const newRow = headers.map(h => postData.question[h] !== undefined ? postData.question[h] : "");
      qSheet.appendRow(newRow);
      result = { success: true, message: "문항이 추가되었습니다." };
    }
    
    // --- 문항 관리 (수정) ---
    else if (action === "edit_question") {
      const qSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("questions");
      const data = qSheet.getDataRange().getValues();
      const headers = data[0];
      const idIdx = headers.indexOf("id");
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] === postData.question.id) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex > -1) {
        Object.keys(postData.question).forEach(key => {
          const colIndex = headers.indexOf(key) + 1;
          if (colIndex > 0) {
            qSheet.getRange(rowIndex, colIndex).setValue(postData.question[key]);
          }
        });
        result = { success: true, message: "문항이 수정되었습니다." };
      } else {
        result = { success: false, message: "문항을 찾을 수 없습니다." };
      }
    }
    
    // --- 문항 관리 (삭제) ---
    else if (action === "delete_question") {
      const qSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("questions");
      const data = qSheet.getDataRange().getValues();
      const idIdx = data[0].indexOf("id");
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] === postData.id) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex > -1) {
        qSheet.deleteRow(rowIndex);
        result = { success: true, message: "문항이 삭제되었습니다." };
      } else {
        result = { success: false, message: "문항을 찾을 수 없습니다." };
      }
    }

    // --- 시험 제출 ---
    else if (action === "submit_exam") {
      const submissionsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("submissions");
      const headers = submissionsSheet.getDataRange().getValues()[0];
      
      const ownerData = postData.data.ownerData;
      const answers = postData.data.answers;
      
      const questions = getSheetData("questions") || [];
      let mcScore = 0;
      let oxScore = 0;
      
      questions.forEach(q => {
        const userAnswer = answers[q.id];
        if (q.type === 'MC' && userAnswer && userAnswer.startsWith(String(q.answer))) {
          mcScore += Number(q.points);
        } else if (q.type === 'OX' && userAnswer === String(q.answer)) {
          oxScore += Number(q.points);
        }
      });
      
      const essayScore = 0;
      const essayScores = {};
      const totalScore = mcScore + oxScore + essayScore;
      const passStatus = "채점중";
      const submissionId = "sub-" + new Date().getTime();
      const submittedAt = new Date().toISOString();

      const submissionData = {
        id: submissionId,
        owner_id: ownerData.id || ownerData.email,
        owner_email: ownerData.email,
        examinee_name: ownerData.name,
        center_name: ownerData.center_name,
        exam_set_id: ownerData.assigned_set_id || "A", // 기록
        submitted_at: submittedAt,
        mc_score: mcScore,
        ox_score: oxScore,
        essay_scores: JSON.stringify(essayScores),
        essay_score: essayScore,
        total_score: totalScore,
        pass_status: passStatus,
        time_taken: postData.data.timeTaken || 0,
        ...answers 
      };
      
      const newRow = headers.map(header => submissionData[header] !== undefined ? submissionData[header] : "");
      submissionsSheet.appendRow(newRow);
      
      // 권한 회수
      const ownerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("owners");
      if (ownerSheet) {
        const ownerRows = ownerSheet.getDataRange().getValues();
        const oHeaders = ownerRows[0];
        const allowRetakeIdx = oHeaders.indexOf('allow_retake');
        const emailIdx = oHeaders.indexOf('email');
        if (allowRetakeIdx !== -1) {
          for (let k = 1; k < ownerRows.length; k++) {
            if (ownerRows[k][emailIdx] === (ownerData.email || ownerData.id)) {
              ownerSheet.getRange(k + 1, allowRetakeIdx + 1).setValue(false);
              break;
            }
          }
        }
      }
      
      result = { success: true, message: "제출이 완료되었습니다.", data: submissionData };
    }

    // --- 수동 채점 및 상태 업데이트 ---
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
    
    // --- 응시 이력 삭제 (추가) ---
    else if (action === "delete_submission") {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("submissions");
      const data = sheet.getDataRange().getValues();
      const idIdx = data[0].indexOf("id");
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] === postData.id) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex > -1) {
        sheet.deleteRow(rowIndex);
        result = { success: true, message: "응시 내역이 삭제되었습니다." };
      } else {
        result = { success: false, message: "응시 내역을 찾을 수 없습니다." };
      }
    }
  } catch (error) {
    result = { success: false, message: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// === 필수 초기화 함수 ===
function setupSheetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. owners 시트 (exam_set_id 추가)
  let owners = ss.getSheetByName('owners');
  if (!owners) owners = ss.insertSheet('owners');
  owners.getRange("A1:F1").setValues([["id", "email", "name", "center_name", "allow_retake", "exam_set_id"]]);
  
  // 2. questions 시트 (set_id 추가)
  let questions = ss.getSheetByName('questions');
  if (!questions) questions = ss.insertSheet('questions');
  const qHeaders = ["id", "set_id", "number", "type", "section_id", "text", "option1", "option2", "option3", "option4", "points", "answer"];
  questions.getRange(1, 1, 1, qHeaders.length).setValues([qHeaders]);
  
  // 3. submissions 시트 (exam_set_id 추가)
  let submissions = ss.getSheetByName('submissions');
  if (!submissions) submissions = ss.insertSheet('submissions');
  let subHeaders = [
    "id", "owner_id", "owner_email", "examinee_name", "center_name", "exam_set_id", "submitted_at", "time_taken",
    "mc_score", "ox_score", "essay_scores", "essay_score", "total_score", "pass_status"
  ];
  for(let i=1; i<=40; i++) subHeaders.push("q" + i);
  submissions.getRange(1, 1, 1, subHeaders.length).setValues([subHeaders]);
  
  // 4. settings 시트 (글로벌 설정)
  let settings = ss.getSheetByName('settings');
  if (!settings) {
    settings = ss.insertSheet('settings');
    settings.getRange("A1:B1").setValues([["key", "value"]]);
    settings.appendRow(["active_exam_set", "A"]);
  }
  
  SpreadsheetApp.getUi().alert('✅ 어드민 스펙용 시트 세팅이 완벽히 끝났습니다!');
}

// === 이메일 발송 권한 강제 획득용 함수 ===
function testMailPermission() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), "권한 테스트", "이메일 권한을 얻기 위한 테스트입니다.");
}
