import { Lantern } from './decorations';
import { ScrollReveal } from './utils';
import { useState } from 'react';

const faqData = [
  {
    question: 'What should I bring if I\'m staying at camp?',
    answer: (
      <ul>
        <li>Sleeping bag or bedding & pillow</li>
        <li>Towels and toiletries</li>
        <li>Flashlight</li>
        <li>Comfortable clothes for camp activities</li>
        <li>A jacket or layers for cooler evenings</li>
      </ul>
    )
  },
  {
    question: 'How will I get ready for a wedding while camping?',
    answer: 'Camp Newaygo has very nice modern bathrooms with excellent facilities for getting ready.'
  },
  {
    question: 'What is the dress code?',
    answer: (
      <>
        <p><strong>Wedding day attire is bold & bright</strong></p>
        <p>For the rest of the weekend, think casual camp clothes, sneakers and layers.</p>
      </>
    )
  },
  {
    question: 'Will we be outside?',
    answer: 'Yes - many activities, including the ceremony, will be outdoors. Please plan for grass, gravel paths, and weather-appropriate footwear.'
  },
  {
    question: 'Are kids welcome?',
    answer: 'Unfortunately, this is an adults only summer camp with exceptions only being made for the bride and groom\'s nieces and nephew.'
  },
  {
    question: 'Can I join just for part of the weekend?',
    answer: 'Absolutely! Join us for whatever days and activities you wish!'
  },
  {
    question: 'Can I bring a guest or plus-one?',
    answer: 'Due to space limitations, we\'re only able to accommodate the guests named on the invitation. We appreciate your understanding and can\'t wait to celebrate with everyone who\'s invited!'
  },
  {
    question: 'Still have questions?',
    answer: (
      <>
        <p>Email the bride and groom <a href="mailto:javery.chapmanwine@gmail.com" className="faq-link">javery.chapmanwine@gmail.com</a></p>
      </>
    )
  }
];

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faqs" className="faqs" aria-labelledby="faqs-heading">
      <Lantern className="faqs-lantern faqs-lantern-left" />
      <Lantern className="faqs-lantern faqs-lantern-right" />

      <ScrollReveal animation="fade-up">
        <div className="section-header">
          <h2 id="faqs-heading">FAQs</h2>
          <p className="section-subtitle">Everything you need to know about Camp Javery</p>
        </div>
      </ScrollReveal>

      <div className="faqs-container">
        {faqData.map((faq, index) => (
          <ScrollReveal key={index} animation="fade-up" delay={index * 50}>
            <div className={`faq-item ${openIndex === index ? 'open' : ''}`}>
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span>{faq.question}</span>
                <svg
                  className="faq-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="faq-answer" id={`faq-answer-${index}`} role="region">
                  {faq.answer}
                </div>
              )}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
