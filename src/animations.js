import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Function to maintain element height while empty
const preserveHeight = (element) => {
  const height = element.offsetHeight;
  element.style.minHeight = `${height}px`;
  return height;
};

// Function to create console cursor element
const createCursor = () => {
  const cursor = document.createElement('span');
  cursor.className = 'console-cursor';
  cursor.innerHTML = '&#9608;'; // Solid block character
  cursor.style.cssText = `
    position: absolute;
    display: inline-block;
    width: 0.5em;
    height: 1em;
    margin-left: 1px;
    animation: blink 1s step-end infinite;
    vertical-align: baseline;
    font-size: 1em;
  `;
  
  // Add the blinking animation to document if not already present
  if (!document.querySelector('#cursor-style')) {
    const style = document.createElement('style');
    style.id = 'cursor-style';
    style.textContent = `
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .typing-container {
        display: inline-block;
        position: relative;
      }
      .typing-text {
        white-space: pre;
        position: relative;
      }
    `;
    document.head.appendChild(style);
  }
  
  return cursor;
};

// Function to create typewriter effect for a heading
const createHeadingTypewriter = (element) => {
  const text = element.textContent;
  preserveHeight(element);
  
  // Add consistent glow effect
  element.style.textShadow = "0 0 8px rgba(255,255,255,0.3)";
  
  // Create container for text and cursor
  const container = document.createElement('div');
  container.className = 'typing-container';
  
  // Create text element
  const textElement = document.createElement('span');
  textElement.className = 'typing-text';
  
  // Create cursor
  const cursor = createCursor();
  
  // Set up container
  element.textContent = '';
  container.appendChild(textElement);
  container.appendChild(cursor);
  element.appendChild(container);
  
  // Create the typing timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
      once: true,
      onComplete: () => {
        cursor.style.display = 'none';
      }
    }
  });

  // Function to update cursor position
  const updateCursorPosition = () => {
    const textWidth = textElement.offsetWidth;
    cursor.style.left = `${textWidth}px`;
  };

  // Add the typing animation
  tl.to(textElement, {
    duration: text.length * 0.06,
    text: text,
    ease: "none",
    onUpdate: updateCursorPosition,
    onComplete: () => {
      gsap.to(cursor, {
        opacity: 0,
        duration: 0.2,
        ease: "none",
        onComplete: () => cursor.remove()
      });
    }
  });

  return tl;
};

// Function to create a more subtle typing effect for paragraphs
const createParagraphTypewriter = (element) => {
  const text = element.textContent;
  preserveHeight(element);
  
  // Create the typing timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
      once: true
    }
  });

  // Split text into words
  const words = text.split(' ');
  element.textContent = '';
  
  // Create spans for each word
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.textContent = word + (i < words.length - 1 ? ' ' : '');
    span.style.opacity = '0';
    element.appendChild(span);
  });

  // Animate each word much faster
  element.querySelectorAll('span').forEach((span, i) => {
    tl.to(span, {
      opacity: 1,
      duration: 0.02,
      ease: "none"
    }, i * 0.02);
  });
};

// Function to animate the PC element
const animatePC = () => {
  const pcElement = document.querySelector('.pc');
  if (!pcElement) return;

  // Remove any existing animations
  pcElement.style.animation = 'none';
  
  // Set initial state
  gsap.set(pcElement, {
    y: 100,
    x: 20,
    rotationY: -10,
    opacity: 0
  });

  // Create the entrance animation
  gsap.to(pcElement, {
    y: 0,
    x: 0,
    rotationY: 0,
    opacity: 1,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: {
      trigger: pcElement,
      start: "top bottom-=100",
      end: "top center",
      scrub: false,
      toggleActions: "play none none reverse",
      onEnter: () => {
        // Wait for entrance animation to complete before adding continuous effects
        setTimeout(() => {
          pcElement.style.animation = "float 6s ease-in-out infinite";
        }, 1200);
      },
      onLeave: () => {
        pcElement.style.animation = "none";
      },
      onEnterBack: () => {
        pcElement.style.animation = "flicker 2s infinite, float 6s ease-in-out infinite";
      },
      onLeaveBack: () => {
        pcElement.style.animation = "none";
      }
    }
  });
};

// Initialize typewriter effects
export const initTypewriterEffects = () => {
  // Animate h2 elements
  document.querySelectorAll('h2').forEach(createHeadingTypewriter);
  
  // Animate the paragraph in the about section
  const aboutParagraph = document.querySelector('.about-text p');
  if (aboutParagraph) {
    createParagraphTypewriter(aboutParagraph);
  }

  // Initialize PC animation
  animatePC();
};