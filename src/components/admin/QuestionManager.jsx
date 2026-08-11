import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

export default function QuestionManager({ question, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: '', set_id: 'A', number: '', type: 'MC', section_id: '1', 
    text: '', option1: '', option2: '', option3: '', option4: '', points: '2', answer: ''
  });

  useEffect(() => {
    if (question) {
      setFormData({
        ...question,
        option1: question.options && question.options[0] ? question.options[0] : '',
        option2: question.options && question.options[1] ? question.options[1] : '',
        option3: question.options && question.options[2] ? question.options[2] : '',
        option4: question.options && question.options[3] ? question.options[3] : '',
      });
    } else {
      setFormData({
        id: 'q' + new Date().getTime(), set_id: 'A', number: '', type: 'MC', section_id: '1', 
        text: '', option1: '', option2: '', option3: '', option4: '', points: '2', answer: '①'
      });
    }
  }, [question]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleResizeHeight = (e) => {
    if (!e) return;
    const target = e.target || e;
    if (target && target.style) {
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
          {question ? '문항 수정' : '새 문항 추가'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>평가 세트 ID</label>
              <input name="set_id" value={formData.set_id} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>문항 번호</label>
              <input type="number" name="number" value={formData.number} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} required />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>유형</label>
              <select name="type" value={formData.type} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }}>
                <option value="MC">선다형 (MC)</option>
                <option value="OX">OX형 (OX)</option>
                <option value="ESSAY">서술형 (ESSAY)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>섹션 (1~5)</label>
              <input name="section_id" value={formData.section_id} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>배점</label>
              <input type="number" name="points" value={formData.points} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>문제 내용 (\n으로 줄바꿈)</label>
            <textarea name="text" value={formData.text} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }} required />
          </div>

          {formData.type === 'MC' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>보기 1</label>
                <textarea ref={handleResizeHeight} rows={1} name="option1" value={formData.option1} onChange={handleChange} onInput={handleResizeHeight} style={{ width: '100%', padding: '0.5rem', resize: 'none', overflow: 'hidden', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>보기 2</label>
                <textarea ref={handleResizeHeight} rows={1} name="option2" value={formData.option2} onChange={handleChange} onInput={handleResizeHeight} style={{ width: '100%', padding: '0.5rem', resize: 'none', overflow: 'hidden', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>보기 3</label>
                <textarea ref={handleResizeHeight} rows={1} name="option3" value={formData.option3} onChange={handleChange} onInput={handleResizeHeight} style={{ width: '100%', padding: '0.5rem', resize: 'none', overflow: 'hidden', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>보기 4</label>
                <textarea ref={handleResizeHeight} rows={1} name="option4" value={formData.option4} onChange={handleChange} onInput={handleResizeHeight} style={{ width: '100%', padding: '0.5rem', resize: 'none', overflow: 'hidden', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--primary-main)', fontWeight: 'bold' }}>
              정답
            </label>
            {formData.type === 'MC' ? (
              <select name="answer" value={formData.answer} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '2px solid var(--primary-main)' }}>
                <option value="①">보기 1 (①)</option>
                <option value="②">보기 2 (②)</option>
                <option value="③">보기 3 (③)</option>
                <option value="④">보기 4 (④)</option>
              </select>
            ) : formData.type === 'OX' ? (
              <select name="answer" value={formData.answer} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '2px solid var(--primary-main)' }}>
                <option value="O">O</option>
                <option value="X">X</option>
              </select>
            ) : (
              <input name="answer" value={formData.answer} onChange={handleChange} placeholder="수동 채점 입력" style={{ width: '100%', padding: '0.5rem', border: '2px solid var(--primary-main)' }} required />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
