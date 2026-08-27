import { Link } from "react-router-dom";
import "./Home.css";

const departments = [
  { code: "cse", name: "CSE" },
  { code: "ece", name: "ECE" },
  { code: "aids", name: "AI & DS" },
];

const years = [1, 2, 3, 4, 5];

function Home() {
  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <div className="home-icon">✓</div>

          <span className="home-eyebrow">ASSIGNMENT TRACKER</span>

          <h1>Find your class</h1>

          <p>
            Select your year and department to view the assignments for your
            batch.
          </p>
        </div>

        <div className="class-list">
          {years.map((year) => (
            <section className="year-section" key={year}>
              <h2>
                {year === 1
                  ? "1st"
                  : year === 2
                  ? "2nd"
                  : year === 3
                  ? "3rd"
                  : `${year}th`}{" "}
                Year
              </h2>

              <div className="department-grid">
                {departments.map((department) => (
                  <Link
                    key={department.code}
                    to={`/${year}-${department.code}`}
                    className="class-card"
                  >
                    <strong>{department.name}</strong>
                    <span>View assignments →</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;