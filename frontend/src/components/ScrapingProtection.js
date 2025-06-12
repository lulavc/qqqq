import React, { useState, useEffect } from 'react';
import useAntiScraping from '../hooks/useAntiScraping';

/**
 * Component that handles anti-scraping challenges transparently
 * Renders a challenge UI when needed
 */
const ScrapingProtection = ({ children }) => {
  const [challengeType, setChallengeType] = useState(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [captchaResponse, setCaptchaResponse] = useState('');
  const [challenge, setChallenge] = useState(null);
  
  const { processChallengeRequest } = useAntiScraping();
  
  // Check for challenge directive on component mount
  useEffect(() => {
    // Look for challenge header
    const challengeHeader = 
      document.querySelector('meta[name="x-challenge"]')?.getAttribute('content');
    
    if (challengeHeader) {
      setChallengeType(challengeHeader);
      setShowChallenge(true);
      fetchChallenge(challengeHeader);
    }
  }, []);
  
  // Fetch challenge data from server
  const fetchChallenge = async (type) => {
    try {
      setProcessing(true);
      
      const response = await fetch(`/api/challenge/${type}`);
      if (!response.ok) {
        console.error('Failed to fetch challenge');
        setProcessing(false);
        return;
      }
      
      const data = await response.json();
      setChallenge(data);
      
      // If JavaScript or honeypot challenge, handle automatically
      if (type === 'javascript' || type === 'honeypot') {
        handleAutomaticChallenge(data, type);
      } else {
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
      setProcessing(false);
    }
  };
  
  // Handle automatic challenges (JavaScript/honeypot)
  const handleAutomaticChallenge = async (challenge, type) => {
    try {
      const success = await processChallengeRequest(type);
      
      if (success) {
        setShowChallenge(false);
        setChallengeType(null);
      } else {
        // If automatic handling fails, show manual UI
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error handling challenge:', error);
      setProcessing(false);
    }
  };
  
  // Handle CAPTCHA submission
  const handleCaptchaSubmit = async (e) => {
    e.preventDefault();
    
    if (!captchaResponse || !challenge) {
      return;
    }
    
    try {
      setProcessing(true);
      
      const response = await fetch('/api/challenge/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-JS-Enabled': 'true'
        },
        body: JSON.stringify({
          id: challenge.id,
          type: 'captcha',
          response: captchaResponse
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowChallenge(false);
        setChallengeType(null);
      } else {
        // Reset and try again
        setCaptchaResponse('');
        fetchChallenge('captcha');
      }
    } catch (error) {
      console.error('Error submitting CAPTCHA:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Render appropriate challenge UI
  const renderChallengeUI = () => {
    if (!showChallenge || !challengeType || processing) {
      return null;
    }
    
    if (challengeType === 'captcha' && challenge) {
      return (
        <div className="challenge-overlay">
          <div className="challenge-container">
            <h2>Verificação de Segurança</h2>
            <p>Por favor, complete este desafio para continuar.</p>
            
            <div className="captcha-challenge">
              <p>Digite os caracteres abaixo:</p>
              <div className="captcha-text">
                {challenge.challenge}
              </div>
              
              <form onSubmit={handleCaptchaSubmit}>
                <input
                  type="text"
                  value={captchaResponse}
                  onChange={(e) => setCaptchaResponse(e.target.value)}
                  placeholder="Digite os caracteres"
                  maxLength={6}
                  autoComplete="off"
                />
                <button type="submit" disabled={processing}>
                  {processing ? 'Verificando...' : 'Verificar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="challenge-overlay">
        <div className="challenge-container">
          <h2>Verificação de Segurança</h2>
          <p>Verificando seu navegador...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      {renderChallengeUI()}
      {children}
      
      {/* CSS for challenge UI */}
      {showChallenge && (
        <style jsx>{`
          .challenge-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          
          .challenge-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 480px;
            width: 90%;
            text-align: center;
          }
          
          .captcha-challenge {
            margin-top: 1.5rem;
          }
          
          .captcha-text {
            font-family: monospace;
            font-size: 2rem;
            font-weight: bold;
            letter-spacing: 0.25rem;
            margin: 1rem 0;
            padding: 1rem;
            background: #f0f0f0;
            border-radius: 4px;
          }
          
          input {
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 1rem;
          }
          
          button {
            background: #4299e1;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          button:hover {
            background: #3182ce;
          }
          
          button:disabled {
            background: #a0aec0;
            cursor: not-allowed;
          }
          
          .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 1.5rem auto;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      )}
    </>
  );
};

export default ScrapingProtection; 