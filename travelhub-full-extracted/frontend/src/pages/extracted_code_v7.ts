import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '@components/common/Button/Button';
import Container from '@components/layout/Container/Container';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Container>
        <div className="text-center">
          <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist.
          </p>
          <Button
            size="lg"
            icon={<Home className="w-5 h-5" />}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default NotFound;
