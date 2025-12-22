import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="container">
            <nav>
                <Link to="/">
                    <img src="/logo.png" alt="ClovaLink" className="logo-img" />
                </Link>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>

                <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
                    <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
                    <li><Link to="/docs" onClick={() => setIsMenuOpen(false)}>Documentation</Link></li>
                    <li><a href="https://clovalink.com" target="_blank" rel="noopener noreferrer" className="highlight-link">Enterprise Hosting</a></li>
                    <li><a href="https://github.com/clovalink/clovalink" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                </ul>
            </nav>
            <main>
                {children}
            </main>
            <footer>
                <p>&copy; {new Date().getFullYear()} ClovaLink. Open Source Enterprise File Management.</p>
            </footer>
        </div>
    );
};

export default Layout;
