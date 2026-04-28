import { Lantern } from './decorations';

export default function Lodging() {
  return (
    <section id="lodging" className="lodging">
      <Lantern className="lodging-lantern lodging-lantern-left" />
      <Lantern className="lodging-lantern lodging-lantern-right" />

      <div className="section-header">
        <h2>Lodging Information</h2>
        <p className="section-subtitle">The bride and groom will be staying at Camp Newaygo and welcome you to join us. We realize camping isn't everyone's style - details on offsite accommodations below.</p>
      </div>

      <div className="lodging-container">
        <div className="lodging-section">
          <h3>Lodging at Camp Newaygo</h3>
          <p className="lodging-intro">We're so excited to spend the weekend together at Camp Newaygo! Lodging at camp is rustic, fun, and all about the experience.</p>

          <div className="lodging-options">
            <div className="lodging-option lodging-option-with-photo">
              <div className="lodging-option-photo">
                <img src="/photos/lodging-bunkhouse.jpeg" alt="Dormitory with bunk beds" />
              </div>
              <div className="lodging-option-content">
                <h4>Dormitories</h4>
                <p>Bunk with 10-20 of your closest friends in air conditioning and full electricity! <strong>$50 per person per night</strong></p>
              </div>
            </div>

            <div className="lodging-option lodging-option-with-photo">
              <div className="lodging-option-photo">
                <img src="/photos/lodging-cabin.jpeg" alt="Camp cabin interior" />
              </div>
              <div className="lodging-option-content">
                <h4>Cabins</h4>
                <p>Get the full parent trap experience in cabins with lights but no outlets and a short walk to the lodge for bathrooms. 10 cabins that sleep up to 12 people available. <strong>$50 per person per night</strong></p>
              </div>
            </div>

            <div className="lodging-option lodging-option-with-photo">
              <div className="lodging-option-photo">
                <img src="/photos/lodging-tents.jpeg" alt="Platform tents in the woods" />
              </div>
              <div className="lodging-option-content">
                <h4>Platform Tents</h4>
                <p>Looking for a quieter more rustic experience – canvas platform tents are available. They are a bit away from the main lodge but have water running to them and an outhouse near them. <strong>$50 per person per night</strong></p>
              </div>
            </div>

            <div className="lodging-option lodging-option-with-icon">
              <div className="lodging-option-icon">
                <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M32 8 L56 48 H8 L32 8Z" />
                  <line x1="32" y1="8" x2="32" y2="48" />
                  <line x1="20" y1="48" x2="44" y2="48" />
                  <path d="M26 48 V38 H38 V48" />
                  <circle cx="48" cy="16" r="6" fill="currentColor" strokeWidth="0" />
                  <line x1="48" y1="6" x2="48" y2="4" />
                  <line x1="48" y1="28" x2="48" y2="26" />
                  <line x1="38" y1="16" x2="36" y2="16" />
                  <line x1="60" y1="16" x2="58" y2="16" />
                  <line x1="41" y1="9" x2="39.5" y2="7.5" />
                  <line x1="56.5" y1="22.5" x2="55" y2="24" />
                  <line x1="41" y1="23" x2="39.5" y2="24.5" />
                  <line x1="56.5" y1="9.5" x2="55" y2="8" />
                </svg>
              </div>
              <div className="lodging-option-content">
                <h4>Bring Your Own Tent</h4>
                <p>If you wish to bring your own tent and gear - spaces are available for <strong>$25 per person per night</strong> with bathrooms and showers available.</p>
              </div>
            </div>

            <div className="lodging-option">
              <h4>Ready to Stay Onsite?</h4>
              <p>To stay onsite please fill out our lodging survey! Avery and Jared will coordinate with you the rest!</p>
              <a
                href="https://forms.gle/dcQfpGu1Mbt4ZNiDA"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary lodging-survey-btn"
              >
                Fill Out Lodging Survey
              </a>
            </div>

            <div className="lodging-option lodging-option-family">
              <h4>For Immediate Family</h4>
              <p>A small select number of hotel style rooms are available at Camp Newaygo. Avery and Jared will reach out to confirm these rooms with you.</p>
            </div>
          </div>
        </div>

        <div className="lodging-section">
          <h3>Recommended Offsite Accommodations</h3>

          <div className="lodging-offsite">
            <div className="offsite-option">
              <h4>Muskegon River Inn</h4>
              <p className="offsite-distance">Only 7 minutes from camp</p>
              <p>Muskegon River Inn is a small inn with amazing showers and perfectly situated in downtown Newaygo. Standard rooms available for <strong>$145</strong> and suites for <strong>$155</strong>.</p>
              <p><strong>Avery & Jared have all 7 rooms blocked for the wedding.</strong> Call the hotel directly at <a href="tel:307-690-4960" className="lodging-link">307-690-4960</a> to make a reservation (2 nights minimum required). A shuttle will run a few times the day of the wedding to and from this location.</p>
              <a
                href="https://muskegonriverinn.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="lodging-link"
              >
                Visit Muskegon River Inn Website →
              </a>
            </div>

            <div className="offsite-option">
              <h4>Newaygo Bed & Breakfast</h4>
              <p className="offsite-distance">Only 5 minutes from camp</p>
              <p>Historic charm in an 1860s mansion with uniquely decorated rooms. Individual nightly rates range from <strong>$125 to $175</strong> with home-cooked breakfasts and modern amenities near the Muskegon River. The entire mansion can be reserved for <strong>$900 per night</strong> for larger group stays.</p>
              <p>Call <a href="tel:231-652-1093" className="lodging-link">(231) 652-1093</a> to reserve.</p>
              <a
                href="https://www.newaygobb.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="lodging-link"
              >
                Visit Newaygo Bed & Breakfast Website →
              </a>
            </div>

            <div className="offsite-option">
              <h4>Airbnbs &amp; VRBOs</h4>
              <p>Northern Michigan is full of amazing vacation rentals, many of which are very close to Camp Newaygo.</p>
              <a
                href="https://www.airbnb.com/s/Newaygo--MI/homes?refinement_paths%5B%5D=%2Fhomes&place_id=ChIJla02DXE9GYgR9ZLbaBf2sTM&location_bb=Qi25aMKrjdJCLZZqwqun4g%3D%3D&acp_id=5e879129-0987-418e-a200-bac1d55d0350&date_picker_type=calendar&checkin=2026-09-03&checkout=2026-09-06&adults=2&search_type=unknown"
                target="_blank"
                rel="noopener noreferrer"
                className="lodging-link"
              >
                Airbnb.com →
              </a>
              <a
                href="https://www.vrbo.com/search?destination=Newaygo%2C+Michigan%2C+United+States+of+America&regionId=6052820&startDate=2026-09-03&endDate=2026-09-06&adults=2&sort=RECOMMENDED"
                target="_blank"
                rel="noopener noreferrer"
                className="lodging-link"
              >
                VRBO.com →
              </a>
            </div>
          </div>
        </div>

        <div className="lodging-section camp-overview">
          <h3>Camp Newaygo Overview</h3>
          <p>Over 100 acres, located on a chain of inland lakes, Camp Newaygo's facilities are incredible. With over one mile of sunset view waterfront, a private island to paddle to, and a two-mile loop accessible nature boardwalk – our natural resources are complemented by our indoor spaces.</p>
          <a
            href="https://campnewaygo.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="lodging-link camp-link"
          >
            Visit Camp Newaygo Website →
          </a>
        </div>
      </div>
    </section>
  );
}
