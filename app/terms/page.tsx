'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { notificationManager } from '@/components/NotificationManager';

type Language = 'english' | 'filipino' | 'bisaya';

const termsContent = {
  english: {
    title: 'Terms and Conditions',
    content: `
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using the B-READY Disaster Reporting System, you accept and agree to be bound by the terms and conditions of this agreement.</p>

      <h2>2. Use of Service</h2>
      <p>The B-READY system is designed to facilitate emergency reporting and response coordination. Users are expected to provide accurate information when reporting emergencies.</p>

      <h2>3. User Responsibilities</h2>
      <p>Users must:</p>
      <ul>
        <li>Provide accurate location and emergency details</li>
        <li>Use the system only for legitimate emergency reporting</li>
        <li>Respect the privacy of other users</li>
        <li>Not misuse the system for false reports</li>
      </ul>

      <h2>4. Privacy Policy</h2>
      <p>We collect personal information to provide emergency services and improve our system. Your data is protected and will not be shared with third parties without your consent.</p>

      <h2>5. Limitation of Liability</h2>
      <p>The B-READY system is provided "as is" and we cannot guarantee uninterrupted service. We are not liable for any damages arising from the use of this system.</p>
    `
  },
  filipino: {
    title: 'Mga Tuntunin at Kundisyon',
    content: `
      <h2>1. Pagtanggap ng mga Tuntunin</h2>
      <p>Sa pamamagitan ng pag-access at paggamit ng B-READY Disaster Reporting System, tinatanggap at sumasang-ayon ka na masunod ang mga tuntunin at kundisyon ng kasunduang ito.</p>

      <h2>2. Paggamit ng Serbisyo</h2>
      <p>Ang sistema ng B-READY ay idinisenyo upang mapadali ang pag-uulat ng emergency at koordinasyon ng tugon. Ang mga user ay inaasahang magbigay ng tumpak na impormasyon kapag nag-uulat ng mga emergency.</p>

      <h2>3. Mga Responsibilidad ng User</h2>
      <p>Ang mga user ay dapat:</p>
      <ul>
        <li>Magbigay ng tumpak na lokasyon at detalye ng emergency</li>
        <li>Gumamit ng sistema lamang para sa lehitimong pag-uulat ng emergency</li>
        <li>Respetuhin ang privacy ng ibang mga user</li>
        <li>Huwag gamitin ang sistema para sa mga pekeng ulat</li>
      </ul>

      <h2>4. Patakaran sa Privacy</h2>
      <p>Nangongolekta kami ng personal na impormasyon upang magbigay ng mga serbisyo sa emergency at pagbutihin ang aming sistema. Ang iyong data ay protektado at hindi ibabahagi sa mga third party nang walang iyong pahintulot.</p>

      <h2>5. Limitasyon ng Liability</h2>
      <p>Ang B-READY system ay ibinibigay "as is" at hindi kami makaka-garantiya ng walang putol na serbisyo. Kami ay hindi mananagot sa anumang mga damages na maaaring mangyari mula sa paggamit ng sistemang ito.</p>
    `
  },
  bisaya: {
    title: 'Mga Termino ug Kondisyon',
    content: `
      <h2>1. Pagdawat sa mga Termino</h2>
      <p>Pinaagi sa pag-access ug paggamit sa B-READY Disaster Reporting System, gidawat nimo ug miuyon ka nga mosunod sa mga termino ug kondisyon sa kasabutan.</p>

      <h2>2. Paggamit sa Serbisyo</h2>
      <p>Ang sistema sa B-READY gidesinyo aron mapadali ang pag-report sa emergency ug koordinasyon sa response. Ang mga user gipaabot nga maghatag ug tukma nga impormasyon sa dihang mag-report sa mga emergency.</p>

      <h2>3. Mga Responsibilidad sa User</h2>
      <p>Ang mga user kinahanglan:</p>
      <ul>
        <li>Maghatag ug tukma nga lokasyon ug detalye sa emergency</li>
        <li>Mogamit sa sistema lamang alang sa legal nga pag-report sa emergency</li>
        <li>Respetuhi ang privacy sa ubang mga user</li>
        <li>Dili gamiton ang sistema alang sa mga bakak nga report</li>
      </ul>

      <h2>4. Patakaran sa Privacy</h2>
      <p>Nangolekta kami ug personal nga impormasyon aron maghatag ug mga serbisyo sa emergency ug pagpauswag sa among sistema. Ang imong data giprotektahan ug dili ibahagi sa mga third party nga walay imong pagtugot.</p>

      <h2>5. Limitasyon sa Liability</h2>
      <p>Ang B-READY system gihatag "as is" ug dili kami makagarantiya ug walay hunong nga serbisyo. Kami dili responsable sa bisan unsang mga damages nga mahitabo gikan sa paggamit sa sistemang ito.</p>
    `
  }
};

export default function TermsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [accepted, setAccepted] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleAccept = () => {
    if (accepted) {
      // Mark terms as accepted (could save to user profile or localStorage)
      localStorage.setItem('terms_accepted', 'true');
      router.push('/dashboard');
    } else {
      notificationManager.warning('Please accept the terms and conditions to continue.');
    }
  };

  const handleDecline = () => {
    // Could log them out or redirect to login
    notificationManager.info('You must accept the terms to use B-READY.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📋</div>
            <h1 className="text-3xl font-bold mb-2">{termsContent[selectedLanguage].title}</h1>
            <p className="text-gray-600">Please read and accept our terms and conditions</p>
          </div>

          {/* Language Selector */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setSelectedLanguage('english')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                selectedLanguage === 'english'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('filipino')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                selectedLanguage === 'filipino'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Filipino
            </button>
            <button
              onClick={() => setSelectedLanguage('bisaya')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                selectedLanguage === 'bisaya'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bisaya
            </button>
          </div>

          {/* Terms Content */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: termsContent[selectedLanguage].content }}
            />
          </div>

          {/* Acceptance Checkbox */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="acceptTerms" className="text-sm font-medium text-gray-700">
              I have read and agree to the Terms and Conditions
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleAccept}
              disabled={!accepted}
              className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept & Continue
            </button>
            <button
              onClick={handleDecline}
              className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
