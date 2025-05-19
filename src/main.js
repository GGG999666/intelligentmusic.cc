import './style.css'

import * as THREE from 'three'

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DepthOfFieldEffect, ChromaticAberrationEffect, BloomEffect, NoiseEffect, EffectComposer, EffectPass, RenderPass, PixelationEffect, BlendFunction  } from 'postprocessing';
import { HalfFloatType } from "three";

import Lenis from 'lenis'

import { gsap } from "gsap";
    
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import { clearcoatRoughness, metalness, roughness } from 'three/tsl';

// Import animations
import { initTypewriterEffects } from './animations.js';

// Add these imports at the top of the file with other imports
import yvlImage from './img/releases/yvl.png';
import cmImage from './img/releases/CMcoverFINAL.png';
import d4Image from './img/releases/4D.png';

gsap.registerPlugin(Draggable,DrawSVGPlugin,Observer,ScrollTrigger,ScrollToPlugin,TextPlugin);

// Loading screen elements
const loadingScreen = document.querySelector('.loading-screen');
const loadingBar = document.querySelector('.loading-bar');
const loadingProgress = document.querySelector('.loading-progress');

// Loading manager setup
const loadManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadManager);
const imageLoader = new THREE.ImageLoader(loadManager);

// Track total loading progress
let totalProgress = {
  threeJs: 0,
  images: 0,
  releases: 0
};

// Create an image map
const imageMap = {
  'yvl.png': yvlImage,
  'CMcoverFINAL.png': cmImage,
  '4D.png': d4Image
};

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
  
  // Get the image URL from our image map
  const imageUrl = imageMap[release.coverArt] || '';
  
  trackElement.innerHTML = `
    <div class="about-track">
      <div class="top">
        <img src="${imageUrl}" alt="${release.title} cover art" class="cover-art">
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
          <a href="${release.links.spotify}" target="_blank">SPOTIFY</a>
          <a href="${release.links.appleMusic}" target="_blank">APPLE MUSIC</a>
          <a href="${release.links.other}" target="_blank">LINKS</a>
        </div>
      </div>
    </div>
  `;

  return trackElement;
};

// Update loading progress
function updateLoadingProgress() {
  const progress = (totalProgress.threeJs + totalProgress.images + totalProgress.releases) / 3;
  loadingBar.style.width = `${progress}%`;
  loadingProgress.textContent = `${Math.round(progress)}%`;
  
  if (progress >= 100) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      
      // Initialize all animations and scrolling after loading
      initializeAnimations();
    }, 500);
  }
}

// Three.js loading manager
loadManager.onProgress = function(url, itemsLoaded, itemsTotal) {
  totalProgress.threeJs = (itemsLoaded / itemsTotal) * 100;
  updateLoadingProgress();
};

// Load all images on the page
function preloadImages() {
  const images = document.querySelectorAll('img');
  let loadedImages = 0;
  
  images.forEach(img => {
    if (img.complete) {
      loadedImages++;
      totalProgress.images = (loadedImages / images.length) * 100;
      updateLoadingProgress();
    } else {
      img.addEventListener('load', () => {
        loadedImages++;
        totalProgress.images = (loadedImages / images.length) * 100;
        updateLoadingProgress();
      });
      
      img.addEventListener('error', () => {
        loadedImages++;
        totalProgress.images = (loadedImages / images.length) * 100;
        updateLoadingProgress();
      });
    }
  });
}

// Modified loadReleases function to track progress
async function loadReleasesWithProgress() {
  try {
    const response = await fetch(new URL('./data/releases.json', import.meta.url));
    if (!response.ok) {
      throw new Error('Failed to fetch releases data');
    }
    
    const data = await response.json();
    totalProgress.releases = 50; // Set to 50% after data is fetched
    updateLoadingProgress();
    
    const trackListContainer = document.querySelector('.track-list');
    trackListContainer.innerHTML = '';
    
    // Add each release to the track list
    data.releases.forEach((release, index) => {
      const trackElement = createTrackElement(release, index);
      trackListContainer.appendChild(trackElement);

      // Set initial state
      gsap.set(trackElement, {
        opacity: 0,
        x: index % 2 === 0 ? -50 : 50,
        transformOrigin: "center"
      });

      // Create scroll-triggered animation
      gsap.to(trackElement, {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: trackElement,
          start: "top bottom-=100",
          end: "top center",
          toggleActions: "play none none reverse"
        }
      });

      totalProgress.releases = 50 + ((index + 1) / data.releases.length) * 50;
      updateLoadingProgress();
    });

    // Refresh ScrollTrigger after all tracks are added
    ScrollTrigger.refresh();
    
  } catch (error) {
    console.error('Error loading releases:', error);
    totalProgress.releases = 100; // Set to 100% even on error to not block loading
    updateLoadingProgress();
  }
};

