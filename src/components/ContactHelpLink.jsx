import './ContactHelpLink.css';

const CONTACT_EMAIL = 'javery.chapmanwine@gmail.com';
const SUBJECT = 'Issues uploading photos';
const BODY = "Hi Jared,\n\nI'm having trouble with:\n\n\n\nPlease include your name so you know who's reaching out:\nMy name is: ";

const MAILTO_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

export default function ContactHelpLink() {
  return (
    <a href={MAILTO_HREF} className="contact-help-link">
      Contact Help
    </a>
  );
}
