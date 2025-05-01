import { useState, useEffect, useContext } from 'react';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { Search, FileQuestion, Plus } from 'lucide-react';

const Questions = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        
        // Get all questions with their quizzes and options
        const questionsData = db.get('questions').map(question => ({
          ...question,
          quizzes: db.getById('quizzes', question.quiz_id),
          options: db.get('options').filter(o => o.question_id === question.id)
        }));
        
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, []);
  
  const filteredQuestions = questions.filter(question =>
    question.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.quizzes?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <Layout title="Questions Bank" role="admin">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Questions Bank" role="admin">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="relative w-full md:w-64 mb-4 md:mb-0">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          <button
            className="w-full md:w-auto px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors flex items-center justify-center"
          >
            <Plus size={18} className="mr-2" />
            Add New Question
          </button>
        </div>
        
        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{question.question_text}</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  {question.question_type}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 mb-3">
                Quiz: {question.quizzes?.title || 'Unknown Quiz'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {question.options?.map((option) => (
                  <div 
                    key={option.id}
                    className={`p-2 rounded ${
                      option.is_correct 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {option.option_text}
                    {option.is_correct && (
                      <span className="ml-2 text-xs">(Correct)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <FileQuestion size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No questions found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Questions;