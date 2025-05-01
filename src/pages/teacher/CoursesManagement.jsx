import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { BookOpen, Users, Plus, Edit, Trash2 } from 'lucide-react';

const CoursesManagement = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCourse, setNewCourse] = useState({
    title: '',
    subject: '',
    description: '',
    students: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch courses created by this teacher
        const teacherCourses = db.filter('courses', { teacher_id: user.id });
        setCourses(teacherCourses);
        
        // Fetch all students
        const allStudents = db.filter('profiles', { role: 'student' });
        setStudents(allStudents);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const handleCreateCourse = () => {
    try {
      const courseData = {
        ...newCourse,
        teacher_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data } = db.insert('courses', courseData);
      setCourses([...courses, data]);
      setNewCourse({
        title: '',
        subject: '',
        description: '',
        students: []
      });
      
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const handleDeleteCourse = (courseId) => {
    try {
      db.delete('courses', courseId);
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const toggleStudentEnrollment = (courseId, studentId) => {
    try {
      const updatedCourses = courses.map(course => {
        if (course.id === courseId) {
          const students = course.students.includes(studentId)
            ? course.students.filter(id => id !== studentId)
            : [...course.students, studentId];
            
          db.update('courses', courseId, { students });
          return { ...course, students };
        }
        return course;
      });
      
      setCourses(updatedCourses);
    } catch (error) {
      console.error('Error updating enrollment:', error);
    }
  };

  if (loading) {
    return (
      <Layout title="Course Management" role="teacher">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Course Management" role="teacher">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Course Management</h1>
        
        {/* Create New Course Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Course</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">Course Title</label>
              <input
                type="text"
                value={newCourse.title}
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Course Title"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={newCourse.subject}
                onChange={(e) => setNewCourse({...newCourse, subject: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Subject"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              value={newCourse.description}
              onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              rows="3"
              placeholder="Course description"
            />
          </div>
          <button
            onClick={handleCreateCourse}
            className="px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Create Course
          </button>
        </div>
        
        {/* Courses List */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Your Courses</h2>
          
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map(course => (
                <div key={course.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{course.title}</h3>
                      <p className="text-gray-600">{course.subject}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="mb-4">{course.description}</p>
                  
                  <div>
                    <h4 className="font-medium mb-2">Enrolled Students</h4>
                    {students.length > 0 ? (
                      <div className="space-y-2">
                        {students.map(student => (
                          <div key={student.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`${course.id}-${student.id}`}
                              checked={course.students?.includes(student.id)}
                              onChange={() => toggleStudentEnrollment(course.id, student.id)}
                              className="mr-2"
                            />
                            <label htmlFor={`${course.id}-${student.id}`}>
                              {student.full_name} ({student.email})
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No students available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">You haven't created any courses yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CoursesManagement;