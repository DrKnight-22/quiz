import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { LogOut, Settings, User, BookOpen, Home, FileQuestion, Users, ChevronRight } from 'lucide-react';

const Layout = ({ children, title, role = 'student' }) => {
  const { user, userRole, signOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  // Define sidebar links based on role
  const sidebarLinks = {
    student: [
      { icon: <Home size={20} />, text: 'Dashboard', link: '/student/dashboard' },
      { icon: <BookOpen size={20} />, text: 'Courses', link: '/student/courses' }
    ],
    teacher: [
      { icon: <Home size={20} />, text: 'Dashboard', link: '/teacher/dashboard' },
      { icon: <FileQuestion size={20} />, text: 'Create Quiz', link: '/teacher/create-quiz' },
      { icon: <Users size={20} />, text: 'Student Scores', link: '/teacher/student-scores' }
    ],
    admin: [
      { icon: <Home size={20} />, text: 'Dashboard', link: '/admin/dashboard' },
      { icon: <Users size={20} />, text: 'Students', link: '/admin/students' },
      { icon: <Users size={20} />, text: 'Teachers', link: '/admin/teachers' },
      { icon: <FileQuestion size={20} />, text: 'Questions', link: '/admin/questions' },
      { icon: <BookOpen size={20} />, text: 'Score Records', link: '/admin/scores' }
    ]
  };
  
  // Use the role passed as prop, but fallback to authenticated user role if available
  const effectiveRole = role || userRole;
  const links = sidebarLinks[effectiveRole] || [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#E6F0DA]">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-[#B7D3AC] text-black p-4 md:min-h-screen">
        <div className="flex justify-between items-center md:block">
          <h1 className="text-lg md:text-xl font-bold mb-2 text-[#4A6741]">SPC QUIZ ONLINE</h1>
          {/* Mobile menu toggle could go here */}
        </div>
        
        {/* User info */}
        <div className="mt-6 mb-6 flex items-center p-2 bg-white bg-opacity-50 rounded-lg">
          <div className="w-10 h-10 bg-[#4A6741] rounded-full flex items-center justify-center text-white">
            <User size={18} />
          </div>
          <div className="ml-2">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs capitalize">{effectiveRole}</p>
          </div>
        </div>
        
        {/* Navigation links */}
        <nav className="mt-4">
          {links.map((item, index) => (
            <Link 
              key={index} 
              to={item.link}
              className="flex items-center p-2 my-2 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors group"
            >
              <span className="text-[#4A6741]">{item.icon}</span>
              <span className="ml-2">{item.text}</span>
              <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>
        
        {/* Settings and logout */}
        <div className="mt-auto pt-4 border-t border-[#4A6741] border-opacity-20">
          <Link 
            to="/settings"
            className="flex items-center p-2 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors mb-2"
          >
            <Settings size={20} className="text-[#4A6741]" />
            <span className="ml-2">Settings</span>
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center p-2 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors text-left"
          >
            <LogOut size={20} className="text-[#4A6741]" />
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-4">
        <header className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h1 className="text-xl font-semibold text-[#4A6741]">{title}</h1>
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;