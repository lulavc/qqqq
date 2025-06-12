/**
 * Client-side anti-scraping protection
 * Works with the backend protection to make scraping more difficult
 */

// DOM mutation to prevent easy scraping
export function applyDomProtection() {
  // Don't run in development mode
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  
  // Apply randomized CSS classes to important content
  const protectedElements = document.querySelectorAll('[data-protected]');
  protectedElements.forEach(element => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    element.classList.add(`item-${randomSuffix}`);
    
    // Remove data-protected attribute to make it harder to find
    element.removeAttribute('data-protected');
  });
  
  // Randomize product class names
  document.querySelectorAll('.product, .service, .price').forEach(element => {
    const randomClass = `content-${Math.random().toString(36).substring(2, 8)}`;
    element.classList.add(randomClass);
  });
  
  // Add invisible honeypot fields to forms
  document.querySelectorAll('form').forEach(form => {
    const honeypotField = document.createElement('input');
    honeypotField.setAttribute('type', 'text');
    honeypotField.setAttribute('name', 'website'); // Common name that might trick bots
    honeypotField.setAttribute('autocomplete', 'off');
    honeypotField.style.position = 'absolute';
    honeypotField.style.opacity = '0';
    honeypotField.style.height = '0';
    honeypotField.style.width = '0';
    honeypotField.style.zIndex = '-1';
    form.appendChild(honeypotField);
  });
}

// Track mouse movements to detect real users
const movementBuffer = [];
let lastReportTime = 0;
const REPORT_INTERVAL = 10000; // Report every 10 seconds

export function setupMouseTracking() {
  // Skip for non-browser environments
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  
  // Record mouse movements
  document.addEventListener('mousemove', event => {
    // Only record a small percentage of movements to reduce overhead
    if (Math.random() > 0.1) return;
    
    movementBuffer.push({
      x: event.clientX,
      y: event.clientY,
      t: Date.now()
    });
    
    // Limit buffer size
    if (movementBuffer.length > 100) {
      movementBuffer.shift();
    }
    
    // Report periodically
    const now = Date.now();
    if (now - lastReportTime > REPORT_INTERVAL && movementBuffer.length > 5) {
      reportMouseActivity();
      lastReportTime = now;
    }
  });
  
  // Report on page unload if we have data
  window.addEventListener('beforeunload', () => {
    if (movementBuffer.length > 0) {
      reportMouseActivity();
    }
  });
}

// Report mouse movement data to server
function reportMouseActivity() {
  if (movementBuffer.length === 0) return;
  
  // Send movement count to server
  fetch('/api/challenge/activity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-JS-Enabled': 'true'
    },
    body: JSON.stringify({
      movements: movementBuffer.length
    }),
    // Use keepalive to ensure the request completes even if page is unloading
    keepalive: true
  }).catch(() => {
    // Ignore errors to prevent console warnings
  });
  
  // Clear buffer after reporting
  movementBuffer.length = 0;
}

// Set up content protection with progressive disclosure
export function setupContentProtection() {
  // Don't run in development
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  
  // Initial page load - protect sensitive content
  document.querySelectorAll('[data-sensitive]').forEach(element => {
    const originalContent = element.innerHTML;
    const contentId = Math.random().toString(36).substring(2, 10);
    
    // Store original content in memory
    window._protectedContent = window._protectedContent || {};
    window._protectedContent[contentId] = originalContent;
    
    // Replace with placeholder
    element.innerHTML = `<div class="protected-content" data-content-id="${contentId}">
      <span class="placeholder-text">Carregando conteúdo...</span>
    </div>`;
    
    // Reveal after delay and user interaction
    setTimeout(() => {
      // Only reveal if user has interacted
      if (movementBuffer.length > 0 || document.hasFocus()) {
        const contentElement = document.querySelector(`[data-content-id="${contentId}"]`);
        if (contentElement) {
          contentElement.innerHTML = window._protectedContent[contentId];
          // Clean up memory
          delete window._protectedContent[contentId];
        }
      }
    }, 800 + Math.random() * 500); // Randomized delay
  });
}

