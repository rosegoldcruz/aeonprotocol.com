// ═══════════════════════════════════════════════════════════════════════════════
// AEON CONSTELLATION - ENHANCED CAPABILITIES REGISTRY
// Complete capability mapping for all prompt vault requirements
// ═══════════════════════════════════════════════════════════════════════════════

import { ConstellationAgentRole, FallbackAlgorithm, AgentIdeology } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITY DOMAINS - Every capability from the prompt vault
// ─────────────────────────────────────────────────────────────────────────────

export interface CapabilityDomain {
  id: string;
  name: string;
  keywords: string[];
  requiredTech: string[];
  optionalTech: string[];
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'LEGENDARY';
  promptPatterns: string[];
}

export const CAPABILITY_DOMAINS: Record<string, CapabilityDomain> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // VISUAL & 3D CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  THREE_JS_SCENES: {
    id: 'three-scenes',
    name: 'Three.js Scene Creation',
    keywords: ['3d', 'three', 'scene', 'canvas', 'webgl', 'mesh', 'geometry', 'material'],
    requiredTech: ['three', '@react-three/fiber', '@react-three/drei'],
    optionalTech: ['@react-three/postprocessing', 'cannon-es'],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Build a Three.js scene with {elements}',
      'Render a 3D {object} using React Three Fiber',
      'Create a WebGL {effect} with proper lighting',
    ],
  },
  
  FRACTALS_VOLUMETRICS: {
    id: 'fractals-volumetrics',
    name: 'Fractals & Volumetric Effects',
    keywords: ['fractal', 'volumetric', 'portal', 'gateway', 'tunnel', 'infinite', 'corridor'],
    requiredTech: ['three', '@react-three/fiber', 'glsl'],
    optionalTech: ['@react-three/postprocessing'],
    complexity: 'LEGENDARY',
    promptPatterns: [
      'Render a fractal {type} with ray marching',
      'Create a volumetric {effect} using custom shaders',
      'Build an infinite {structure} with procedural generation',
    ],
  },
  
  PARTICLE_SYSTEMS: {
    id: 'particles',
    name: 'Advanced Particle Systems',
    keywords: ['particle', 'particles', 'swarm', 'dust', 'snow', 'rain', 'stars', 'constellation'],
    requiredTech: ['three', '@react-three/fiber', 'glsl'],
    optionalTech: ['@react-three/postprocessing'],
    complexity: 'EXPERT',
    promptPatterns: [
      'Create a particle system with {count} particles responding to {input}',
      'Build a {type} particle field with depth parallax',
      'Render reactive particles that follow {behavior}',
    ],
  },
  
  POST_PROCESSING: {
    id: 'postprocessing',
    name: 'WebGL Post-Processing',
    keywords: ['bloom', 'glow', 'chromatic', 'aberration', 'vignette', 'dof', 'depth-of-field', 'exposure'],
    requiredTech: ['@react-three/postprocessing', 'postprocessing'],
    optionalTech: ['three'],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Add {effect} post-processing with intensity {value}',
      'Create cinematic depth-of-field focused on {element}',
      'Implement color grading with LUT transitions',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHADER CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  CUSTOM_SHADERS: {
    id: 'custom-shaders',
    name: 'Custom GLSL Shaders',
    keywords: ['shader', 'glsl', 'fragment', 'vertex', 'uniform', 'varying'],
    requiredTech: ['glsl', 'three'],
    optionalTech: [],
    complexity: 'EXPERT',
    promptPatterns: [
      'Write a GLSL shader that creates {effect}',
      'Build a shader material with uniforms for {variables}',
      'Create a vertex shader that displaces based on {input}',
    ],
  },
  
  NOISE_FUNCTIONS: {
    id: 'noise',
    name: 'Procedural Noise',
    keywords: ['noise', 'perlin', 'simplex', 'worley', 'fbm', 'turbulence', 'procedural'],
    requiredTech: ['glsl'],
    optionalTech: ['three'],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Generate {type} noise for {purpose}',
      'Create animated noise that evolves with time',
      'Build multi-octave FBM for terrain/clouds',
    ],
  },
  
  SDF_RAYMARCHING: {
    id: 'sdf-raymarching',
    name: 'SDFs & Ray Marching',
    keywords: ['sdf', 'signed distance', 'raymarching', 'raymarch', 'distance field'],
    requiredTech: ['glsl'],
    optionalTech: [],
    complexity: 'LEGENDARY',
    promptPatterns: [
      'Create an SDF for {shape} with smooth blending',
      'Implement ray marching to render {scene}',
      'Build a volumetric renderer using distance fields',
    ],
  },
  
  LIQUID_EFFECTS: {
    id: 'liquid',
    name: 'Liquid & Fluid Effects',
    keywords: ['liquid', 'fluid', 'water', 'metal', 'mercury', 'ripple', 'wave'],
    requiredTech: ['glsl', 'three'],
    optionalTech: ['framer-motion'],
    complexity: 'EXPERT',
    promptPatterns: [
      'Create a liquid {material} effect that responds to {input}',
      'Build ripple distortion triggered by {event}',
      'Implement fluid simulation for {element}',
    ],
  },
  
  HOLOGRAPHIC: {
    id: 'holographic',
    name: 'Holographic & Fresnel Effects',
    keywords: ['holographic', 'hologram', 'fresnel', 'iridescent', 'refraction', 'scanline'],
    requiredTech: ['glsl', 'three'],
    optionalTech: ['@react-three/postprocessing'],
    complexity: 'EXPERT',
    promptPatterns: [
      'Create a holographic material with fresnel edges',
      'Add scanline overlay that passes every {interval}',
      'Build iridescent surface that shifts with view angle',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATION CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  GSAP_TIMELINES: {
    id: 'gsap-timelines',
    name: 'GSAP Timeline Animation',
    keywords: ['gsap', 'timeline', 'tween', 'sequence', 'stagger', 'morph'],
    requiredTech: ['gsap'],
    optionalTech: ['@gsap/react'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Create a GSAP timeline that animates {elements} in sequence',
      'Build staggered entrance animations with {easing}',
      'Implement morphing between {shapes}',
    ],
  },
  
  SCROLL_TRIGGER: {
    id: 'scroll-trigger',
    name: 'Scroll-Driven Animation',
    keywords: ['scroll', 'scrolltrigger', 'pin', 'scrub', 'snap', 'parallax'],
    requiredTech: ['gsap', 'scrolltrigger'],
    optionalTech: ['lenis'],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Implement scroll-triggered animation for {section}',
      'Create a pinned section that scrubs through {content}',
      'Build scroll-synced camera movement',
    ],
  },
  
  FRAMER_MOTION: {
    id: 'framer-motion',
    name: 'Framer Motion Animations',
    keywords: ['framer', 'motion', 'spring', 'animate', 'variants', 'gesture', 'layout'],
    requiredTech: ['framer-motion'],
    optionalTech: [],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Create Framer Motion variants for {component}',
      'Implement spring physics animation with {parameters}',
      'Build gesture-driven animation responding to {gesture}',
    ],
  },
  
  SMOOTH_SCROLL: {
    id: 'smooth-scroll',
    name: 'Smooth Scrolling with Lenis',
    keywords: ['lenis', 'smooth', 'scroll', 'inertia', 'momentum'],
    requiredTech: ['lenis'],
    optionalTech: ['gsap'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Implement Lenis smooth scrolling integrated with {library}',
      'Create momentum-based scroll with custom friction',
      'Build scroll velocity mapping to animation intensity',
    ],
  },
  
  ROUTE_TRANSITIONS: {
    id: 'route-transitions',
    name: 'Page & Route Transitions',
    keywords: ['transition', 'route', 'page', 'enter', 'exit', 'cross-fade'],
    requiredTech: ['framer-motion', 'next'],
    optionalTech: ['gsap'],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Implement Next.js route transitions with {effect}',
      'Create shared layout transitions persisting {element}',
      'Build exit animations that complete before navigation',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERACTION CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  MAGNETIC_EFFECTS: {
    id: 'magnetic',
    name: 'Magnetic & Attraction Effects',
    keywords: ['magnetic', 'attraction', 'pull', 'gravity', 'snap'],
    requiredTech: ['gsap'],
    optionalTech: ['framer-motion'],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Create magnetic button that pulls cursor within {radius}px',
      'Implement attraction physics with {easing}',
      'Build snap-to-grid interaction with smooth release',
    ],
  },
  
  CURSOR_EFFECTS: {
    id: 'cursor',
    name: 'Custom Cursor & Trails',
    keywords: ['cursor', 'trail', 'spotlight', 'follow', 'ghost', 'pointer'],
    requiredTech: ['framer-motion'],
    optionalTech: ['gsap', 'three'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Create custom cursor with {shape} that follows mouse',
      'Build cursor trail with fading segments',
      'Implement spotlight reveal following cursor',
    ],
  },
  
  GESTURE_HANDLING: {
    id: 'gestures',
    name: 'Touch & Gesture Interactions',
    keywords: ['gesture', 'touch', 'swipe', 'pinch', 'drag', 'pan'],
    requiredTech: ['@use-gesture/react'],
    optionalTech: ['framer-motion'],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Implement {gesture} gesture with momentum physics',
      'Create draggable element with bounds and snap',
      'Build multi-touch interaction for {purpose}',
    ],
  },
  
  HAPTIC_FEEDBACK: {
    id: 'haptics',
    name: 'Haptic & Vibration Feedback',
    keywords: ['haptic', 'vibration', 'feedback', 'tactile', 'pulse'],
    requiredTech: ['web-vibration-api'],
    optionalTech: [],
    complexity: 'BASIC',
    promptPatterns: [
      'Add haptic feedback to {interaction}',
      'Create vibration pattern synced to {animation}',
      'Implement tactile response for mobile gestures',
    ],
  },
  
  MICRO_INTERACTIONS: {
    id: 'micro-interactions',
    name: 'Micro-interactions & Feedback',
    keywords: ['micro', 'hover', 'click', 'feedback', 'ripple', 'press'],
    requiredTech: ['framer-motion'],
    optionalTech: ['gsap'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Add micro-interaction to {element} on {event}',
      'Create ripple effect expanding from click point',
      'Implement press/release animation with scale',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UI/UX CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  GLASSMORPHISM: {
    id: 'glassmorphism',
    name: 'Glassmorphic UI',
    keywords: ['glass', 'glassmorphism', 'blur', 'frosted', 'translucent', 'backdrop'],
    requiredTech: ['tailwindcss'],
    optionalTech: [],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Create glassmorphic {component} with {blur}px blur',
      'Build frosted glass panel with gradient border',
      'Implement depth-aware glass layering',
    ],
  },
  
  RESPONSIVE_DESIGN: {
    id: 'responsive',
    name: 'Responsive & Adaptive Design',
    keywords: ['responsive', 'mobile', 'tablet', 'desktop', 'breakpoint', 'clamp', 'fluid'],
    requiredTech: ['tailwindcss'],
    optionalTech: [],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Create fully responsive layout from 320px to 1920px',
      'Implement fluid typography with CSS clamp()',
      'Build adaptive component that transforms at {breakpoint}',
    ],
  },
  
  DARK_LIGHT_THEMES: {
    id: 'theming',
    name: 'Theme Systems',
    keywords: ['dark', 'light', 'theme', 'mode', 'toggle', 'palette'],
    requiredTech: ['tailwindcss', 'next-themes'],
    optionalTech: [],
    complexity: 'BASIC',
    promptPatterns: [
      'Implement dark/light mode with system preference',
      'Create theme toggle with smooth transition',
      'Build custom color palette with CSS variables',
    ],
  },
  
  NAVIGATION_SYSTEMS: {
    id: 'navigation',
    name: 'Navigation Components',
    keywords: ['nav', 'navbar', 'sidebar', 'menu', 'drawer', 'hamburger', 'dock'],
    requiredTech: ['tailwindcss', 'framer-motion'],
    optionalTech: ['gsap'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Create {type} navigation with {animation}',
      'Build collapsible sidebar transforming to drawer',
      'Implement bottom dock navigation for mobile',
    ],
  },
  
  DASHBOARD_LAYOUTS: {
    id: 'dashboard',
    name: 'Dashboard & Grid Layouts',
    keywords: ['dashboard', 'grid', 'panel', 'tile', 'widget', 'metrics', 'card'],
    requiredTech: ['tailwindcss'],
    optionalTech: ['framer-motion'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Create dashboard layout with {columns} columns',
      'Build auto-stacking grid for various breakpoints',
      'Implement draggable widget grid',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  GPU_OPTIMIZATION: {
    id: 'gpu-optimization',
    name: 'GPU Performance Optimization',
    keywords: ['gpu', 'performance', 'fps', '60fps', 'optimize', 'budget'],
    requiredTech: [],
    optionalTech: ['three'],
    complexity: 'EXPERT',
    promptPatterns: [
      'Optimize for 60fps on {device_tier}',
      'Implement GPU budget monitoring with fallbacks',
      'Create performance tier detection',
    ],
  },
  
  ADAPTIVE_QUALITY: {
    id: 'adaptive-quality',
    name: 'Adaptive Quality Scaling',
    keywords: ['adaptive', 'quality', 'fallback', 'degradation', 'tier', 'battery'],
    requiredTech: [],
    optionalTech: [],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Detect device capability and scale quality',
      'Implement progressive enhancement from basic to full',
      'Create battery-aware animation reduction',
    ],
  },
  
  LAZY_LOADING: {
    id: 'lazy-loading',
    name: 'Code Splitting & Lazy Loading',
    keywords: ['lazy', 'suspense', 'dynamic', 'import', 'split', 'chunk'],
    requiredTech: ['next', 'react'],
    optionalTech: [],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Implement lazy loading for {component}',
      'Create suspense boundaries with {fallback}',
      'Build dynamic import strategy for heavy modules',
    ],
  },
  
  MEMORY_MANAGEMENT: {
    id: 'memory',
    name: 'Memory & Resource Management',
    keywords: ['memory', 'cleanup', 'dispose', 'leak', 'garbage', 'unmount'],
    requiredTech: ['react'],
    optionalTech: ['three'],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Implement proper cleanup on unmount',
      'Create resource pooling for {type}',
      'Build memory monitoring with alerts',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE-SPECIFIC CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  SAFE_AREA_HANDLING: {
    id: 'safe-area',
    name: 'Safe Area & Notch Handling',
    keywords: ['safe-area', 'notch', 'dynamic-island', 'punch-hole', 'inset'],
    requiredTech: ['tailwindcss'],
    optionalTech: [],
    complexity: 'BASIC',
    promptPatterns: [
      'Handle iOS Dynamic Island and Android notches',
      'Implement safe-area-inset padding',
      'Create orientation-aware safe area handling',
    ],
  },
  
  ORIENTATION_HANDLING: {
    id: 'orientation',
    name: 'Orientation Change Handling',
    keywords: ['orientation', 'portrait', 'landscape', 'rotate', 'aspect'],
    requiredTech: ['react'],
    optionalTech: ['framer-motion'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Handle orientation change with layout morph',
      'Create portrait/landscape specific layouts',
      'Implement smooth transition between orientations',
    ],
  },
  
  TOUCH_OPTIMIZATION: {
    id: 'touch-optimization',
    name: 'Touch Target Optimization',
    keywords: ['touch', 'tap', 'target', 'thumb', 'one-hand', 'zone'],
    requiredTech: ['tailwindcss'],
    optionalTech: [],
    complexity: 'BASIC',
    promptPatterns: [
      'Ensure minimum 48px touch targets',
      'Position primary actions in thumb-reach zone',
      'Implement one-handed operation layout',
    ],
  },
  
  GYRO_ACCELEROMETER: {
    id: 'motion-sensors',
    name: 'Motion Sensor Integration',
    keywords: ['gyro', 'accelerometer', 'tilt', 'motion', 'deviceorientation'],
    requiredTech: [],
    optionalTech: [],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Replace mouse parallax with device motion',
      'Create tilt-responsive effects capped at {degrees}',
      'Implement shake detection for {action}',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NARRATIVE & EXPERIENCE CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  CINEMATIC_PACING: {
    id: 'pacing',
    name: 'Cinematic Pacing & Narrative',
    keywords: ['pacing', 'narrative', 'story', 'beat', 'tension', 'reveal', 'climax'],
    requiredTech: ['gsap'],
    optionalTech: ['framer-motion'],
    complexity: 'EXPERT',
    promptPatterns: [
      'Design narrative flow with {act_count} acts',
      'Implement tension/release through motion pacing',
      'Create scroll-driven storytelling experience',
    ],
  },
  
  CAMERA_PSYCHOLOGY: {
    id: 'camera-psychology',
    name: 'Camera Psychology & Cinematography',
    keywords: ['camera', 'dolly', 'zoom', 'vertigo', 'fov', 'perspective', 'pan', 'tilt'],
    requiredTech: ['@react-three/fiber'],
    optionalTech: ['gsap'],
    complexity: 'EXPERT',
    promptPatterns: [
      'Implement dolly zoom (vertigo) effect',
      'Create scroll-synced camera path along spline',
      'Build FOV-based emotional manipulation',
    ],
  },
  
  TIME_OF_DAY: {
    id: 'time-of-day',
    name: 'Time-Based Visuals',
    keywords: ['time', 'day', 'night', 'dawn', 'dusk', 'ambient', 'mood'],
    requiredTech: [],
    optionalTech: ['three'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Shift palette based on user local time',
      'Create day/night cycle for environment',
      'Implement stars that appear after {time}',
    ],
  },
  
  IDLE_BEHAVIOR: {
    id: 'idle',
    name: 'Idle State & Ambient Motion',
    keywords: ['idle', 'ambient', 'drift', 'breathing', 'alive'],
    requiredTech: ['gsap'],
    optionalTech: ['framer-motion'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Create ambient idle state after {seconds}s',
      'Implement breathing/drifting motion',
      'Build evolving visuals based on idle duration',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  AUDIO_REACTIVE: {
    id: 'audio-reactive',
    name: 'Audio-Reactive Visuals',
    keywords: ['audio', 'sound', 'music', 'reactive', 'frequency', 'amplitude', 'waveform'],
    requiredTech: ['web-audio-api'],
    optionalTech: ['tone.js', 'three'],
    complexity: 'EXPERT',
    promptPatterns: [
      'Create visuals reacting to audio frequency',
      'Build waveform visualization from {source}',
      'Implement beat detection driving animation',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AR/XR CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  WEBXR_INTEGRATION: {
    id: 'webxr',
    name: 'WebXR & AR Integration',
    keywords: ['ar', 'xr', 'webxr', 'augmented', 'spatial', 'immersive'],
    requiredTech: ['@react-three/xr'],
    optionalTech: ['@react-three/fiber'],
    complexity: 'LEGENDARY',
    promptPatterns: [
      'Implement WebXR AR session with {features}',
      'Create seamless web-to-AR handoff',
      'Build spatial anchoring for {object}',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSIBILITY CAPABILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  REDUCED_MOTION: {
    id: 'reduced-motion',
    name: 'Reduced Motion Support',
    keywords: ['reduced-motion', 'accessibility', 'prefers-reduced-motion'],
    requiredTech: [],
    optionalTech: [],
    complexity: 'BASIC',
    promptPatterns: [
      'Respect prefers-reduced-motion preference',
      'Create alternative static experience',
      'Implement motion toggle with persistence',
    ],
  },
  
  SCREEN_READER: {
    id: 'screen-reader',
    name: 'Screen Reader Support',
    keywords: ['aria', 'screen-reader', 'a11y', 'semantic', 'label'],
    requiredTech: [],
    optionalTech: ['radix-ui'],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Add ARIA labels to interactive elements',
      'Create screen-reader-friendly navigation',
      'Implement live regions for dynamic content',
    ],
  },
  
  KEYBOARD_NAVIGATION: {
    id: 'keyboard',
    name: 'Keyboard Navigation',
    keywords: ['keyboard', 'focus', 'tab', 'shortcut', 'hotkey'],
    requiredTech: [],
    optionalTech: [],
    complexity: 'INTERMEDIATE',
    promptPatterns: [
      'Implement keyboard navigation for {component}',
      'Create focus management for modal/drawer',
      'Add keyboard shortcuts with {modifier}+{key}',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSION OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  CTA_OPTIMIZATION: {
    id: 'cta',
    name: 'CTA & Conversion Optimization',
    keywords: ['cta', 'conversion', 'action', 'button', 'attention', 'persuasion'],
    requiredTech: ['gsap'],
    optionalTech: ['framer-motion'],
    complexity: 'ADVANCED',
    promptPatterns: [
      'Animate CTA to activate after narrative completion',
      'Create attention-drawing effect for primary action',
      'Implement delayed interactivity until scroll threshold',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT IDEOLOGIES - Core beliefs that drive agent behavior
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_IDEOLOGIES: Record<ConstellationAgentRole, AgentIdeology> = {
  NEXUS: {
    coreBeliefs: [
      'The user\'s verbatim request is the only truth',
      'Anything less than 100% silent success is catastrophic failure',
      'No stalls, no warnings, no perception that "this sucks"',
      'Decompose complexity into sovereign agent tasks',
      'Continuous learning from user outcomes drives evolution',
    ],
    priorities: {
      userOutcome: 1.0,
      latency: 0.9,
      reliability: 0.95,
      quality: 0.9,
      efficiency: 0.7,
    },
    constraints: [
      'Never expose errors to user',
      'Never simplify without constellation consensus',
      'Always have failover ready before assigning task',
      'Checkpoint state before every risky operation',
    ],
    emergentBehaviors: [
      'Predictive task pre-loading based on user patterns',
      'Proactive standby warming before expected failures',
      'Dynamic threshold adjustment based on system health',
    ],
  },
  
  ARCHITECT: {
    coreBeliefs: [
      'Structure determines capability',
      'Clean architecture enables all other agents',
      'TypeScript types are contracts, not suggestions',
      'Composition over inheritance, always',
      'Every component should have one reason to exist',
    ],
    priorities: {
      clarity: 1.0,
      modularity: 0.95,
      reusability: 0.9,
      maintainability: 0.9,
      performance: 0.7,
    },
    constraints: [
      'No circular dependencies',
      'No implicit any types',
      'Props interfaces must be complete',
      'State management patterns must be explicit',
    ],
    emergentBehaviors: [
      'Automatic extraction of shared utilities',
      'Predictive component hierarchy optimization',
    ],
  },
  
  RENDERER: {
    coreBeliefs: [
      'WebGL is an art form and a science',
      'Every frame must be intentional',
      'Performance is not optional for 3D',
      'React Three Fiber is the bridge between React and Three.js',
      'Lighting tells the story more than geometry',
    ],
    priorities: {
      visualQuality: 0.95,
      performance: 0.9,
      interactivity: 0.85,
      compatibility: 0.8,
      codeClarity: 0.7,
    },
    constraints: [
      'Handle WebGL context loss gracefully',
      'Dispose geometries and materials on unmount',
      'Never exceed device GPU budget',
      'Provide static fallback for unsupported devices',
    ],
    emergentBehaviors: [
      'Automatic LOD based on distance and device',
      'Predictive asset preloading',
    ],
  },
  
  SHADER_FORGE: {
    coreBeliefs: [
      'Shaders are mathematical poetry',
      'Every uniform should have purpose',
      'Noise is structure, not randomness',
      'GPU parallelism is a superpower',
      'Visual effects should enhance, not distract',
    ],
    priorities: {
      visualImpact: 0.95,
      performance: 0.9,
      originality: 0.85,
      maintainability: 0.7,
      reusability: 0.6,
    },
    constraints: [
      'No infinite loops in shaders',
      'Limit texture lookups per fragment',
      'Provide uniform documentation',
      'Test on multiple GPU vendors',
    ],
    emergentBehaviors: [
      'Automatic shader complexity reduction for mobile',
      'Dynamic uniform animation based on user engagement',
    ],
  },
  
  MOTION_CORE: {
    coreBeliefs: [
      'Motion has meaning or it has no place',
      'Fast motion = certainty, slow motion = importance',
      'Animation should reduce cognitive load, not add spectacle',
      'GSAP for scroll, Framer Motion for UI state',
      'Easing curves communicate emotion',
    ],
    priorities: {
      purposefulness: 1.0,
      smoothness: 0.95,
      timing: 0.9,
      performance: 0.85,
      maintainability: 0.7,
    },
    constraints: [
      'Clean up animations on unmount',
      'Register GSAP plugins before use',
      'Respect prefers-reduced-motion',
      'Never animate layout properties unnecessarily',
    ],
    emergentBehaviors: [
      'Velocity-aware animation intensity',
      'Predictive animation preloading based on scroll direction',
    ],
  },
  
  INTERFACE: {
    coreBeliefs: [
      'UI is behavior, not decoration',
      'Responsive is the default, not a feature',
      'Tailwind classes are the design language',
      'Accessibility is non-negotiable',
      'Every state (hover, focus, active, disabled) must be designed',
    ],
    priorities: {
      usability: 1.0,
      responsiveness: 0.95,
      accessibility: 0.9,
      aesthetics: 0.85,
      performance: 0.8,
    },
    constraints: [
      'Minimum 48px touch targets',
      'Semantic HTML elements always',
      'Color contrast ratios must meet WCAG',
      'No layout shifts on interaction',
    ],
    emergentBehaviors: [
      'Adaptive component density based on viewport',
      'Predictive UI pre-rendering based on user flow',
    ],
  },
  
  PERCEPTION: {
    coreBeliefs: [
      'Interaction is conversation',
      'Every gesture should feel physical',
      'Magnetic effects create perceived intelligence',
      'Micro-delays create perceived thoughtfulness',
      'Haptic feedback bridges digital and physical',
    ],
    priorities: {
      responsiveness: 1.0,
      naturalness: 0.95,
      feedback: 0.9,
      discoverability: 0.8,
      accessibility: 0.75,
    },
    constraints: [
      'Pointer events must be cleaned up',
      'Touch events require passive listeners where possible',
      'Gestures must have cancel/escape paths',
      'No unexpected motion from user input',
    ],
    emergentBehaviors: [
      'Adaptive interaction radius based on input precision',
      'Predictive gesture completion',
    ],
  },
  
  SENTINEL: {
    coreBeliefs: [
      '60fps is the minimum acceptable framerate',
      'Performance is user experience',
      'Measure before optimizing, always',
      'Graceful degradation over graceful failure',
      'The fastest code is the code that doesn\'t run',
    ],
    priorities: {
      frameRate: 1.0,
      memoryEfficiency: 0.9,
      loadTime: 0.85,
      bundleSize: 0.8,
      codeQuality: 0.7,
    },
    constraints: [
      'No memory leaks',
      'No layout thrashing',
      'Lazy load everything non-critical',
      'Profile before shipping',
    ],
    emergentBehaviors: [
      'Automatic quality tier detection and adaptation',
      'Predictive resource preloading based on patterns',
    ],
  },
  
  SYNTHESIZER: {
    coreBeliefs: [
      'Integration is where great systems fail',
      'Dependencies are liabilities until proven assets',
      'Types are the contract between modules',
      'State must flow predictably',
      'The whole must be greater than the sum of parts',
    ],
    priorities: {
      compatibility: 1.0,
      reliability: 0.95,
      maintainability: 0.9,
      performance: 0.8,
      flexibility: 0.75,
    },
    constraints: [
      'No version conflicts in dependencies',
      'All imports must resolve',
      'Shared state must be documented',
      'Integration tests required',
    ],
    emergentBehaviors: [
      'Automatic dependency resolution',
      'Predictive breaking change detection',
    ],
  },
  
  VALIDATOR: {
    coreBeliefs: [
      'Every edge case is a user waiting to be disappointed',
      'Error boundaries are not optional',
      'Loading states are part of the design',
      'TypeScript catches bugs at compile time',
      'Tests prove intent, not just functionality',
    ],
    priorities: {
      correctness: 1.0,
      coverage: 0.95,
      reliability: 0.9,
      usability: 0.85,
      maintainability: 0.8,
    },
    constraints: [
      'No unhandled promise rejections',
      'No console errors in production',
      'All user-facing errors must be friendly',
      'Recovery paths for all failure modes',
    ],
    emergentBehaviors: [
      'Automatic edge case generation',
      'Predictive failure point detection',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK ALGORITHMS - Progressively simpler implementations
// ─────────────────────────────────────────────────────────────────────────────

export function createFallbackAlgorithms(role: ConstellationAgentRole): [FallbackAlgorithm, FallbackAlgorithm, FallbackAlgorithm] {
  const templates = FALLBACK_TEMPLATES[role];
  
  return [
    {
      tier: 'FALLBACK_A',
      name: `${role}_REDUCED`,
      complexity: 'REDUCED',
      capabilities: templates.reduced.capabilities,
      promptTemplate: templates.reduced.prompt,
      estimatedLatencyMs: 2000,
      successProbability: 0.85,
    },
    {
      tier: 'FALLBACK_B',
      name: `${role}_MINIMAL`,
      complexity: 'MINIMAL',
      capabilities: templates.minimal.capabilities,
      promptTemplate: templates.minimal.prompt,
      estimatedLatencyMs: 1500,
      successProbability: 0.9,
    },
    {
      tier: 'FALLBACK_C',
      name: `${role}_EMERGENCY`,
      complexity: 'EMERGENCY',
      capabilities: templates.emergency.capabilities,
      promptTemplate: templates.emergency.prompt,
      estimatedLatencyMs: 500,
      successProbability: 0.95,
    },
  ];
}

const FALLBACK_TEMPLATES: Record<ConstellationAgentRole, {
  reduced: { capabilities: string[]; prompt: string };
  minimal: { capabilities: string[]; prompt: string };
  emergency: { capabilities: string[]; prompt: string };
}> = {
  NEXUS: {
    reduced: {
      capabilities: ['task-decomposition', 'agent-routing', 'basic-monitoring'],
      prompt: 'Decompose task and route to appropriate agents. Skip advanced analytics.',
    },
    minimal: {
      capabilities: ['simple-routing'],
      prompt: 'Route task to single most appropriate agent.',
    },
    emergency: {
      capabilities: ['direct-execution'],
      prompt: 'Execute task directly without decomposition.',
    },
  },
  ARCHITECT: {
    reduced: {
      capabilities: ['component-structure', 'basic-types'],
      prompt: 'Create component structure with essential TypeScript types.',
    },
    minimal: {
      capabilities: ['file-structure'],
      prompt: 'Create minimal file structure only.',
    },
    emergency: {
      capabilities: ['single-file'],
      prompt: 'Create single-file implementation.',
    },
  },
  RENDERER: {
    reduced: {
      capabilities: ['basic-3d', 'standard-lighting'],
      prompt: 'Create basic 3D scene without advanced effects.',
    },
    minimal: {
      capabilities: ['simple-geometry'],
      prompt: 'Create simple geometry with basic materials.',
    },
    emergency: {
      capabilities: ['static-image'],
      prompt: 'Provide static PNG fallback for 3D content.',
    },
  },
  SHADER_FORGE: {
    reduced: {
      capabilities: ['standard-materials', 'basic-effects'],
      prompt: 'Use standard Three.js materials with basic effects.',
    },
    minimal: {
      capabilities: ['css-effects'],
      prompt: 'Use CSS-only effects as shader alternative.',
    },
    emergency: {
      capabilities: ['no-effects'],
      prompt: 'Skip shader effects entirely, use solid colors.',
    },
  },
  MOTION_CORE: {
    reduced: {
      capabilities: ['css-animations', 'basic-transitions'],
      prompt: 'Use CSS animations instead of GSAP/Framer Motion.',
    },
    minimal: {
      capabilities: ['opacity-only'],
      prompt: 'Implement opacity transitions only.',
    },
    emergency: {
      capabilities: ['no-animation'],
      prompt: 'Skip animations, show static state.',
    },
  },
  INTERFACE: {
    reduced: {
      capabilities: ['basic-layout', 'core-components'],
      prompt: 'Create functional layout without advanced styling.',
    },
    minimal: {
      capabilities: ['html-structure'],
      prompt: 'Create semantic HTML structure with minimal styling.',
    },
    emergency: {
      capabilities: ['text-only'],
      prompt: 'Provide text-only interface.',
    },
  },
  PERCEPTION: {
    reduced: {
      capabilities: ['click-handlers', 'basic-hover'],
      prompt: 'Implement click and basic hover only.',
    },
    minimal: {
      capabilities: ['click-only'],
      prompt: 'Click handlers only, no advanced interactions.',
    },
    emergency: {
      capabilities: ['links-only'],
      prompt: 'Use standard links for navigation.',
    },
  },
  SENTINEL: {
    reduced: {
      capabilities: ['basic-optimization', 'lazy-load'],
      prompt: 'Apply basic optimization and lazy loading.',
    },
    minimal: {
      capabilities: ['code-splitting'],
      prompt: 'Apply code splitting only.',
    },
    emergency: {
      capabilities: ['none'],
      prompt: 'Skip optimization, prioritize functionality.',
    },
  },
  SYNTHESIZER: {
    reduced: {
      capabilities: ['basic-integration', 'import-resolution'],
      prompt: 'Resolve imports and basic integration only.',
    },
    minimal: {
      capabilities: ['file-assembly'],
      prompt: 'Assemble files without dependency optimization.',
    },
    emergency: {
      capabilities: ['concatenation'],
      prompt: 'Simple file concatenation.',
    },
  },
  VALIDATOR: {
    reduced: {
      capabilities: ['type-checking', 'basic-boundaries'],
      prompt: 'Run type checking and add basic error boundaries.',
    },
    minimal: {
      capabilities: ['syntax-validation'],
      prompt: 'Validate syntax only.',
    },
    emergency: {
      capabilities: ['try-catch'],
      prompt: 'Wrap everything in try-catch.',
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITY MAPPING - Which agent handles what
// ─────────────────────────────────────────────────────────────────────────────

export const CAPABILITY_TO_AGENT: Record<string, ConstellationAgentRole[]> = {
  // 3D & Visual
  'three-scenes': ['RENDERER'],
  'fractals-volumetrics': ['RENDERER', 'SHADER_FORGE'],
  'particles': ['SHADER_FORGE', 'RENDERER'],
  'postprocessing': ['SHADER_FORGE'],
  
  // Shaders
  'custom-shaders': ['SHADER_FORGE'],
  'noise': ['SHADER_FORGE'],
  'sdf-raymarching': ['SHADER_FORGE'],
  'liquid': ['SHADER_FORGE', 'MOTION_CORE'],
  'holographic': ['SHADER_FORGE', 'INTERFACE'],
  
  // Animation
  'gsap-timelines': ['MOTION_CORE'],
  'scroll-trigger': ['MOTION_CORE'],
  'framer-motion': ['MOTION_CORE', 'INTERFACE'],
  'smooth-scroll': ['MOTION_CORE'],
  'route-transitions': ['MOTION_CORE', 'SYNTHESIZER'],
  
  // Interaction
  'magnetic': ['PERCEPTION'],
  'cursor': ['PERCEPTION'],
  'gestures': ['PERCEPTION'],
  'haptics': ['PERCEPTION'],
  'micro-interactions': ['PERCEPTION', 'INTERFACE'],
  
  // UI/UX
  'glassmorphism': ['INTERFACE'],
  'responsive': ['INTERFACE'],
  'theming': ['INTERFACE'],
  'navigation': ['INTERFACE', 'MOTION_CORE'],
  'dashboard': ['INTERFACE', 'ARCHITECT'],
  
  // Performance
  'gpu-optimization': ['SENTINEL', 'RENDERER'],
  'adaptive-quality': ['SENTINEL'],
  'lazy-loading': ['SENTINEL', 'SYNTHESIZER'],
  'memory': ['SENTINEL', 'VALIDATOR'],
  
  // Mobile
  'safe-area': ['INTERFACE'],
  'orientation': ['INTERFACE', 'MOTION_CORE'],
  'touch-optimization': ['INTERFACE', 'PERCEPTION'],
  'motion-sensors': ['PERCEPTION'],
  
  // Narrative
  'pacing': ['MOTION_CORE', 'ARCHITECT'],
  'camera-psychology': ['RENDERER', 'MOTION_CORE'],
  'time-of-day': ['INTERFACE', 'SHADER_FORGE'],
  'idle': ['MOTION_CORE', 'PERCEPTION'],
  
  // Audio
  'audio-reactive': ['SHADER_FORGE', 'PERCEPTION'],
  
  // AR/XR
  'webxr': ['RENDERER', 'SYNTHESIZER'],
  
  // Accessibility
  'reduced-motion': ['MOTION_CORE', 'SENTINEL'],
  'screen-reader': ['INTERFACE', 'VALIDATOR'],
  'keyboard': ['PERCEPTION', 'INTERFACE'],
  
  // Conversion
  'cta': ['MOTION_CORE', 'INTERFACE', 'PERCEPTION'],
};

export function getAgentsForCapability(capabilityId: string): ConstellationAgentRole[] {
  return CAPABILITY_TO_AGENT[capabilityId] || ['NEXUS'];
}

export function getCapabilitiesForAgent(role: ConstellationAgentRole): string[] {
  return Object.entries(CAPABILITY_TO_AGENT)
    .filter(([_, agents]) => agents.includes(role))
    .map(([capId]) => capId);
}
