import { useTranslation } from 'react-i18next';
import './PrivacyPolicy.css';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="privacy-page">
      <div className="privacy-hero">
        <h1>{t('pages.privacy.title')}</h1>
      </div>

      <div className="privacy-container">
        <section className="privacy-section">
          <h2>{t('pages.privacy.intro')}</h2>
          <p>{t('pages.privacy.introText')}</p>
        </section>

        <section className="privacy-section">
          <h2>{t('pages.privacy.section1Title')}</h2>
          <p>{t('pages.privacy.section1Text')}</p>
        </section>

        <section className="privacy-section">
          <h2>{t('pages.privacy.section2Title')}</h2>
          <p>{t('pages.privacy.section2Text')}</p>
          <ul>
            <li>{t('pages.privacy.section2Item1')}</li>
            <li>{t('pages.privacy.section2Item2')}</li>
            <li>{t('pages.privacy.section2Item3')}</li>
            <li>{t('pages.privacy.section2Item4')}</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>{t('pages.privacy.section3Title')}</h2>
          <p>{t('pages.privacy.section3Text')}</p>
        </section>

        <section className="privacy-section">
          <h2>{t('pages.privacy.section4Title')}</h2>
          <p>{t('pages.privacy.section4Text')}</p>
        </section>

        <section className="privacy-section">
          <h2>{t('pages.privacy.section5Title')}</h2>
          <p>{t('pages.privacy.section5Text')}</p>
        </section>

        <section className="privacy-section">
          <h2>{t('pages.privacy.section6Title')}</h2>
          <p>{t('pages.privacy.section6Text')}</p>
        </section>

        <section className="privacy-section">
          <h2>{t('pages.privacy.section7Title')}</h2>
          <p>{t('pages.privacy.section7Text')}</p>
          <p>{t('pages.privacy.lastUpdated')}</p>
        </section>
      </div>
    </div>
  );
}
