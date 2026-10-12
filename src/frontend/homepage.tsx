import '../styles/homepage.css';
import logo from '../assets/logo.svg';
import { useNavigate } from 'react-router-dom';


function homepage() {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <main className="hero-content">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <h1 className="welcome-message">Write your first message!</h1>
        <button
          type="button"
          className="create-message-button"
          onClick={() => navigate('/create')}
        >
          Create Message
        </button>
      </main>
    </div>
  );
}

export default homepage;