import { useState, useEffect } from 'react';
import { fetchFromSheet, postToSheet } from '../../api/googleSheet';
import Button from '../../components/common/Button';
import OwnerManager from '../../components/admin/OwnerManager';

export default function AdminOwners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);

  const loadOwners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFromSheet('get_owners');
      if (res.success) {
        setOwners(res.data || []);
      } else {
        setError(res.message || '데이터를 불러오지 못했습니다.');
      }
    } catch (err) {
      setError('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, []);

  const handleSave = async (formData) => {
    setIsEditing(false);
    setLoading(true);
    try {
      const action = formData.id ? 'update_owner' : 'add_owner';
      const res = await postToSheet(action, { owner: formData });
      if (res.success) {
        alert(formData.id ? '원장 정보가 수정되었습니다.' : '원장님이 성공적으로 등록되었습니다.');
        loadOwners();
      } else {
        alert(res.message);
        setLoading(false);
      }
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까? 삭제 시 연관된 응시 이력에 영향이 있을 수 있습니다.')) return;
    setLoading(true);
    try {
      const res = await postToSheet('delete_owner', { id });
      if (res.success) {
        alert('원장님이 삭제되었습니다.');
        loadOwners();
      } else {
        alert(res.message);
        setLoading(false);
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', backgroundColor: 'var(--bg-primary)', padding: '2rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>원장 관리</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>평가에 참여할 원장님을 등록하고 관리합니다.</p>
        </div>
        <div>
          <Button onClick={() => { setEditingOwner(null); setIsEditing(true); }}>+ 새 원장 등록</Button>
        </div>
      </div>

      {loading && owners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>불러오는 중...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--status-error)' }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>총 {owners.length}명</div>
            <Button variant="outline" onClick={loadOwners}>새로고침</Button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-light)', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '1rem' }}>이메일(ID)</th>
                <th style={{ padding: '1rem' }}>이름</th>
                <th style={{ padding: '1rem' }}>센터(가맹점)명</th>
                <th style={{ padding: '1rem' }}>배정 세트</th>
                <th style={{ padding: '1rem' }}>응시</th>
                <th style={{ padding: '1rem' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => (
                <tr key={owner.id || owner.email} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem' }}>{owner.email}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{owner.name}</td>
                  <td style={{ padding: '1rem' }}>{owner.center_name}</td>
                  <td style={{ padding: '1rem' }}>{owner.exam_set_id || 'A'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.85rem',
                      backgroundColor: (owner.allow_retake === true || owner.allow_retake === 'TRUE') ? '#dcfce7' : '#f1f5f9',
                      color: (owner.allow_retake === true || owner.allow_retake === 'TRUE') ? '#166534' : '#64748b'
                    }}>
                      {(owner.allow_retake === true || owner.allow_retake === 'TRUE') ? '가능' : '불가'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <Button variant="outline" onClick={() => { setEditingOwner(owner); setIsEditing(true); }} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                      수정
                    </Button>
                    <Button variant="outline" onClick={() => handleDelete(owner.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'red', borderColor: '#fca5a5' }}>
                      삭제
                    </Button>
                  </td>
                </tr>
              ))}
              {owners.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>등록된 원장님이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isEditing && (
        <OwnerManager 
          initialData={editingOwner}
          onSave={handleSave} 
          onCancel={() => { setIsEditing(false); setEditingOwner(null); }} 
        />
      )}
    </div>
  );
}
