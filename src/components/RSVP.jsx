import { useState } from 'react';
import { Lantern, CampBadge } from './decorations';

export default function RSVP() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    attending: '',
    attendingDays: {
      saturday: false,
      sunday: false,
      monday: false
    },
    hasPlusOne: '',
    plusOneName: '',
    meal: '',
    allergies: '',
    dietaryDetails: '',
    song: '',
    specialNeeds: ''
  });
  const [status, setStatus] = useState('idle');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('day_')) {
      const day = name.replace('day_', '');
      setFormData(prev => ({
        ...prev,
        attendingDays: {
          ...prev.attendingDays,
          [day]: checked
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          attendingDays: Object.entries(formData.attendingDays)
            .filter(([_, v]) => v)
            .map(([k]) => k)
            .join(', ')
        })
      });

      if (response.ok) {
        setStatus('success');
        setFormData({
          name: '',
          email: '',
          attending: '',
          attendingDays: { saturday: false, sunday: false, monday: false },
          hasPlusOne: '',
          plusOneName: '',
          meal: '',
          allergies: '',
          dietaryDetails: '',
          song: '',
          specialNeeds: ''
        });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section id="rsvp" className="rsvp">
        <div className="rsvp-success">
          <CampBadge className="success-badge">
            <span className="success-check">✓</span>
          </CampBadge>
          <h2>You're On The Roster!</h2>
          <p>Thanks for registering for Camp Javery. We can't wait to celebrate with you at Camp Newayo!</p>
          <button onClick={() => setStatus('idle')} className="btn-secondary">
            Submit Another Response
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="rsvp" className="rsvp">
      <Lantern className="rsvp-lantern rsvp-lantern-left" />
      <Lantern className="rsvp-lantern rsvp-lantern-right" />

      <div className="section-header">
        <h2>Camp Registration</h2>
        <p className="section-subtitle">Sign up for the best Labor Day Weekend ever!</p>
      </div>

      <form onSubmit={handleSubmit} className="rsvp-form">
        <div className="form-header">
          <span>Camper Information</span>
        </div>

        {/* Important Notice Box */}
        <div className="important-notice">
          <h4>⚠️ Important Guest Policy</h4>
          <ul>
            <li><strong>Plus-Ones:</strong> You may NOT bring a +1 unless it has been explicitly stated on your invitation. If your invitation does not include a +1, please do not assume you can bring one.</li>
            <li><strong>Children:</strong> Only children who are specifically named on the invitation are invited. If we haven't mentioned your children by name, we kindly ask that you arrange childcare for the weekend.</li>
            <li><strong>Uninvited Guests:</strong> If you bring someone who is not invited, both you and your uninvited guest will need to leave. We have limited capacity and have carefully planned for our invited guests only.</li>
          </ul>
        </div>

        <div className="form-group">
          <label htmlFor="name">Your Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your name as it appears on your invitation"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label>Will you be joining us at Camp Javery? *</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="attending"
                value="yes"
                checked={formData.attending === 'yes'}
                onChange={handleChange}
                required
              />
              <span className="radio-custom"></span>
              Count me in! I'll be there!
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="attending"
                value="no"
                checked={formData.attending === 'no'}
                onChange={handleChange}
              />
              <span className="radio-custom"></span>
              Sorry, I can't make it
            </label>
          </div>
        </div>

        {formData.attending === 'yes' && (
          <>
            {/* Days Attending */}
            <div className="form-group">
              <label>Which days will you be attending? *</label>
              <p style={{ fontSize: '0.9rem', color: '#5C4033', marginBottom: '0.5rem' }}>
                Check all days you plan to attend (Labor Day Weekend: Aug 29 - Sep 1, 2026)
              </p>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="day_saturday"
                    checked={formData.attendingDays.saturday}
                    onChange={handleChange}
                  />
                  <span>
                    <strong>Saturday, August 29</strong> - Welcome BBQ & Bonfire
                  </span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="day_sunday"
                    checked={formData.attendingDays.sunday}
                    onChange={handleChange}
                  />
                  <span>
                    <strong>Sunday, August 30</strong> - Wedding Ceremony & Reception
                  </span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="day_monday"
                    checked={formData.attendingDays.monday}
                    onChange={handleChange}
                  />
                  <span>
                    <strong>Monday, September 1 (Labor Day)</strong> - Farewell Brunch
                  </span>
                </label>
              </div>
            </div>

            {/* Plus One Section */}
            <div className="form-group">
              <label>Were you given a +1 on your invitation? *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="hasPlusOne"
                    value="yes"
                    checked={formData.hasPlusOne === 'yes'}
                    onChange={handleChange}
                  />
                  <span className="radio-custom"></span>
                  Yes, my invitation includes a +1
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="hasPlusOne"
                    value="no"
                    checked={formData.hasPlusOne === 'no'}
                    onChange={handleChange}
                  />
                  <span className="radio-custom"></span>
                  No, I was not given a +1
                </label>
              </div>
            </div>

            {formData.hasPlusOne === 'yes' && (
              <div className="form-group">
                <label htmlFor="plusOneName">Name of Your +1</label>
                <input
                  type="text"
                  id="plusOneName"
                  name="plusOneName"
                  value={formData.plusOneName}
                  onChange={handleChange}
                  placeholder="Enter your plus one's full name"
                />
              </div>
            )}

            {/* Meal Selection */}
            <div className="form-group">
              <label htmlFor="meal">Mess Hall Preference *</label>
              <select
                id="meal"
                name="meal"
                value={formData.meal}
                onChange={handleChange}
                required
              >
                <option value="">Select a meal option</option>
                <option value="beef">Campfire Beef</option>
                <option value="chicken">Herb Roasted Chicken</option>
                <option value="fish">Cedar Plank Salmon</option>
                <option value="vegetarian">Garden Harvest (Vegetarian)</option>
                <option value="vegan">Trail Blazer (Vegan)</option>
              </select>
            </div>

            {/* Health & Allergies Section */}
            <div className="form-group">
              <label>Do you have any food allergies or health conditions we should know about? *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="allergies"
                    value="none"
                    checked={formData.allergies === 'none'}
                    onChange={handleChange}
                  />
                  <span className="radio-custom"></span>
                  No allergies or health concerns
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="allergies"
                    value="yes"
                    checked={formData.allergies === 'yes'}
                    onChange={handleChange}
                  />
                  <span className="radio-custom"></span>
                  Yes, I have allergies/health conditions to report
                </label>
              </div>
            </div>

            {formData.allergies === 'yes' && (
              <div className="form-group">
                <label htmlFor="dietaryDetails">Please describe your allergies or health conditions *</label>
                <textarea
                  id="dietaryDetails"
                  name="dietaryDetails"
                  value={formData.dietaryDetails}
                  onChange={handleChange}
                  required={formData.allergies === 'yes'}
                  placeholder="Please list any food allergies (nuts, shellfish, dairy, gluten, etc.) or medical conditions (diabetes, severe allergies requiring EpiPen, etc.) that our team should be aware of."
                  rows="4"
                />
              </div>
            )}

            {/* Special Accommodations */}
            <div className="form-group">
              <label htmlFor="specialNeeds">Any special accommodations needed?</label>
              <textarea
                id="specialNeeds"
                name="specialNeeds"
                value={formData.specialNeeds}
                onChange={handleChange}
                placeholder="Mobility needs, accessibility requirements, or any other accommodations we can help with"
                rows="3"
              />
            </div>

            {/* Song Request */}
            <div className="form-group">
              <label htmlFor="song">Campfire Song Request</label>
              <input
                type="text"
                id="song"
                name="song"
                value={formData.song}
                onChange={handleChange}
                placeholder="What song will get you dancing around the campfire?"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Sending...' : 'Submit Registration'}
        </button>

        {status === 'error' && (
          <p className="form-error">
            Oops! Something went wrong. Please try again or email us directly.
          </p>
        )}

        <p className="form-note">
          Please RSVP by July 15th, 2026
        </p>
      </form>
    </section>
  );
}
