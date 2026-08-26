function Profile() {
  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <span>STEP 1 OF 4</span>
          <h1>Create Your Profile</h1>
          <p>
            Tell us about yourself so SkillTrack can personalize your
            learning and career journey.
          </p>
        </div>

        <div className="profile-card">
          <div className="form-section">
            <h2>Personal Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Enter your full name" />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="Enter your email" />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="Enter your phone number" />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input type="text" placeholder="City / District" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Education & Career</h2>

            <div className="form-grid">
              <div className="form-group">
                <label>Highest Qualification</label>
                <select>
                  <option>Select qualification</option>
                  <option>10th</option>
                  <option>12th</option>
                  <option>Diploma</option>
                  <option>Undergraduate</option>
                  <option>Postgraduate</option>
                </select>
              </div>

              <div className="form-group">
                <label>Career Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Developer"
                />
              </div>
            </div>
          </div>

          <button className="continue-button">
            Continue to Skills →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;