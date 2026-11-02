import './globals.css';

export const metadata = {
  title: 'Smart Parking & Incident System',
  description: 'DBMS Level 3 Project (MySQL + Redis)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <div className="header-container">
            <h1>Smart Parking & Incident System</h1>
            <nav className="nav-links">
              <a href="/">Dashboard</a>
              <a href="/parking">Parking Slots</a>
              <a href="/incidents">Incidents</a>
              <a href="/analytics">Analytics</a>
              <a href="/profile">Profile</a>
              <a href="/login">Login</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
       
        
      </body>
    </html>
  );
}