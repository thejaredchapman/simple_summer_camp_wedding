import { useState, useEffect, useRef } from 'react';

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#meet-us', label: 'Meet the Campers' },
  { href: '#our-story', label: 'Their Story' },
  { href: '#photos', label: 'Photos' },
  { href: '#schedule', label: 'Schedule' },
  { href: '#lodging', label: 'Lodging' },
  { href: '#faqs', label: 'FAQs' },
  { href: '#contact', label: 'Contact Us' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('#home');
  const menuRef = useRef(null);
  const toggleButtonRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Update active section based on scroll position
      const sections = navLinks.map(link => document.querySelector(link.href)).filter(Boolean);
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.offsetTop <= scrollPosition) {
          setActiveSection(`#${section.id}`);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !toggleButtonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open on mobile
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Focus the section for accessibility
      element.setAttribute('tabindex', '-1');
      element.focus();
      setTimeout(() => element.removeAttribute('tabindex'), 100);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav
      className={`navbar ${isScrolled ? 'scrolled' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="navbar-container">
        <a
          href="#home"
          className="navbar-logo"
          onClick={(e) => handleNavClick(e, '#home')}
          aria-label="Camp Javery - Home"
        >
          <div className="navbar-logo-image-wrapper">
            <img
              src="/camp-sign.png"
              alt="Camp Javery logo"
              className="navbar-logo-image"
            />
          </div>
        </a>

        <button
          ref={toggleButtonRef}
          className={`navbar-toggle ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          aria-controls="navbar-menu"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>

        <ul
          ref={menuRef}
          id="navbar-menu"
          className={`navbar-links ${isMenuOpen ? 'open' : ''}`}
          role="menu"
        >
          {navLinks.map((link) => (
            <li key={link.href} role="none">
              <a
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                role="menuitem"
                aria-current={activeSection === link.href ? 'page' : undefined}
                className={activeSection === link.href ? 'active' : ''}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
