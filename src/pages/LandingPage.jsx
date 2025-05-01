import { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { BookOpen, User, Shield } from 'lucide-react';

const LandingPage = () => {
  const { user, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to role-specific dashboard if already logged in
    if (user && userRole) {
      navigate(`/${userRole}/dashboard`);
    }
  }, [user, userRole, navigate]);
  
  // Role cards data
  const roles = [
    {
      name: 'Student',
      description: 'Access quizzes, view your scores, and track your progress',
      icon: <BookOpen size={48} className="text-green-700 mb-4" />,
      path: '/login/student',
      color: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200',
      shadow: 'shadow-green-100'
    },
    {
      name: 'Teacher',
      description: 'Create quizzes, manage questions, and view student performance',
      icon: <User size={48} className="text-blue-700 mb-4" />,
      path: '/login/teacher',
      color: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      shadow: 'shadow-blue-100'
    },
    {
      name: 'Admin',
      description: 'Manage users, view analytics, and configure system settings',
      icon: <Shield size={48} className="text-purple-700 mb-4" />,
      path: '/login/admin',
      color: 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: 'border-purple-200',
      shadow: 'shadow-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-[#E6F0DA] flex flex-col">
      {/* Header */}
      <header className="bg-[#B7D3AC] py-4 px-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#4A6741]">SPC QUIZ ONLINE</h1>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#4A6741] mb-3">Welcome to SPC QUIZ ONLINE</h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            The comprehensive online quiz platform for students, teachers, and administrators.
            Select your role to begin.
          </p>
        </div>
        
        {/* Role selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
          {roles.map((role, index) => (
            <Link 
              key={index} 
              to={role.path}
              className={`p-6 rounded-xl border ${role.border} ${role.color} 
                ${role.shadow} transition-transform hover:scale-105 flex flex-col items-center text-center`}
            >
              {role.icon}
              <h3 className="text-xl font-semibold mb-2">{role.name}</h3>
              <p className="text-gray-600">{role.description}</p>
            </Link>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#B7D3AC] py-4 px-6 text-center text-[#4A6741]">
        <p>&copy; {new Date().getFullYear()} SPC QUIZ ONLINE. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;