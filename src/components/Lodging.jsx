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
            <div className="lodging-option">
              <h4>Dormitories</h4>
              <p>Bunk with 10-20 of your closest friends in air conditioning and full electricity! <strong>$50 per person per night</strong></p>
            </div>

            <div className="lodging-option">
              <h4>Cabins</h4>
              <p>Get the full parent trap experience in cabins with lights but no outlets and a short walk to the lodge for bathrooms. 10 cabins that sleep up to 12 people available. <strong>$50 per person per night</strong></p>
            </div>

            <div className="lodging-option">
              <h4>Platform Tents</h4>
              <p>Looking for a quieter more rustic experience – canvas platform tents are available. They are a bit away from the main lodge but have water running to them and an outhouse near them. <strong>$50 per person per night</strong></p>
            </div>

            <div className="lodging-option">
              <h4>Bring Your Own Tent</h4>
              <p>If you wish to bring your own tent and gear - spaces are available for <strong>$25 per person per night</strong> with bathrooms and showers available.</p>
            </div>

            <div className="lodging-option">
              <h4>What You'll Need</h4>
              <p>For all camping sleeping bags or bedding and pillows is required. Camp Newaygo has a limited number that can be rented.</p>
            </div>

            <div className="lodging-option">
              <h4>Ready to Stay Onsite?</h4>
              <p>To stay onsite please fill out this survey! Avery and Jared will coordinate with you the rest!</p>
            </div>

            <div className="lodging-option lodging-option-family">
              <h4>For Immediate Family</h4>
              <p>A small select number of hotel style rooms are available at Camp Newaygo for <strong>$150 per night</strong>. Avery and Jared will reach out to confirm these rooms with you.</p>
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
              <p>Call the hotel at <a href="tel:307-690-4960" className="lodging-link">307-690-4960</a> to reserve for our wedding weekend (2 nights minimum required). A shuttle will run a few times the day of the wedding to and from this location.</p>
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
              <h4>Airbnbs</h4>
              <p>Northern Michigan is full of amazing Airbnbs, many of which are very close to Camp Newaygo.</p>
              <a
                href="https://www.airbnb.com/s/Newaygo--MI/homes?refinement_paths%5B%5D=%2Fhomes&place_id=ChIJla02DXE9GYgR9ZLbaBf2sTM&location_bb=Qi25aMKrjdJCLZZqwqun4g%3D%3D&acp_id=5e879129-0987-418e-a200-bac1d55d0350&date_picker_type=calendar&checkin=2026-09-03&checkout=2026-09-06&adults=2&search_type=unknown"
                target="_blank"
                rel="noopener noreferrer"
                className="lodging-link"
              >
                Airbnb.com →
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
