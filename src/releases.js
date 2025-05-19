import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

// Function to format date from YYYY-MM-DD to DD-MM-YY
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(2);
  return `${day}-${month}-${year}`;
};

// Function to create a single track element
const createTrackElement = (release, index) => {
  const trackElement = document.createElement('div');
  trackElement.className = 'track';
  
  trackElement.innerHTML = `
    <div class="about-track">
      <div class="top">
        <img src="${release.coverArt}" alt="${release.title} cover art" class="cover-art">
      </div>
      <div class="info">
        <div class="details">
          <div class="track-title">${release.title}</div>
          <p class="track-date">${release.artist} - ${formatDate(release.date)}</p>
        </div>
        <div class="descripton">
          <p>${release.description}</p>
        </div>
        <div class="links">
          <a href="${release.links.spotify}">SPOTIFY</a>
          <a href="${release.links.appleMusic}">APPLE MUSIC</a>
          <a href="${release.links.other}">LINKS</a>
        </div>
      </div>
    </div>
  `;
  
  return trackElement;
};

// Function to load and render all releases
export const loadReleases = async () => {
  try {
    const response = await fetch('./data/releases.json');
    if (!response.ok) {
      throw new Error('Failed to fetch releases data');
    }
    
    const data = await response.json();
    const trackListContainer = document.querySelector('.track-list');
    
    // Clear existing content
    trackListContainer.innerHTML = '';
    
    // Add each release to the track list with animation
    data.releases.forEach((release, index) => {
      const trackElement = createTrackElement(release, index);
      trackListContainer.appendChild(trackElement);
      
      // Set initial state
      gsap.set(trackElement, {
        opacity: 0,
        x: index % 2 === 0 ? -50 : 50,
        transformOrigin: "center"
      });

      // Animate in
      gsap.to(trackElement, {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: trackElement,
          start: "top bottom-=100",
          toggleActions: "play none none none"
        }
      });

      // Add hover effect
      trackElement.addEventListener('mouseenter', () => {
        gsap.to(trackElement, {
          scale: 1.01,
          duration: 0.4,
          ease: "power2.out"
        });
      });

      trackElement.addEventListener('mouseleave', () => {
        gsap.to(trackElement, {
          scale: 1,
          duration: 0.4,
          ease: "power2.out"
        });
      });
    });
    
  } catch (error) {
    console.error('Error loading releases:', error);
  }
}; 