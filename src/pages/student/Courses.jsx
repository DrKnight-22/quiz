import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { Search, BookOpen } from 'lucide-react';

const Courses = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        
        // Get all courses from localStorage
        const coursesData = db.get('courses')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);
  
  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <Layout title="Available Courses" role="student">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Available Courses" role="student">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>
      
      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {course.image_url ? (
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-[#B7D3AC] flex items-center justify-center">
                <BookOpen size={48} className="text-[#4A6741]" />
              </div>
            )}
            
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {course.description || 'No description available'}
              </p>
              
              <Link
                to={`/student/courses/${course.id}`}
                className="inline-block px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors"
              >
                View Course
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No courses found</p>
        </div>
      )}
    </Layout>
  );
};

export default Courses;