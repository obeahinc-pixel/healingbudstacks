import hbLogoWhite from "@/assets/hb-logo-white-new.png";
import { Link } from "react-router-dom";
import { Mail, MapPin, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation('common');
  
  return (
    <footer id="contact" className="text-white relative overflow-hidden" style={{ backgroundColor: 'hsl(var(--section-color))' }}>
      {/* Continuous line-art cannabis leaf decoration */}
      <div className="absolute bottom-0 left-0 right-0 opacity-[0.04] pointer-events-none overflow-hidden">
        <svg 
          viewBox="0 0 800 200" 
          fill="none" 
          className="w-full h-auto text-white"
          preserveAspectRatio="xMidYMax meet"
        >
          {/* Continuous single-line cannabis leaf with flowing line */}
          <path 
            d="M0 180 
               C80 180 120 175 180 170 
               Q200 168 220 160
               C230 140 235 120 250 100
               Q260 80 280 65
               C290 55 305 50 320 55
               Q340 62 355 80
               C360 90 358 105 350 115
               Q340 130 325 135
               C310 140 290 135 280 125
               Q270 115 275 100
               C280 85 295 75 310 80
               Q320 83 325 95
               C330 75 340 55 360 45
               Q380 35 400 40
               C420 45 435 60 440 80
               Q445 100 435 115
               C425 130 405 138 385 135
               Q365 132 355 115
               C345 100 350 80 365 75
               Q378 70 390 80
               C400 50 420 30 450 28
               Q480 26 500 40
               C520 55 530 80 525 105
               Q520 130 495 145
               C470 160 440 155 420 140
               Q400 125 405 100
               C410 75 435 65 455 75
               Q470 82 475 100
               C488 70 510 45 545 40
               Q580 35 605 55
               C630 75 640 105 630 135
               Q620 165 585 175
               C550 185 515 175 495 155
               Q475 135 485 105
               C495 80 525 70 550 85
               Q570 95 575 120
               C590 100 615 85 650 90
               Q685 95 705 120
               C720 140 718 165 700 175
               Q680 185 720 180
               C760 178 800 180 800 180"
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <div className="py-12 sm:py-16 border-b border-white/10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-16">
            
            {/* Brand Column */}
            <div className="lg:col-span-4">
              <Link to="/" className="inline-block mb-5 group">
                <img 
                  src={hbLogoWhite} 
                  alt="Healing Buds Logo" 
                  className="h-10 w-auto object-contain group-hover:opacity-80 transition-opacity"
                />
              </Link>
              <p className="font-body text-white/70 text-sm leading-relaxed mb-6">
                {t('footer.tagline')}
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-white/60 text-sm group">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <span className="font-body">
                    Avenida D. João II, 98 A<br />
                    1990-100 Lisboa, Portugal
                  </span>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm group">
                  <Mail className="w-4 h-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <a href="mailto:info@healingbuds.com" className="font-body hover:text-white transition-colors">
                    info@healingbuds.com
                  </a>
                </div>
              </div>
            </div>

            {/* Navigation Columns */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-10">
              
              {/* Company */}
              <div>
                <h4 className="font-jakarta font-semibold text-sm uppercase tracking-wider mb-5 text-white/90 flex items-center gap-2">
                  <Leaf className="w-3.5 h-3.5 text-primary" />
                  {t('footer.company')}
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/about-us" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.aboutUs')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/what-we-do" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.ourStandards')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/research" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.research')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/the-wire" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.theWire')}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-jakarta font-semibold text-sm uppercase tracking-wider mb-5 text-white/90 flex items-center gap-2">
                  <Leaf className="w-3.5 h-3.5 text-primary" />
                  {t('footer.resources')}
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/contact" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.patientAccess')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/conditions" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.conditionsTreated')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.franchiseOpportunities')}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-jakarta font-semibold text-sm uppercase tracking-wider mb-5 text-white/90 flex items-center gap-2">
                  <Leaf className="w-3.5 h-3.5 text-primary" />
                  {t('footer.legal')}
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/privacy-policy" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.privacyPolicy')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms-of-service" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.termsOfService')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="font-body text-sm text-white/60 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                      {t('footer.compliance')}
                    </Link>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-body text-white/50 text-xs">
              {t('footer.copyright', { year: currentYear })}
            </p>
            <p className="font-body text-white/40 text-xs">
              {t('footer.commitment')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
