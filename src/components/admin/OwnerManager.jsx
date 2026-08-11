import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

export default function OwnerManager({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    center_name: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.center_name) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }
    // 이메일 형식 간단 검증
    if (!formData.email.includes('@')) {
      alert('유효한 이메일 주소를 입력해주세요.');
      return;
    }
    onSave(formData);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          새 원장 등록
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              이메일 (ID) <span style={{color: 'red'}}>*</span>
            </label>
            <Input 
              name="email" 
              type="email"
              value={formData.email} 
              onChange={handleChange} 
              placeholder="예: director@quebon.com"
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              이름 <span style={{color: 'red'}}>*</span>
            </label>
            <Input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="예: 홍길동"
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              센터(가맹점)명 <span style={{color: 'red'}}>*</span>
            </label>
            <Input 
              name="center_name" 
              value={formData.center_name} 
              onChange={handleChange} 
              placeholder="예: 강남점"
              required 
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
            <Button type="submit">등록하기</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
