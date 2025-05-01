import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthContext } from '../../App';
import { db } from '../../utils/localStorageDB';
import { Save, Plus, Trash2 } from 'lucide-react';

const CreateQuiz = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    passingScore: 70,
    questions: [
      {
        questionText: '',
        questionType: 'multiple_choice',
        points: 1,
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ]
      }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          questionText: '',
          questionType: 'multiple_choice',
          points: 1,
          options: [
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false }
          ]
        }
      ]
    });
  };
  
  const removeQuestion = (index) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };
  
  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };
  
  const updateOption = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex][field] = value;
    
    // If marking as correct, unmark others
    if (field === 'isCorrect' && value === true) {
      newQuestions[questionIndex].options.forEach((option, idx) => {
        if (idx !== optionIndex) {
          option.isCorrect = false;
        }
      });
    }
    
    setFormData({ ...formData, questions: newQuestions });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('Quiz title is required');
      return;
    }
    
    if (formData.questions.some(q => !q.questionText)) {
      setError('All questions must have text');
      return;
    }
    
    if (formData.questions.some(q => 
      !q.options.some(o => o.isCorrect) || 
      q.options.some(o => !o.optionText)
    )) {
      setError('Each question must have all options filled and one correct answer');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create quiz
      const { data: quizData } = db.insert('quizzes', {
        title: formData.title,
        description: formData.description,
        teacher_id: user.id,
        time_limit: formData.timeLimit,
        passing_score: formData.passingScore,
        is_active: true,
        question_count: formData.questions.length
      });
      
      // Create questions and options
      for (const question of formData.questions) {
        const { data: questionData } = db.insert('questions', {
          quiz_id: quizData.id,
          question_text: question.questionText,
          question_type: question.questionType,
          points: question.points
        });
        
        // Create options for this question
        question.options.forEach(option => {
          db.insert('options', {
            question_id: questionData.id,
            option_text: option.optionText,
            is_correct: option.isCorrect
          });
        });
      }
      
      // Success - redirect to dashboard
      navigate('/teacher/dashboard');
      
    } catch (error) {
      console.error('Error creating quiz:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout title="Create New Quiz" role="teacher">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Quiz Details */}
          <div className="mb-6">
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 mb-2">Quiz Title</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter quiz title"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 mb-2">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter quiz description"
                rows="3"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="timeLimit" className="block text-gray-700 mb-2">Time Limit (minutes)</label>
                <input
                  type="number"
                  id="timeLimit"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  min="1"
                />
              </div>
              
              <div>
                <label htmlFor="passingScore" className="block text-gray-700 mb-2">Passing Score (%)</label>
                <input
                  type="number"
                  id="passingScore"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
          
          {/* Questions */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Add Question
              </button>
            </div>
            
            {formData.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="mb-6 p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Question {questionIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-red-600 hover:text-red-800"
                    disabled={formData.questions.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Question Text</label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Enter question text"
                    rows="2"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Question Type</label>
                  <select
                    value={question.questionType}
                    onChange={(e) => updateQuestion(questionIndex, 'questionType', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Points</label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Options</label>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${questionIndex}`}
                          checked={option.isCorrect}
                          onChange={() => updateOption(questionIndex, optionIndex, 'isCorrect', true)}
                          className="w-4 h-4 text-green-600"
                        />
                        <input
                          type="text"
                          value={option.optionText}
                          onChange={(e) => updateOption(questionIndex, optionIndex, 'optionText', e.target.value)}
                          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Creating Quiz...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Create Quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateQuiz;