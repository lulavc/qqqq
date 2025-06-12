import { useEffect, useMemo, useCallback } from 'react';
import { 
  initAntiScrapingProtection,
  handleChallengeRequest
} from '../utils/antiScraping';

/**
 * React hook to integrate anti-scraping protection
 * with frontend components
 */
export default function useAntiScraping() {
  // Initialize protection on mount
  useEffect(() => {
    initAntiScrapingProtection();
  }, []);
  
  /**
   * Function to protect high-value content with progressive disclosure
   * @param {React.ReactNode} content - The content to protect
   * @param {Object} options - Configuration options
   * @returns {React.ReactNode} - Protected content with wrapper
   */
  const protectContent = useCallback((content, options = {}) => {
    // Generate unique ID for this content
    const contentId = useMemo(() => 
      Math.random().toString(36).substring(2, 10),
      []);
    
    // In SSR, just return the content
    if (typeof window === 'undefined') {
      return content;
    }
    
    // Default options
    const defaultOptions = {
      sensitive: true,   // Apply data-sensitive attribute
      protected: true,   // Apply data-protected attribute
      className: ''      // Additional CSS classes
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Add protection attributes that will be processed by client-side code
    return (
      <div 
        className={`protected-wrapper ${mergedOptions.className}`}
        {...(mergedOptions.sensitive ? { 'data-sensitive': 'true' } : {})}
        {...(mergedOptions.protected ? { 'data-protected': 'true' } : {})}
        data-content-id={contentId}
      >
        {content}
      </div>
    );
  }, []);
  
  /**
   * Function to create a honeypot field for forms
   * @param {Object} props - Additional props for the input element
   * @returns {React.ReactNode} - Hidden honeypot input
   */
  const createHoneypot = useCallback((props = {}) => {
    return (
      <input
        type="text"
        name="website" // Common name that appears legitimate
        autoComplete="off"
        style={{
          position: 'absolute',
          opacity: 0,
          height: 0,
          width: 0,
          zIndex: -1,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
        tabIndex="-1"
        {...props}
      />
    );
  }, []);
  
  /**
   * Function to handle challenge requests from server
   * @param {string} challengeType - Type of challenge to request
   * @returns {Promise<boolean>} - Whether challenge was passed
   */
  const processChallengeRequest = useCallback(async (challengeType) => {
    if (!challengeType) return true;
    return await handleChallengeRequest(challengeType);
  }, []);
  
  /**
   * Function to add honeypots and protection to forms
   * @param {React.ReactNode} formElement - The form to protect
   * @returns {React.ReactNode} - Protected form with honeypots
   */
  const protectForm = useCallback((formElement) => {
    // Clone the form element to add our protection
    return React.cloneElement(
      formElement,
      { ...formElement.props },
      [
        ...React.Children.toArray(formElement.props.children),
        createHoneypot(),
        // Add additional hidden field to mark JS enabled
        <input 
          type="hidden" 
          name="js_enabled" 
          value="true" 
          key="js_enabled_field" 
        />
      ]
    );
  }, [createHoneypot]);
  
  return {
    protectContent,
    createHoneypot,
    protectForm,
    processChallengeRequest
  };
} 