import { useState, useEffect } from 'react';

interface GoogleTranslateProps {
  className?: string;
}

interface WindowWithGoogle extends Window {
  google?: {
    translate?: {
      TranslateElement: new (options: any, element: string | HTMLElement) => void;
    };
  };
  googleTranslateElementInit?: () => void;
}

const GoogleTranslate: React.FC<GoogleTranslateProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
    { code: 'ceb', name: 'Bisaya', flag: '🇵🇭' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const translatePage = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    setIsOpen(false);
    
    // Simple and reliable approach: just trigger the Google Translate combo
    const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectField) {
      selectField.value = languageCode;
      selectField.dispatchEvent(new Event('change'));
    } else {
      // If Google Translate isn't loaded, load it and set language immediately
      loadGoogleTranslate(languageCode);
    }
  };

  const loadGoogleTranslate = (languageCode?: string) => {
    const googleWindow = window as WindowWithGoogle;
    
    // Check if already loaded
    if (googleWindow.google && googleWindow.google.translate && document.querySelector('.goog-te-combo')) {
      if (languageCode) {
        const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (selectField) {
          selectField.value = languageCode;
          selectField.dispatchEvent(new Event('change'));
        }
      }
      return;
    }

    // Load Google Translate script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(script);

    // Set up callback with timeout to avoid ESLint error
    setTimeout(() => {
      googleWindow.googleTranslateElementInit = () => {
        if (googleWindow.google && googleWindow.google.translate) {
          new googleWindow.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,tl,ceb',
              layout: 0,
              autoDisplay: false
            },
            'google_translate_element'
          );
          
          // If a language was specified, set it immediately
          if (languageCode) {
            setTimeout(() => {
              const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement;
              if (selectField) {
                selectField.value = languageCode;
                selectField.dispatchEvent(new Event('change'));
              }
            }, 500);
          }
        }
      };
    }, 0);
  };

  useEffect(() => {
    // Initialize Google Translate on component mount
    loadGoogleTranslate();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div id="google_translate_element" className="hidden"></div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
        aria-label="Translate page"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="text-sm font-medium">{currentLang.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => translatePage(lang.code)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 ${
                currentLanguage === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLanguage === lang.code && (
                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate;
