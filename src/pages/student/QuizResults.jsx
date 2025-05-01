import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { CheckCircle2, XCircle, Clock, BarChart2 } from 'lucide-react';

const QuizResults = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        
        // Fetch quiz result
        const resultData = db.getById('quiz_results', id);
        if (!resultData) {
          throw new Error('Result not found');
        }
        
        // Fetch quiz details
        const quizData = db.getById('quizzes', resultData.quiz_id);
        
        // Fetch questions and options
        const questionsData = db.get('questions')
          .filter(q => q.quiz_id === resultData.quiz_id)
          .map(question => ({
            ...question,
            options: db.get('options').filter(o => o.question_id === question.id)
          }));
        
        setResult(resultData);
        setQuiz(quizData);
        setQuestions(questionsData);
        
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [id]);
  
  if (loading) {
    return (
      <Layout title="Quiz Results" role="student">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  return (
    <Layout title="Quiz Results" role="student">
      <div className="max-w-3xl mx-auto">
        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{quiz?.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <BarChart2 size={20} className="text-[#6E8B55] mr-2" />
                <span className="font-medium">Score</span>
              </div>
              <p className={`text-2xl font-bold ${
                result.score >= quiz.passing_score ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.score}%
              </p>
              <p className="text-sm text-gray-500">
                Passing Score: {quiz.passing_score}%
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock size={20} className="text-[#6E8B55] mr-2" />
                <span className="font-medium">Time Taken</span>
              </div>
              <p className="text-2xl font-bold">{formatTime(result.time_taken)}</p>
              <p className="text-sm text-gray-500">
                Time Limit: {quiz.time_limit}m
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle2 size={20} className="text-[#6E8B55] mr-2" />
                <span className="font-medium">Status</span>
              </div>
              <p className={`text-2xl font-bold ${
                result.score >= quiz.passing_score ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.score >= quiz.passing_score ? 'Passed' : 'Failed'}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(result.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Link
              to="/student/dashboard"
              className="px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
        
        {/* Questions Review */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const selectedOption = question.options.find(
              o => o.id === result.answers[question.id]
            );
            const correctOption = question.options.find(o => o.is_correct);
            const isCorrect = selectedOption?.id === correctOption?.id;
            
            return (
              <div key={question.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-medium">Question {index + 1}</h3>
                  {isCorrect ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 size={20} className="mr-1" />
                      <span>Correct</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle size={20} className="mr-1" />
                      <span>Incorrect</span>
                    </div>
                  )}
                </div>
                
                <p className="mb-4">{question.question_text}</p>
                
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={`p-3 rounded-lg ${
                        option.is_correct
                          ? 'bg-green-100 border border-green-200'
                          : option.id === selectedOption?.id
                          ? 'bg-red-100 border border-red-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        {option.is_correct && (
                          <CheckCircle2 size={16} className="text-green-600 mr-2" />
                        )}
                        {!option.is_correct && option.id === selectedOption?.id && (
                          <XCircle size={16} className="text-red-600 mr-2" />
                        )}
                        <span>{option.option_text}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {!isCorrect && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Correct Answer: </span>
                      {correctOption?.option_text}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default QuizResults;