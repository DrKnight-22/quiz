import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Users, GraduationCap, BookOpen, FileQuestion, Clock, Activity, Award, Bookmark } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
// import AdminDashboard from './AdminDashboard';

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const StatCard = ({ title, value, icon, trend, description }) => {
  const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500';
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
          {icon}
        </div>
        {trend !== 0 && (
          <span className={`text-sm font-medium ${trendColor}`}>
            {trendIcon} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
        {description && (
          <p className="text-xs text-gray-400 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    teachersCount: 0,
    studentsCount: 0,
    coursesCount: 0,
    quizzesCount: 0,
    activeUsers: 0,
    avgSession: '0m',
    completionRate: '0%',
    popularCourse: 'None'
  });
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulating more realistic data with trends
        const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const teachersSnapshot = await getDocs(teachersQuery);
        
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const studentsSnapshot = await getDocs(studentsQuery);
        
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
        
        // Mock data for demonstration - in a real app you'd fetch these
        const activeUsers = Math.floor(studentsSnapshot.size * 0.65);
        const avgSession = `${Math.floor(Math.random() * 15) + 15}m`;
        const completionRate = `${Math.floor(Math.random() * 30) + 60}%`;
        const popularCourse = coursesSnapshot.size > 0 ? "Introduction to React" : "None";
        
        setStats({
          teachersCount: teachersSnapshot.size,
          studentsCount: studentsSnapshot.size,
          coursesCount: coursesSnapshot.size,
          quizzesCount: quizzesSnapshot.size,
          activeUsers,
          avgSession,
          completionRate,
          popularCourse,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // User distribution data
  const userDistributionData = {
    labels: ['Teachers', 'Students', 'Admins'],
    datasets: [
      {
        data: [stats.teachersCount, stats.studentsCount, 2], // Adding admins
        backgroundColor: ['#6366F1', '#10B981', '#3B82F6'],
        borderColor: ['#ffffff'],
        borderWidth: 2,
      },
    ],
  };
  
  // Content data
  const contentData = {
    labels: ['Courses', 'Quizzes', 'Lessons', 'Resources'],
    datasets: [
      {
        label: 'Content',
        data: [stats.coursesCount, stats.quizzesCount, stats.coursesCount * 5, stats.coursesCount * 3],
        backgroundColor: '#6366F1',
        borderRadius: 6,
      },
    ],
  };
  
  // Engagement data (simulated)
  const engagementData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Users',
        data: [120, 190, 170, 210, 240, 180, 130],
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <DashboardLayout title="Dashboard Overview">
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back, Admin</h1>
            <p className="text-gray-500">Here's what's happening with your platform</p>
          </div>
          <div className="flex space-x-2 bg-white p-1 rounded-lg shadow-xs border border-gray-100">
            {['day', 'week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === range 
                    ? 'bg-indigo-100 text-indigo-700 font-medium' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <StatCard 
                title="Total Teachers" 
                value={stats.teachersCount} 
                icon={<Users size={20} />} 
                trend={5.2}
                description="Compared to last week"
              />
              <StatCard 
                title="Active Students" 
                value={stats.activeUsers} 
                icon={<Activity size={20} />} 
                trend={12.7}
                description="Logged in this week"
              />
              <StatCard 
                title="Avg. Session" 
                value={stats.avgSession} 
                icon={<Clock size={20} />} 
                trend={3.1}
                description="Time spent learning"
              />
              <StatCard 
                title="Completion Rate" 
                value={stats.completionRate} 
                icon={<Award size={20} />} 
                trend={1.8}
                description="Course completion"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <StatCard 
                title="Total Courses" 
                value={stats.coursesCount} 
                icon={<BookOpen size={20} />} 
                trend={8.4}
                description="Available for students"
              />
              <StatCard 
                title="Assessments" 
                value={stats.quizzesCount} 
                icon={<FileQuestion size={20} />} 
                trend={15.3}
                description="Quizzes & tests"
              />
              <StatCard 
                title="Popular Course" 
                value={stats.popularCourse} 
                icon={<Bookmark size={20} />} 
                description="Most enrolled this month"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 col-span-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">User Distribution</h3>
                <div className="h-64">
                  <Pie 
                    data={userDistributionData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            usePointStyle: true,
                            padding: 20
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 col-span-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Content Overview</h3>
                <div className="h-64">
                  <Bar 
                    data={contentData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            drawBorder: false
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 col-span-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Engagement</h3>
                <div className="h-64">
                  <Line 
                    data={engagementData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            drawBorder: false
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            usePointStyle: true,
                            padding: 20
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
              
                    
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                      <Activity size={16} className="text-indigo-600" />
                    </div>

                  </div>
                ))}
              </div>

                

            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;