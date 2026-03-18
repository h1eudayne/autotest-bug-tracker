import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './DashboardPage.css';

function DashboardPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(stored));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        {/* BUG INTENTIONAL: rendering username directly without escaping */}
        <h1 data-testid="welcome-text">Welcome, {user.username}!</h1>
        <p>You are logged in successfully.</p>
        <button
          onClick={handleLogout}
          data-testid="logout-button"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
