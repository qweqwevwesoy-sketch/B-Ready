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
      <h2>Barangay Report and Response Website</h2>
      <p>By accessing and using the <em>Barangay Report and Response Website</em>, you agree to comply with and be bound by the following Terms and Conditions. If you do not agree with any part of these terms, please do not use the website.</p>

      <h2>1. Purpose of the Website</h2>
      <p>The Barangay Report and Response Website is intended <em>solely</em> for:</p>
      <ul>
        <li>Submitting legitimate and truthful incident reports within the barangay</li>
        <li>Assisting barangay officials in responding to community concerns and emergencies</li>
        <li>Providing public information, including safety and disaster preparedness tips</li>
      </ul>
      <p>The website <em>must not be used</em> for:</p>
      <ul>
        <li>Submitting false, misleading, or fabricated reports</li>
        <li>Harassment, defamation, threats, or malicious acts</li>
        <li>Any illegal activity or misuse of the reporting system</li>
      </ul>

      <h2>2. User Responsibility</h2>
      <p>All information submitted through the website must be:</p>
      <ul>
        <li><em>Accurate, truthful, and submitted in good faith</em></li>
        <li>Free from malicious intent or intent to harm any individual or organization</li>
      </ul>
      <p>Users are <em>fully responsible</em> for the content of the reports they submit.</p>

      <h2>3. Legal Liability and Consequences</h2>
      <p>Any user who misuses the website or submits false or malicious reports may be:</p>
      <ul>
        <li><em>Reported to barangay authorities, local government units, or law enforcement agencies</em></li>
        <li><em>Held legally liable under applicable Philippine laws</em>, including but not limited to:</li>
        <ul>
          <li><em>Republic Act No. 10175 – Cybercrime Prevention Act of 2012</em></li>
          <li><em>Republic Act No. 10173 – Data Privacy Act of 2012</em></li>
          <li><em>The Revised Penal Code of the Philippines</em></li>
          <li>Other applicable national laws, local ordinances, and regulations</li>
        </ul>
      </ul>
      <p>The barangay and website administrators shall not be held liable for damages, losses, or legal issues arising from the improper use of the website by users.</p>

      <h2>4. Online-Only Access and Internet Limitation</h2>
      <p>This website:</p>
      <ul>
        <li>Operates <em>online only</em> and requires an active internet connection</li>
        <li>Reporting and response features will <em>not function without internet access</em></li>
      </ul>
      <p>In the absence of an internet connection, users may only be able to view <em>general safety and disaster preparedness information</em>, if accessible.</p>
      <p>The barangay shall not be responsible for issues related to internet availability or connectivity.</p>

      <h2>5. Data Privacy and Protection</h2>
      <p>All personal data collected through the website shall be:</p>
      <ul>
        <li>Used strictly for official barangay purposes</li>
        <li>Processed and protected in compliance with the <em>Data Privacy Act of 2012 (RA 10173)</em></li>
      </ul>

      <h2>6. Modification of Terms</h2>
      <p>The Barangay reserves the right to:</p>
      <ul>
        <li>Amend or update these Terms and Conditions at any time without prior notice</li>
      </ul>
      <p>Continued use of the website after changes are posted constitutes acceptance of the revised terms.</p>

      <h2>7. Acceptance of Terms</h2>
      <p>By using this website, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.</p>
    `
  },
  filipino: {
    title: 'Mga Tuntunin at Kundisyon',
    content: `
      <h2>Website ng Ulat at Tugon ng Barangay</h2>
      <p>Sa pamamagitan ng pag-access at paggamit ng <em>Website ng Ulat at Tugon ng Barangay</em>, sumasang-ayon ka na sumunod at masunod ang mga sumusunod na Tuntunin at Kundisyon. Kung hindi ka sumasang-ayon sa anumang bahagi ng mga tuntuning ito, mangyaring huwag gamitin ang website.</p>

      <h2>1. Layunin ng Website</h2>
      <p>Ang Website ng Ulat at Tugon ng Barangay ay inilaan <em>lamang</em> para sa:</p>
      <ul>
        <li>Pagsusumite ng lehitimong at tapat na ulat ng insidente sa loob ng barangay</li>
        <li>Pagtulong sa mga opisyal ng barangay na tumugon sa mga alalahanin at emerhensiya ng komunidad</li>
        <li>Pagbibigay ng pampublikong impormasyon, kabilang ang mga tip sa kaligtasan at paghahanda sa kalamidad</li>
      </ul>
      <p>Ang website <em>hindi dapat gamitin</em> para sa:</p>
      <ul>
        <li>Pagsusumite ng mga pekeng, maling, o gawa-gawang ulat</li>
        <li>Pang-aabuso, paglait, banta, o masasamang gawain</li>
        <li>Anumang ilegal na aktibidad o maling paggamit ng sistema ng pag-uulat</li>
      </ul>

      <h2>2. Responsibilidad ng User</h2>
      <p>Lahat ng impormasyon na isinumite sa pamamagitan ng website ay dapat:</p>
      <ul>
        <li><em>Tumpak, tapat, at isinumite sa mabuting loob</em></li>
        <li>Walang masamang intensyon o intensyong makapinsala sa anumang indibidwal o organisasyon</li>
      </ul>
      <p>Ang mga user ay <em>ganap na responsable</em> para sa nilalaman ng mga ulat na kanilang isinumite.</p>

      <h2>3. Legal na Pananagutan at Mga Konsekuwensya</h2>
      <p>Anumang user na nang-aabuso sa website o nagsusumite ng mga pekeng o masamang ulat ay maaaring:</p>
      <ul>
        <li><em>Maulat sa mga awtoridad ng barangay, lokal na yunit ng gobyerno, o mga ahensya ng pagpapatupad ng batas</em></li>
        <li><em>Managot sa ilalim ng mga naaangkop na batas ng Pilipinas</em>, kabilang ngunit hindi limitado sa:</li>
        <ul>
          <li><em>Republic Act No. 10175 – Cybercrime Prevention Act of 2012</em></li>
          <li><em>Republic Act No. 10173 – Data Privacy Act of 2012</em></li>
          <li><em>Ang Revised Penal Code ng Pilipinas</em></li>
          <li>Iba pang naaangkop na mga batas ng bansa, lokal na ordinansa, at regulasyon</li>
        </ul>
      </ul>
      <p>Ang barangay at mga administrador ng website ay hindi mananagot sa mga pinsala, pagkawala, o mga legal na isyu na maaaring mangyari mula sa maling paggamit ng website ng mga user.</p>

      <h2>4. Online-Lang na Access at Limitasyon ng Internet</h2>
      <p>Ang website na ito:</p>
      <ul>
        <li>Gumagana <em>online lamang</em> at nangangailangan ng aktibong koneksyon sa internet</li>
        <li>Ang mga feature ng pag-uulat at tugon ay <em>hindi gagana nang walang access sa internet</em></li>
      </ul>
      <p>Sa kawalan ng koneksyon sa internet, ang mga user ay maaaring lamang makakita ng <em>general na impormasyon sa kaligtasan at paghahanda sa kalamidad</em>, kung maa-access.</p>
      <p>Ang barangay ay hindi mananagot sa mga isyu na may kinalaman sa availability o koneksyon ng internet.</p>

      <h2>5. Data Privacy at Proteksyon</h2>
      <p>Lahat ng personal na data na kinokolekta sa pamamagitan ng website ay:</p>
      <ul>
        <li>Gagamitin lamang para sa opisyal na mga layunin ng barangay</li>
        <li>Poproseso at poprotektahan alinsunod sa <em>Data Privacy Act of 2012 (RA 10173)</em></li>
      </ul>

      <h2>6. Pagbabago ng mga Tuntunin</h2>
      <p>Ang Barangay ay may karapatan na:</p>
      <ul>
        <li>Baguhin o i-update ang mga Tuntunin at Kundisyon sa anumang oras nang walang paunang abiso</li>
      </ul>
      <p>Ang patuloy na paggamit ng website pagkatapos ipaskil ang mga pagbabago ay nagbubunga ng pagtanggap sa mga binagong tuntunin.</p>

      <h2>7. Pagtanggap ng mga Tuntunin</h2>
      <p>Sa pamamagitan ng paggamit ng website na ito, kinikilala mo na nabasa, naunawaan, at sumang-ayon ka sa mga Tuntunin at Kundisyon.</p>
    `
  },
  bisaya: {
    title: 'Mga Termino ug Kondisyon',
    content: `
      <h2>Website sa Ulat ug Tugon sa Barangay</h2>
      <p>Pinaagi sa pag-access ug paggamit sa <em>Website sa Ulat ug Tugon sa Barangay</em>, miuyon ka nga mosunod ug masunod sa mga mosunod nga Termino ug Kondisyon. Kon dili ka mouyon sa bisan unsang bahin sa mga termino, palihog ayaw gamita ang website.</p>

      <h2>1. Katuyoan sa Website</h2>
      <p>Ang Website sa Ulat ug Tugon sa Barangay gilalaan <em>lamang</em> alang sa:</p>
      <ul>
        <li>Pagsumiter sa legal ug tinuod nga mga ulat sa insidente sa sulod sa barangay</li>
        <li>Tabang sa mga opisyal sa barangay sa pagtubag sa mga kabalaka ug emerhensya sa komunidad</li>
        <li>Paghatag ug publikong impormasyon, lakip ang mga tip sa kaluwasan ug pagpangandam sa katalagman</li>
      </ul>
      <p>Ang website <em>dili dapat gamiton</em> alang sa:</p>
      <ul>
        <li>Pagsumiter sa mga bakak, maling, o gawa-gawang ulat</li>
        <li>Abuso, libelo, hulga, o daotang mga buhat</li>
        <li>Bisan unsang ilegal nga kalihokan o sayop nga paggamit sa sistema sa pag-ulat</li>
      </ul>

      <h2>2. Responsibilidad sa User</h2>
      <p>Tanang impormasyon nga gisumiter pinaagi sa website kinahanglan:</p>
      <ul>
        <li><em>Tukma, tinuod, ug gisumiter sa maayong tuyo</em></li>
        <li>Walay daotang intensyon o intensyon nga makadaot sa bisan unsang indibidwal o organisasyon</li>
      </ul>
      <p>Ang mga user <em>bug-os nga responsable</em> alang sa sulod sa mga ulat nga ilang gisumiter.</p>

      <h2>3. Legal nga Pananagutan ug Mga Konsekuwensya</h2>
      <p>Bisan unsang user nga nag-abuso sa website o nagsumiter sa mga bakak o daotang ulat mahimong:</p>
      <ul>
        <li><em>Ma-report sa mga awtoridad sa barangay, lokal nga yunit sa gobyerno, o mga ahensya sa pagpatuman sa balaod</em></li>
        <li><em>Managot sa ilalom sa mga angay nga balaod sa Pilipinas</em>, lakip apan dili limitado sa:</li>
        <ul>
          <li><em>Republic Act No. 10175 – Cybercrime Prevention Act of 2012</em></li>
          <li><em>Republic Act No. 10173 – Data Privacy Act of 2012</em></li>
          <li><em>Ang Revised Penal Code sa Pilipinas</em></li>
          <li>Uban pang angay nga mga balaod sa nasud, lokal nga ordinansa, ug regulasyon</li>
        </ul>
      </ul>
      <p>Ang barangay ug mga administrador sa website dili managot sa mga kadaot, pagkawala, o mga legal nga isyo nga mahitabo gikan sa sayop nga paggamit sa website sa mga user.</p>

      <h2>4. Online-Lang nga Access ug Limitasyon sa Internet</h2>
      <p>Kini nga website:</p>
      <ul>
        <li>Mogana <em>online lamang</em> ug nanginahanglan ug aktibo nga koneksyon sa internet</li>
        <li>Ang mga feature sa pag-ulat ug tugon <em>dili mogana nga walay access sa internet</em></li>
      </ul>
      <p>Sa wala nay koneksyon sa internet, ang mga user mahimong makakita lamang sa <em>general nga impormasyon sa kaluwasan ug pagpangandam sa katalagman</em>, kon ma-access.</p>
      <p>Ang barangay dili managot sa mga isyo nga may labot sa availability o koneksyon sa internet.</p>

      <h2>5. Data Privacy ug Proteksyon</h2>
      <p>Tanang personal nga data nga nakolekta pinaagi sa website:</p>
      <ul>
        <li>Gamiton lamang alang sa opisyal nga mga katuyoan sa barangay</li>
        <li>Maproseso ug maprotektahan sumala sa <em>Data Privacy Act of 2012 (RA 10173)</em></li>
      </ul>

      <h2>6. Pag-usab sa mga Termino</h2>
      <p>Ang Barangay adunay katungod nga:</p>
      <ul>
        <li>Usbon o i-update ang mga Termino ug Kondisyon sa bisan unsang oras nga walay paunang pahibalo</li>
      </ul>
      <p>Ang padayon nga paggamit sa website human mapaskil ang mga pag-usab nagpasabot sa pagdawat sa mga giusab nga termino.</p>

      <h2>7. Pagdawat sa mga Termino</h2>
      <p>Pinaagi sa paggamit niining website, giila nimo nga nabasa, nasabtan, ug miuyon ka sa mga Termino ug Kondisyon.</p>
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
    <div className="min-h-screen" style={{
      backgroundImage: 'url("/Blurred blue blended background.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
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
