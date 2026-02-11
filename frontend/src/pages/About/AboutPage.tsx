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
        {/* Experience Highlight Section */}
        <section className="about-section experience-highlight">
          <div className="experience-badge">
            <div className="experience-number">20+</div>
            <div className="experience-text">{t('pages.about.yearsOfExperience')}</div>
          </div>
          <div className="experience-content">
            <h2>{t('pages.about.ourStory')}</h2>
            <p>{t('pages.about.experienceText')}</p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{t('pages.about.stat1Number')}</div>
            <div className="stat-label">{t('pages.about.stat1Label')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{t('pages.about.stat2Number')}</div>
            <div className="stat-label">{t('pages.about.stat2Label')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{t('pages.about.stat3Number')}</div>
            <div className="stat-label">{t('pages.about.stat3Label')}</div>
          </div>
        </section>

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

        <section className="about-section team-section">
          <h2>{t('pages.about.team')}</h2>
          <p>{t('pages.about.teamText')}</p>
          <div className="team-highlights">
            <div className="team-highlight-item">
              <span>{t('pages.about.teamHighlight1')}</span>
            </div>
            <div className="team-highlight-item">
              <span>{t('pages.about.teamHighlight2')}</span>
            </div>
            <div className="team-highlight-item">
              <span>{t('pages.about.teamHighlight3')}</span>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>{t('pages.about.whyChooseUs')}</h2>
          <ul className="features-list">
            <li>{t('pages.about.feature1')}</li>
            <li>{t('pages.about.feature2')}</li>
            <li>{t('pages.about.feature3')}</li>
            <li>{t('pages.about.feature4')}</li>
            <li>{t('pages.about.feature5')}</li>
            <li>{t('pages.about.feature6')}</li>
          </ul>
        </section>

        {/* Call to Action Section */}
        <section className="cta-section">
          <h2>{t('pages.about.ctaTitle')}</h2>
          <p>{t('pages.about.ctaText')}</p>
          <button className="cta-button" onClick={() => (window.location.href = '/contact')}>
            {t('pages.about.ctaButton')}
          </button>
        </section>
      </div>
    </div>
  );
}
