import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#E6F0DA] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#4A6741] mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-5 py-3 bg-[#6E8B55] text-white rounded-lg hover:bg-[#5A7648] transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;