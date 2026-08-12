import { useState, useEffect } from 'react';
import Button from '../common/Button';

export default function DemoScheduleModal({ onSelect, onCancel }) {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);

  // 선택 가능한 시간대 (12시~13시 제외)
  const timeSlots = ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  const formatDateLabel = (dateObj) => {
    const mm = dateObj.getMonth() + 1;
    const dd = dateObj.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const day = dayNames[dateObj.getDay()];
    return `${mm}/${dd} (${day})`;
  };

  const toYYYYMMDD = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const calculateNext3Weekdays = (holidaysStrArr) => {
    const days = [];
    let d = new Date();
    while (days.length < 3) {
      d.setDate(d.getDate() + 1);
      const dayOfWeek = d.getDay();
      
      // 주말 제외
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      // 공휴일 제외
      const dateStr = toYYYYMMDD(d);
      if (holidaysStrArr.includes(dateStr)) continue;
      
      days.push(new Date(d));
    }
    setAvailableDates(days);
  };

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const apiKey = import.meta.env.VITE_HOLIDAY_API_KEY || '';
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        // GAS 프록시 엔드포인트 호출
        const gasUrl = import.meta.env.VITE_GAS_API_URL;
        const url = `${gasUrl}?action=get_holidays&year=${year}&month=${month}&apiKey=${encodeURIComponent(apiKey)}`;
        
        const res = await fetch(url);
        const json = await res.json();
        
        if (json.success) {
          calculateNext3Weekdays(json.data || []);
        } else {
          calculateNext3Weekdays([]);
        }
      } catch (err) {
        console.error('Failed to fetch holidays:', err);
        // 에러 시 주말만 배제하여 계산
        calculateNext3Weekdays([]);
      } finally {
        setLoadingHolidays(false);
      }
    };
    
    fetchHolidays();
  }, []);

  const handleAddSchedule = () => {
    if (selectedDate && selectedTimes.length > 0) {
      const dateStr = formatDateLabel(selectedDate);
      
      const newItems = [];
      let hasDuplicate = false;

      selectedTimes.forEach(time => {
        const isDuplicate = scheduleList.some(item => item.date === dateStr && item.time === time);
        if (isDuplicate) {
          hasDuplicate = true;
        } else {
          newItems.push({ date: dateStr, time });
        }
      });

      if (hasDuplicate && newItems.length === 0) {
        alert('선택하신 시간은 이미 추가된 일정입니다.');
        return;
      } else if (hasDuplicate) {
        alert('일부 중복된 일정을 제외하고 추가되었습니다.');
      }

      setScheduleList([...scheduleList, ...newItems]);
      setSelectedDate(null);
      setSelectedTimes([]);
    }
  };

  const handleRemoveSchedule = (index) => {
    setScheduleList(scheduleList.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (scheduleList.length > 0) {
      onSelect(scheduleList);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '450px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)', textAlign: 'center' }}>
          시연 테스트 희망 일정 선택
        </h3>
        
        {loadingHolidays ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            예약 가능 일자를 불러오는 중...
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>1. 날짜 선택</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {availableDates.map((d, idx) => {
                  const isSelected = selectedDate && d.getTime() === selectedDate.getTime();
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (selectedDate?.getTime() !== d.getTime()) {
                          setSelectedTimes([]);
                        }
                        setSelectedDate(d);
                      }}
                      style={{
                        flex: '1 1 30%',
                        padding: '0.75rem 0.5rem',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                        backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : '#fff',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      {formatDateLabel(d)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>2. 시간 선택</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {timeSlots.map((time) => {
                  const isSelected = selectedTimes.includes(time);
                  return (
                    <button
                      key={time}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTimes(selectedTimes.filter(t => t !== time));
                        } else {
                          setSelectedTimes([...selectedTimes, time]);
                        }
                      }}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                        backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : '#fff',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <Button 
                type="button" 
                onClick={handleAddSchedule}
                disabled={!selectedDate || selectedTimes.length === 0}
                style={{ width: '100%' }}
              >
                일정 추가
              </Button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>3. 선택한 일정</div>
              {scheduleList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  추가된 일정이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {scheduleList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 500, color: '#334155' }}>{item.date} {item.time}</span>
                      <button 
                        onClick={() => handleRemoveSchedule(idx)}
                        style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={onCancel} style={{ flex: 1 }}>취소</Button>
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={scheduleList.length === 0}
                style={{ flex: 1 }}
              >
                일정 확정하기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
