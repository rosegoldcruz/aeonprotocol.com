// Agent Capabilities Registry - What each agent can do
// AEON UNIFIED PROMPT VAULT IMPLEMENTATION

import { AgentRole, AgentCapability } from './types';

export const AGENT_CAPABILITIES: Record<AgentRole, AgentCapability> = {
  orchestrator: {
    keywords: ['build', 'create', 'make', 'design', 'implement', 'construct', 'aeon', 'cinematic', 'experience'],
    technologies: ['*'],
    description: 'Meta-controller that analyzes, decomposes, and orchestrates all tasks using AEON principles',
    priority: 0,
  },
  
  architect: {
    keywords: ['architecture', 'structure', 'system', 'design', 'pattern', 'organize', 'scaffold', 'component', 'hierarchy'],
    technologies: ['nextjs', 'react', 'typescript', 'components', 'hooks'],
    description: 'Plans component structure, file organization, and system architecture',
    priority: 1,
  },
  
  'ui-specialist': {
    keywords: ['ui', 'ux', 'layout', 'responsive', 'grid', 'flex', 'tailwind', 'style', 'theme', 'dark', 'light', 'button', 'input', 'form', 'card', 'modal', 'sidebar', 'navbar', 'footer', 'hero', 'glassmorphic', 'glass', 'holographic', 'dashboard', 'panel', 'tile'],
    technologies: ['tailwindcss', 'css', 'radix-ui', 'shadcn', 'styled-components'],
    description: 'Creates beautiful, responsive UI components with glassmorphic and holographic effects',
    priority: 2,
  },
  
  'three-specialist': {
    keywords: ['3d', 'three', 'threejs', 'three.js', 'webgl', 'canvas', 'scene', 'mesh', 'geometry', 'material', 'texture', 'model', 'gltf', 'glb', 'fractal', 'volumetric', 'raymarching', 'portal', 'gateway', 'orbit', 'terrain', 'neural', 'network', 'nodes', 'constellation', 'particles', 'universe', 'corridor', 'environment', 'reflection', 'light-field'],
    technologies: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
    description: 'Expert in Three.js, React Three Fiber, 3D scenes, portals, fractals, and WebGL rendering',
    priority: 3,
  },
  
  'shader-specialist': {
    keywords: ['shader', 'glsl', 'fragment', 'vertex', 'uniform', 'varying', 'noise', 'perlin', 'simplex', 'sine', 'wave', 'particle', 'particles', 'distortion', 'displacement', 'postprocessing', 'bloom', 'glow', 'chromatic', 'aberration', 'fresnel', 'scanline', 'holographic', 'liquid', 'rain', 'dust', 'snow', 'fog', 'vignette', 'lut', 'color-grading', 'exposure', 'sdf', 'raymarching'],
    technologies: ['glsl', 'webgl', 'postprocessing', 'shader-park'],
    description: 'Creates custom GLSL shaders, particle systems, post-processing, and procedural visual effects',
    priority: 3,
  },
  
  'camera-specialist': {
    keywords: ['camera', 'fov', 'dolly', 'zoom', 'vertigo', 'pan', 'tilt', 'roll', 'orbit', 'drift', 'perspective', 'depth-of-field', 'dof', 'focus', 'focus-pull', 'cinematic', 'film', 'director'],
    technologies: ['@react-three/fiber', '@react-three/drei', 'gsap'],
    description: 'Masters camera psychology, dolly zoom, scroll-synced camera movement, and cinematic framing',
    priority: 3,
  },
  
  'animation-specialist': {
    keywords: ['animation', 'animate', 'gsap', 'framer', 'motion', 'spring', 'tween', 'timeline', 'sequence', 'morph', 'transform', 'transition', 'fade', 'slide', 'scale', 'rotate', 'clip-path', 'liquid', 'glass', 'stagger', 'easing', 'curve', 'inertia', 'anticipation'],
    technologies: ['gsap', 'framer-motion', '@gsap/react', 'animejs', 'popmotion'],
    description: 'Masters GSAP, Framer Motion, complex sequences, morphing, and physics-based animations',
    priority: 3,
  },
  
  'scroll-specialist': {
    keywords: ['scroll', 'scrolltrigger', 'parallax', 'lenis', 'smooth', 'scroll-driven', 'scroll-synced', 'scroll-locked', 'scroll-snap', 'scroll-velocity', 'scroll-pressure', 'scrubber', 'pin', 'sticky', 'section', 'checkpoint', 'milestone'],
    technologies: ['lenis', 'gsap', '@gsap/react', 'scrolltrigger'],
    description: 'Implements scroll-driven experiences, parallax, scroll velocity mapping, and time scrubbing',
    priority: 3,
  },
  
  'interaction-specialist': {
    keywords: ['hover', 'click', 'drag', 'gesture', 'touch', 'mouse', 'cursor', 'magnetic', 'ripple', 'interactive', 'event', 'listener', 'pointer', 'swipe', 'pinch', 'pull', 'spotlight', 'trail', 'ghost-trail', 'heat-map', 'lattice'],
    technologies: ['@use-gesture/react', 'react-use-gesture', 'framer-motion'],
    description: 'Implements magnetic effects, cursor trails, spotlight reveals, and micro-interactions',
    priority: 4,
  },
  
  'narrative-specialist': {
    keywords: ['narrative', 'story', 'storytelling', 'pacing', 'tension', 'reveal', 'sequence', 'beat', 'moment', 'silence', 'pause', 'resolve', 'climax', 'intro', 'outro', 'checkpoint', 'chapter', 'act', 'scene', 'cinematic'],
    technologies: ['gsap', 'framer-motion'],
    description: 'Designs narrative flow, pacing, tension/release, cinematic moments, and emotional beats',
    priority: 3,
  },
  
  'fox-specialist': {
    keywords: ['fox', 'character', 'mascot', 'idle', 'breathing', 'blink', 'ear', 'tail', 'mood', 'behavior', 'attention', 'curiosity', 'greeting', 'farewell', 'emotion', 'expression', 'personality'],
    technologies: ['@react-three/fiber', '@react-three/drei', 'gsap'],
    description: 'Implements Fox character system with moods, behaviors, idle animations, and personality',
    priority: 4,
  },
  
  'ar-specialist': {
    keywords: ['ar', 'augmented', 'reality', 'webxr', 'xr', 'spatial', 'handoff', 'continuity', 'anchor', 'tracking', 'marker', 'immersive'],
    technologies: ['@react-three/xr', 'webxr', '@react-three/fiber'],
    description: 'Handles AR transitions, WebXR integration, spatial anchoring, and immersive experiences',
    priority: 5,
  },
  
  'audio-specialist': {
    keywords: ['audio', 'sound', 'music', 'reactive', 'frequency', 'amplitude', 'waveform', 'mic', 'haptic', 'vibration', 'feedback', 'sensory', 'rhythm', 'beat'],
    technologies: ['web-audio-api', 'tone.js', 'howler'],
    description: 'Implements audio-reactive visuals, haptic feedback, and sensory integration',
    priority: 5,
  },
  
  'performance-specialist': {
    keywords: ['performance', 'optimize', 'lazy', 'suspense', 'memo', 'useMemo', 'useCallback', 'virtualize', 'throttle', 'debounce', 'raf', 'requestAnimationFrame', 'fps', '60fps', 'frameloop', 'gpu', 'budget', 'tier', 'battery', 'low-power', 'fallback', 'adaptive', 'compression', 'lod', 'instancing'],
    technologies: ['lenis', '@studio-freight/lenis', 'react-virtualized', 'react-window'],
    description: 'Optimizes for 60fps, implements adaptive quality, GPU budgeting, and graceful degradation',
    priority: 5,
  },
  
  'accessibility-specialist': {
    keywords: ['accessibility', 'a11y', 'aria', 'screen-reader', 'keyboard', 'focus', 'reduced-motion', 'prefers-reduced-motion', 'contrast', 'semantic', 'skip-link', 'alt', 'label'],
    technologies: ['react', 'radix-ui'],
    description: 'Ensures accessibility compliance, reduced motion support, and inclusive design',
    priority: 5,
  },
  
  'conversion-specialist': {
    keywords: ['cta', 'conversion', 'button', 'action', 'attention', 'guide', 'funnel', 'persuasion', 'psychology', 'trust', 'urgency', 'clarity', 'hierarchy', 'premium', 'enterprise'],
    technologies: ['gsap', 'framer-motion'],
    description: 'Optimizes for conversion through attention guidance, CTA timing, and motion psychology',
    priority: 6,
  },
  
  'integration-specialist': {
    keywords: ['integrate', 'combine', 'connect', 'sync', 'coordinate', 'merge', 'package', 'dependency', 'import', 'export', 'route', 'transition', 'shared', 'layout', 'state'],
    technologies: ['npm', 'package.json', 'typescript', 'nextjs'],
    description: 'Combines all agent outputs, handles routing, shared layout state, and dependency resolution',
    priority: 6,
  },
  
  'qa-specialist': {
    keywords: ['test', 'validate', 'check', 'error', 'edge', 'case', 'fallback', 'loading', 'empty', 'null', 'undefined', 'boundary', 'graceful', 'degrade', 'webgl-fail', 'context-loss'],
    technologies: ['typescript', 'zod', 'jest', 'testing-library'],
    description: 'Validates outputs, handles WebGL failures, adds error boundaries and graceful degradation',
    priority: 7,
  },
  
  fallback: {
    keywords: ['*'],
    technologies: ['*'],
    description: 'Emergency fallback agent that attempts to solve any remaining issues',
    priority: 99,
  },
};

// Technology to npm package mapping
export const TECH_TO_PACKAGES: Record<string, string[]> = {
  'three': ['three', '@types/three'],
  '@react-three/fiber': ['@react-three/fiber'],
  '@react-three/drei': ['@react-three/drei'],
  '@react-three/postprocessing': ['@react-three/postprocessing', 'postprocessing'],
  '@react-three/xr': ['@react-three/xr'],
  'gsap': ['gsap'],
  'framer-motion': ['framer-motion'],
  'lenis': ['lenis'],
  '@studio-freight/lenis': ['@studio-freight/lenis'],
  '@use-gesture/react': ['@use-gesture/react'],
  'tailwindcss': ['tailwindcss', 'autoprefixer', 'postcss'],
  'radix-ui': ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  'glsl': [], // Native WebGL, no package needed
  'webgl': [], // Native browser API
  'web-audio-api': [], // Native browser API
  'webxr': [], // Native browser API
  'tone.js': ['tone'],
  'howler': ['howler'],
};
