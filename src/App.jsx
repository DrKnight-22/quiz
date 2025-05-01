import { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { db } from './utils/localStorageDB';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminRegister from './pages/AdminRegister';
import StudentDashboard from './pages/student/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import NotFound from './pages/NotFound';

// Admin Pages
import StudentsList from './pages/admin/StudentsList';
import TeachersList from './pages/admin/TeachersList';
import AddStudent from './pages/admin/AddStudent';
import AddTeacher from './pages/admin/AddTeacher';
import ScoreRecords from './pages/admin/ScoreRecords';
import Questions from './pages/admin/Questions';

// Teacher Pages
import CreateQuiz from './pages/teacher/CreateQuiz';
import StudentScores from './pages/teacher/StudentScores';
import CoursesManagement from './pages/teacher/CoursesManagement';

// Student Pages
import Courses from './pages/student/Courses';
import TakeQuiz from './pages/student/TakeQuiz';
import QuizResults from './pages/student/QuizResults';

export const AuthContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemError, setSystemError] = useState(null);

  // Initialize and validate data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[App] Initializing database...');
        await db.init();
        
        console.log('[App] Running data migrations...');
        await migrateProfiles();
        
        console.log('[App] Checking active session...');
        const session = await safelyParseSession();
        
        if (session) {
          console.log('[App] Found valid session:', session);
          setUser(session.user);
          setUserRole(session.userRole);
        }
      } catch (error) {
        console.error('[App] Initialization error:', error);
        setSystemError({
          message: 'Failed to initialize application',
          details: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const safelyParseSession = () => {
    try {
      const sessionData = localStorage.getItem('quizAppSession');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Failed to parse session:', error);
      localStorage.removeItem('quizAppSession');
      return null;
    }
  };

  const migrateProfiles = async () => {
    try {
      const users = db.get('users');
      console.log(`[Migration] Found ${users.length} users`);
      
      let created = 0;
      users.forEach(user => {
        const profile = db.find('profiles', { id: user.id });
        if (!profile) {
          console.log(`[Migration] Creating profile for user ${user.id}`);
          db.insert('profiles', {
            id: user.id,
            full_name: user.full_name || user.email.split('@')[0],
            email: user.email,
            role: user.role,
            created_at: user.created_at || new Date().toISOString()
          });
          created++;
        }
      });
      console.log(`[Migration] Created ${created} profiles`);
    } catch (error) {
      console.error('[Migration] Failed:', error);
      throw error;
    }
  };

  const authValue = {
    user,
    userRole,
    signIn: async (email, password) => {
      try {
        const user = db.find('users', { email, password });
        if (!user) {
          return { error: { message: 'Invalid credentials' } };
        }
        
        const profile = db.find('profiles', { id: user.id });
        if (!profile) {
          return { error: { message: 'Profile not found' } };
        }
        
        const session = { user, userRole: profile.role };
        localStorage.setItem('quizAppSession', JSON.stringify(session));
        
        // Update state immediately
        setUser(user);
        setUserRole(profile.role);
        
        return { 
          data: { 
            user,
            userRole: profile.role // Include role in response
          } 
        };
      } catch (error) {
        return { error: { message: error.message } };
      }
    },
    signOut: async () => {
      try {
        localStorage.removeItem('quizAppSession');
        setUser(null);
        setUserRole(null);
        return { success: true };
      } catch (error) {
        console.error('[Auth] Sign-out error:', error);
        return { error: { message: 'Logout failed' }};
      }
    },
    registerUser: async (userData) => {
      try {
        console.log('[Auth] Registering user:', userData.email);
        
        if (db.find('users', { email: userData.email })) {
          throw new Error('User already exists');
        }

        const { data: user } = db.insert('users', {
          ...userData,
          created_at: new Date().toISOString()
        });

        db.insert('profiles', {
          id: user.id,
          full_name: userData.full_name || userData.email.split('@')[0],
          email: userData.email,
          role: userData.role,
          created_at: new Date().toISOString()
        });

        return { data: { user } };
      } catch (error) {
        console.error('[Auth] Registration error:', {
          error: error.message,
          stack: error.stack,
          userData
        });
        return { error: { 
          message: error.message || 'Registration failed',
          details: error.stack 
        }};
      }
    },
    clearError: () => setSystemError(null)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (systemError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">System Error</h2>
          <p className="mb-4">{systemError.message}</p>
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-600">Technical details</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {systemError.details}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    return <ErrorBoundary>{children}</ErrorBoundary>;
  };

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login/:role?" element={<Login />} />
            <Route path="/register/admin" element={<AdminRegister />} />
            
            {/* Student Routes */}
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/courses" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Courses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/quiz/:id" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TakeQuiz />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/results/:id" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QuizResults />
                </ProtectedRoute>
              } 
            />
            
            {/* Teacher Routes */}
            <Route 
              path="/teacher/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/create-quiz" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <CreateQuiz />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/student-scores" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <StudentScores />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/courses" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <CoursesManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/students" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StudentsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/teachers" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TeachersList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/add-student" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AddStudent />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/add-teacher" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AddTeacher />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/scores" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ScoreRecords />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/questions" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Questions />
                </ProtectedRoute>
              } 
            />
            
            {/* Common Routes */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                  <ChangePassword />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;