// Create a global Lenis instance
let lenis;

// Function to initialize all animations and scrolling
function initializeAnimations() {
  // Initialize ScrollTrigger
  ScrollTrigger.config({
    ignoreMobileResize: true
  });
  
  // Initialize Lenis
  lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
    wheelMultiplier: 0.8,
    touchMultiplier: 1.5,
    smoothTouch: true,
    syncTouch: true
  });

  // Remove the old GSAP ticker integration
  gsap.ticker.lagSmoothing(0);

  // Create a single RAF loop for everything
  function raf(time) {
    lenis.raf(time);
    ScrollTrigger.update();
    requestAnimationFrame(raf);
    
    // Handle Three.js animation here
    if(group){
        // Update base rotation for continuous motion
        const deltaTime = time - lastTime;
        const normalizedDelta = deltaTime / 16.667; // Normalize to 60fps
        lastTime = time;
        
        baseRotation += autoRotationSpeed * normalizedDelta;
        
        if (rotationInfluence > 0) {
            // Smoothly transition to 0
            transitionSpeed = 0;
            const targetRotation = 0;
            const normalizedRotation = group.rotation.y % (Math.PI * 2);
            const shortestRotation = normalizedRotation > Math.PI ? normalizedRotation - Math.PI * 2 : normalizedRotation;
            group.rotation.y = lerpAngle(shortestRotation, targetRotation, rotationInfluence * 0.1 * normalizedDelta);
            lastRotation = group.rotation.y;
        } else {
            // Smoothly transition back to spinning
            transitionSpeed = transitionSpeed * Math.pow(0.95, normalizedDelta) + autoRotationSpeed * (1 - Math.pow(0.95, normalizedDelta));
            const targetRotation = lastRotation + transitionSpeed * normalizedDelta;
            group.rotation.y = lerpAngle(group.rotation.y, targetRotation, 0.1 * normalizedDelta);
            lastRotation = group.rotation.y;
        }
    }

    composer.render();
  }

  // Start the single animation loop
  requestAnimationFrame(raf);

  // Initialize typewriter and other animations
  initTypewriterEffects();

  // Refresh ScrollTrigger to ensure all animations are properly set up
  ScrollTrigger.refresh();

  // Make sure ScrollTrigger knows about Lenis scroll position
  lenis.on('scroll', ScrollTrigger.update);

  // Initialize all GSAP animations
  
  // Camera movement animation
  gsap.to(camera.position, {
    z: -0.1, 
    ease: "power2.inOut",
    duration: 1,
    scrollTrigger: {
      trigger: ".landing",
      start: "top top",
      end: "bottom 10%",
      scrub: 1,
      immediateRender: false,
      markers: false
    }
  });
  gsap.to(camera.rotation, {
    z: -0.1, 
    ease: "power2.inOut",
    duration: 1,
    scrollTrigger: {
      trigger: ".landing",
      start: "top top",
      end: "bottom center",
      scrub: 1,
      immediateRender: false,
      markers: false
    }
  });

  // Infinite scroll animations for contact links
  const setupInfiniteScroll = () => {
    const leftContainer = document.querySelector('.scroll-container.left');
    const rightContainer = document.querySelector('.scroll-container.right');

    if (leftContainer && rightContainer) {
      // Clone the links to create seamless loop
      const leftLinks = leftContainer.querySelectorAll('.link');
      const rightLinks = rightContainer.querySelectorAll('.link');

      // Clone and append links to create seamless loop
      leftLinks.forEach(link => {
        const clone = link.cloneNode(true);
        leftContainer.appendChild(clone);
      });

      rightLinks.forEach(link => {
        const clone = link.cloneNode(true);
        rightContainer.appendChild(clone);
      });

      // Calculate total width of original content
      const leftTotalWidth = Array.from(leftLinks).reduce((width, link) => width + link.offsetWidth + 32, 0);
      const rightTotalWidth = Array.from(rightLinks).reduce((width, link) => width + link.offsetWidth + 32, 0);

      // Create infinite scroll animations with faster speed
      gsap.to(leftContainer, {
        x: -leftTotalWidth,
        duration: leftTotalWidth / 100, // Faster speed
        ease: "none",
        repeat: -1,
        onRepeat: () => {
          gsap.set(leftContainer, { x: 0 });
        }
      });

      gsap.to(rightContainer, {
        x: rightTotalWidth,
        duration: rightTotalWidth / 100, // Faster speed
        ease: "none",
        repeat: -1,
        onRepeat: () => {
          gsap.set(rightContainer, { x: 0 });
        }
      });
    }
  };

  // Wait a bit for the DOM to be ready and elements to be properly sized
  setTimeout(setupInfiniteScroll, 100);

  // Scroll tip animation
  gsap.to('.scroll-tip', {
    opacity: 0, 
    ease: "power2.inOut",
    duration: 1,
    scrollTrigger: {
      trigger: ".landing",
      start: "top top",
      end: "center 100%",
      scrub: 1,
      immediateRender: false,
      markers: false
    }
  });

  // Track proximity animation
  gsap.to({
    progress: 0
  }, {
    progress: 1,
    ease: "none",
    scrollTrigger: {
      trigger: ".landing",
      start: "top top",
      end: "center center",
      scrub: 1,
      onUpdate: (self) => {
        rotationInfluence = self.progress;
      },
      markers: false
    }
  });
}

