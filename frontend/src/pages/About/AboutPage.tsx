import { useTranslation } from 'react-i18next';
import './About.css';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>{t('pages.about.title')}</h1>
        <p className="about-subtitle">{t('pages.about.subtitle')}</p>
      </div>

      <div className="about-container">
        <section className="about-section">
          <h2>{t('pages.about.mission')}</h2>
          <p>{t('pages.about.missionText')}</p>
        </section>

        <section className="about-section">
          <h2>{t('pages.about.values')}</h2>
          <div className="values-grid">
            <div className="value-item">
              <h3>{t('pages.about.value1Title')}</h3>
              <p>{t('pages.about.value1Text')}</p>
            </div>
            <div className="value-item">
              <h3>{t('pages.about.value2Title')}</h3>
              <p>{t('pages.about.value2Text')}</p>
            </div>
            <div className="value-item">
              <h3>{t('pages.about.value3Title')}</h3>
              <p>{t('pages.about.value3Text')}</p>
            </div>
            <div className="value-item">
              <h3>{t('pages.about.value4Title')}</h3>
              <p>{t('pages.about.value4Text')}</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>{t('pages.about.team')}</h2>
          <p>{t('pages.about.teamText')}</p>
        </section>

        <section className="about-section">
          <h2>{t('pages.about.whyChooseUs')}</h2>
          <ul className="features-list">
            <li>{t('pages.about.feature1')}</li>
            <li>{t('pages.about.feature2')}</li>
            <li>{t('pages.about.feature3')}</li>
            <li>{t('pages.about.feature4')}</li>
            <li>{t('pages.about.feature5')}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
