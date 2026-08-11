import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFromSheet } from '../api/googleSheet';

const EXAM_TIME_SECONDS = 90 * 60; // 90분

export function useExam(owner) {
  const setId = owner?.assigned_set_id;
  const storageKey = owner?.email ? `exam_state_${owner.email}` : null;

  const getInitialState = () => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return { answers: {}, timeLeft: EXAM_TIME_SECONDS };
  };

  const initialState = getInitialState();

  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [answers, setAnswers] = useState(initialState.answers);
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // 상태 저장 (제출 중이 아닐 때만)
  useEffect(() => {
    if (storageKey && !isSubmitting) {
      localStorage.setItem(storageKey, JSON.stringify({ answers, timeLeft }));
    }
  }, [answers, timeLeft, storageKey, isSubmitting]);

  // 저장된 상태 초기화 (제출 성공 시 호출)
  const clearExamState = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // 문항 로딩
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetchFromSheet('get_questions', setId ? { set_id: setId } : {});
        if (response.success) {
          setQuestions(response.data);
        } else {
          console.error("문항 로딩 실패:", response.message);
          alert("문항 데이터를 불러오지 못했습니다.");
        }
      } catch (err) {
        console.error(err);
        alert("문항 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, []);

  // 답변 업데이트
  const handleAnswerChange = useCallback((questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  // 타이머 로직 (1초마다 감소)
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  // 포맷된 시간 반환 (MM:SS)
  const formatTime = () => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 미답 문항 체크
  const getUnansweredQuestions = () => {
    const unanswered = [];
    questions.forEach(q => {
      if (!answers[q.id] || answers[q.id].toString().trim() === '') {
        unanswered.push(q.number);
      }
    });
    return unanswered;
  };

  return {
    questions,
    isLoadingQuestions,
    answers,
    handleAnswerChange,
    timeLeft,
    formatTime,
    getUnansweredQuestions,
    isSubmitting,
    setIsSubmitting,
    clearExamState
  };
}
