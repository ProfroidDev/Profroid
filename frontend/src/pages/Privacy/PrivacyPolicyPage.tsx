import { useTranslation } from 'react-i18next';
import './PrivacyPolicy.css';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="privacy-page">
      <div className="privacy-hero">
        <div className="privacy-hero-content">
          <h1>{t('pages.privacy.title')}</h1>
          <p className="privacy-hero-subtitle">{t('pages.privacy.subtitle')}</p>
        </div>
      </div>

      <div className="privacy-container">
        <div className="privacy-toc">
          <h3>{t('pages.privacy.tableOfContents')}</h3>
          <ul>
            <li><a href="#intro">Introduction</a></li>
            <li><a href="#data-collection">{t('pages.privacy.section1Title')}</a></li>
            <li><a href="#types-data">{t('pages.privacy.section2Title')}</a></li>
            <li><a href="#data-usage">{t('pages.privacy.section3Title')}</a></li>
            <li><a href="#data-storage">{t('pages.privacy.section4Title')}</a></li>
            <li><a href="#user-rights">{t('pages.privacy.section5Title')}</a></li>
            <li><a href="#changes">{t('pages.privacy.section6Title')}</a></li>
            <li><a href="#contact">{t('pages.privacy.section7Title')}</a></li>
          </ul>
        </div>

        <section id="intro" className="privacy-section">
          <h2>{t('pages.privacy.intro')}</h2>
          <p>{t('pages.privacy.introText')}</p>
          <div className="privacy-highlight">
            <p>{t('pages.privacy.introHighlight')}</p>
          </div>
        </section>

        <section id="data-collection" className="privacy-section">
          <h2>{t('pages.privacy.section1Title')}</h2>
          <p>{t('pages.privacy.section1Text')}</p>
          <div className="privacy-info-box">
            <h4>{t('pages.privacy.whyWeCollect')}</h4>
            <p>{t('pages.privacy.whyWeCollectText')}</p>
          </div>
        </section>

        <section id="types-data" className="privacy-section">
          <h2>{t('pages.privacy.section2Title')}</h2>
          <p>{t('pages.privacy.section2Text')}</p>
          
          <div className="privacy-data-categories">
            <div className="data-category">
              <h4>{t('pages.privacy.category1Title')}</h4>
              <ul>
                <li>{t('pages.privacy.section2Item1')}</li>
                <li>{t('pages.privacy.section2Item2')}</li>
                <li>{t('pages.privacy.section2Item3')}</li>
              </ul>
              <p className="category-explanation">{t('pages.privacy.category1Explanation')}</p>
            </div>

            <div className="data-category">
              <h4>{t('pages.privacy.category2Title')}</h4>
              <ul>
                <li>{t('pages.privacy.section2Item4')}</li>
                <li>{t('pages.privacy.category2Item2')}</li>
                <li>{t('pages.privacy.category2Item3')}</li>
              </ul>
              <p className="category-explanation">{t('pages.privacy.category2Explanation')}</p>
            </div>

            <div className="data-category">
              <h4>{t('pages.privacy.category3Title')}</h4>
              <ul>
                <li>{t('pages.privacy.category3Item1')}</li>
                <li>{t('pages.privacy.category3Item2')}</li>
                <li>{t('pages.privacy.category3Item3')}</li>
              </ul>
              <p className="category-explanation">{t('pages.privacy.category3Explanation')}</p>
            </div>
          </div>
        </section>

        <section id="data-usage" className="privacy-section">
          <h2>{t('pages.privacy.section3Title')}</h2>
          <p>{t('pages.privacy.section3Text')}</p>
          
          <div className="privacy-usage-list">
            <div className="usage-item">
              <h4>{t('pages.privacy.usage1Title')}</h4>
              <p>{t('pages.privacy.usage1Text')}</p>
            </div>
            <div className="usage-item">
              <h4>{t('pages.privacy.usage2Title')}</h4>
              <p>{t('pages.privacy.usage2Text')}</p>
            </div>
            <div className="usage-item">
              <h4>{t('pages.privacy.usage3Title')}</h4>
              <p>{t('pages.privacy.usage3Text')}</p>
            </div>
            <div className="usage-item">
              <h4>{t('pages.privacy.usage4Title')}</h4>
              <p>{t('pages.privacy.usage4Text')}</p>
            </div>
            <div className="usage-item">
              <h4>{t('pages.privacy.usage5Title')}</h4>
              <p>{t('pages.privacy.usage5Text')}</p>
            </div>
          </div>
        </section>

        <section id="data-storage" className="privacy-section">
          <h2>{t('pages.privacy.section4Title')}</h2>
          <p>{t('pages.privacy.section4Text')}</p>
          
          <div className="privacy-info-box">
            <h4>{t('pages.privacy.securityMeasures')}</h4>
            <ul>
              <li>{t('pages.privacy.securityMeasure1')}</li>
              <li>{t('pages.privacy.securityMeasure2')}</li>
              <li>{t('pages.privacy.securityMeasure3')}</li>
              <li>{t('pages.privacy.securityMeasure4')}</li>
            </ul>
          </div>

          <div className="privacy-warning-box">
            <p>{t('pages.privacy.securityWarning')}</p>
          </div>
        </section>

        <section id="user-rights" className="privacy-section">
          <h2>{t('pages.privacy.section5Title')}</h2>
          <p>{t('pages.privacy.section5Text')}</p>
          
          <div className="privacy-rights-list">
            <div className="right-item">
              <h4>{t('pages.privacy.right1Title')}</h4>
              <p>{t('pages.privacy.right1Text')}</p>
            </div>
            <div className="right-item">
              <h4>{t('pages.privacy.right2Title')}</h4>
              <p>{t('pages.privacy.right2Text')}</p>
            </div>
            <div className="right-item">
              <h4>{t('pages.privacy.right3Title')}</h4>
              <p>{t('pages.privacy.right3Text')}</p>
            </div>
            <div className="right-item">
              <h4>{t('pages.privacy.right4Title')}</h4>
              <p>{t('pages.privacy.right4Text')}</p>
            </div>
            <div className="right-item">
              <h4>{t('pages.privacy.right5Title')}</h4>
              <p>{t('pages.privacy.right5Text')}</p>
            </div>
          </div>
        </section>

        <section id="changes" className="privacy-section">
          <h2>{t('pages.privacy.section6Title')}</h2>
          <p>{t('pages.privacy.section6Text')}</p>
          <p>{t('pages.privacy.section6TextAdditional')}</p>
        </section>

        <section id="contact" className="privacy-section">
          <h2>{t('pages.privacy.section7Title')}</h2>
          <p>{t('pages.privacy.section7Text')}</p>
          
          <div className="privacy-contact-box">
            <div className="contact-method">
              <h4>{t('pages.privacy.contactEmail')}</h4>
              <a href="mailto:profroid@hotmail.com">{t('pages.privacy.contactEmailValue')}</a>
            </div>
            <div className="contact-method">
              <h4>{t('pages.privacy.contactPhone')}</h4>
              <a href="tel:+15145853298">{t('pages.privacy.contactPhoneValue')}</a>
            </div>
            <div className="contact-method">
              <h4>{t('pages.privacy.contactMail')}</h4>
              <p>
                Profroid Inc.<br />
                {t('pages.privacy.contactAddress')}
              </p>
            </div>
          </div>
        </section>

        <section className="privacy-section">
          <h2>{t('pages.privacy.governingLaw')}</h2>
          <p>{t('pages.privacy.governingLawText')}</p>
        </section>

        <div className="privacy-footer">
          <p>{t('pages.privacy.lastUpdated')}</p>
        </div>
      </div>
    </div>
  );
}