// Initialize loading when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Start loading everything
  preloadImages();
  loadReleasesWithProgress();
});

// 3d

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'), 
  alpha: false, 
  powerPreference: "high-performance", 
  stencil: false, 
  depth: false,
  antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const composer = new EffectComposer(renderer, {
  frameBufferType: HalfFloatType
});

// Remove old loading manager code and update loader
const loader = new GLTFLoader(loadManager);
let object;
let group = new THREE.Group();

loader.load(
  new URL('./models/imgeye.glb', import.meta.url).href,
  function (gltf){
    object = gltf.scene;
    object.position.set(0, 0, 0);
    group.position.set(0, 0, 0);
    group.add(object);
    scene.add(group);
  },
  // Progress callback
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  // Error callback
  function (error) {
    console.error('An error happened:', error);
  }
);

const frontLight = new THREE.PointLight( 0xffffff, 3 )
frontLight.position.set(0,0,1.5);
frontLight.castShadow = true;
scene.add(frontLight);

const behindLight = new THREE.PointLight( 0xffffff, 3 )
behindLight.position.set(0,0,-1.2);
behindLight.castShadow = true;
scene.add(behindLight);

const leftLight = new THREE.PointLight( 0xffffff, 3 )
leftLight.position.set(-1.5,0,1);
leftLight.castShadow = true;
scene.add(leftLight);

const rightLight = new THREE.PointLight( 0xffffff, 3 )
rightLight.position.set(1.5,0,1);
rightLight.castShadow = true;
scene.add(rightLight);

const topLight = new THREE.PointLight( 0xffffff, 3 )
topLight.position.set(0,1,1);
topLight.castShadow = true;
scene.add(topLight);

const bottomLight = new THREE.PointLight( 0xffffff, 3 )
bottomLight.position.set(0,-1,1);
bottomLight.castShadow = true;
scene.add(bottomLight)

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Reorder effects - put pixelation first
const pixelation = new PixelationEffect({ 
  granularity: 20  // More moderate value
});
const pixelPass = new EffectPass(camera, pixelation);
composer.addPass(pixelPass);

const bloom = new BloomEffect({
  intensity: 0.1,
  radius: 3,
});
const bloomPass = new EffectPass(camera, bloom);
composer.addPass(bloomPass);

const chromatic = new ChromaticAberrationEffect({
  offset: new THREE.Vector2(0.0002, 0.0002)
});
const noise = new NoiseEffect({
  blendFunction: BlendFunction.OVERLAY
});
noise.blendMode.opacity.value = 0.9;

const noisePass = new EffectPass(camera, chromatic, noise);
composer.addPass(noisePass);

let autoRotationSpeed = 0.3;
let rotationInfluence = 0;
let baseRotation = 0;
let lastRotation = 0;
let transitionSpeed = 0;
let lastTime = performance.now();

function lerpAngle(start, end, t) {
    // Normalize angles between -PI and PI
    start = start % (Math.PI * 2);
    if (start > Math.PI) start -= Math.PI * 2;
    if (start < -Math.PI) start += Math.PI * 2;

    end = end % (Math.PI * 2);
    if (end > Math.PI) end -= Math.PI * 2;
    if (end < -Math.PI) end += Math.PI * 2;

    // Find shortest direction
    let diff = end - start;
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;

    return start + diff * t;
}

window.addEventListener("resize", function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

camera.position.setX(0);
camera.position.setY(0);
camera.position.setZ(3);
camera.lookAt(0, 0, 0);

renderer.setClearColor(0x010101, 1);

function smoothScroll(element) {
  const targetElement = document.querySelector(element);
  if (targetElement && lenis) {
    lenis.scrollTo(targetElement, {
      offset: 0,
      duration: 3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
  }
}

// Make the function available globally
window.smoothScroll = smoothScroll;

// Add mobile menu functionality
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('nav');

hamburger.addEventListener('click', () => {
  nav.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('nav li').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('active');
  });
});
