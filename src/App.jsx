import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

import ExamAuth from './pages/ExamAuth';
import ExamForm from './pages/ExamForm';
import ExamResult from './pages/ExamResult';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminGrade from './pages/admin/AdminGrade';
import AdminAuth from './pages/admin/AdminAuth';

function ProtectedAdminRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/exam" replace />} />
          <Route path="/exam" element={<ExamAuth />} />
          <Route path="/exam/take" element={<ExamForm />} />
          <Route path="/result/:id" element={<ExamResult />} />
          
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/admin/*" element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/questions" element={<AdminQuestions />} />
                  <Route path="/grade/:id" element={<AdminGrade />} />
                </Routes>
              </AdminLayout>
            </ProtectedAdminRoute>
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