// Handle server challenge requests
export async function handleChallengeRequest(challengeType) {
  try {
    // Fetch appropriate challenge from server
    const response = await fetch(`/api/challenge/${challengeType}`);
    if (!response.ok) {
      return false;
    }
    
    const challenge = await response.json();
    
    if (challengeType === 'javascript') {
      return handleJavaScriptChallenge(challenge);
    } else if (challengeType === 'honeypot') {
      return handleHoneypotChallenge(challenge);
    } else if (challengeType === 'captcha') {
      return handleCaptchaChallenge(challenge);
    }
    
    return false;
  } catch (error) {
    console.error('Challenge error:', error);
    return false;
  }
}

// Handle JavaScript challenge (math problem)
async function handleJavaScriptChallenge(challenge) {
  try {
    // Calculate the answer locally
    const expression = challenge.challenge; // e.g. "42 + 24"
    // IMPORTANT: In production, use a safer method to evaluate expressions
    // This is simplified for demonstration
    const parts = expression.split(' ');
    const a = parseInt(parts[0], 10);
    const op = parts[1];
    const b = parseInt(parts[2], 10);
    
    let result;
    if (op === '+') {
      result = a + b;
    } else if (op === '-') {
      result = a - b;
    } else if (op === '*') {
      result = a * b;
    } else {
      return false;
    }
    
    // Send result to server for verification
    const verifyResponse = await fetch('/api/challenge/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JS-Enabled': 'true'
      },
      body: JSON.stringify({
        id: challenge.id,
        type: 'javascript',
        response: result
      })
    });
    
    const verification = await verifyResponse.json();
    return verification.success;
    
  } catch (error) {
    console.error('JavaScript challenge error:', error);
    return false;
  }
}

// Handle honeypot challenge (invisible field that should be left empty)
async function handleHoneypotChallenge(challenge) {
  try {
    // Always send empty response for honeypots (real users never see them)
    const verifyResponse = await fetch('/api/challenge/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JS-Enabled': 'true'
      },
      body: JSON.stringify({
        id: challenge.id,
        type: 'honeypot',
        response: ''
      })
    });
    
    const verification = await verifyResponse.json();
    return verification.success;
    
  } catch (error) {
    console.error('Honeypot challenge error:', error);
    return false;
  }
}

// Handle CAPTCHA challenge (would typically show UI)
async function handleCaptchaChallenge(challenge) {
  try {
    // In a real implementation, you would show a UI for the user
    // For this example, we simulate a perfect response
    
    const verifyResponse = await fetch('/api/challenge/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JS-Enabled': 'true'
      },
      body: JSON.stringify({
        id: challenge.id,
        type: 'captcha',
        response: challenge.challenge // In a real app, this would come from user input
      })
    });
    
    const verification = await verifyResponse.json();
    return verification.success;
    
  } catch (error) {
    console.error('CAPTCHA challenge error:', error);
    return false;
  }
}

// Setup to run on page load
export function initAntiScrapingProtection() {
  // Only run in browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  
  // Set JS enabled header for all requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Create new options object to avoid modifying the original
    const newOptions = { ...options };
    
    // Ensure headers object exists
    newOptions.headers = newOptions.headers || {};
    
    // Add custom header to indicate JavaScript is enabled
    if (typeof newOptions.headers === 'object') {
      newOptions.headers = {
        ...newOptions.headers,
        'X-JS-Enabled': 'true'
      };
    }
    
    // Call original fetch with modified options
    return originalFetch(url, newOptions);
  };
  
  // Set up all protections
  setTimeout(() => {
    applyDomProtection();
    setupMouseTracking();
    setupContentProtection();
    
    // Check if challenge is required
    const challengeType = document.querySelector('meta[name="x-challenge"]')?.getAttribute('content');
    if (challengeType) {
      handleChallengeRequest(challengeType);
    }
  }, 100);
} 