/**
 * React Bits - Curated Motion & UI Components for IntelliReview AI V2
 * Official React Bits Component Registry and Modular Facade Layer
 * 
 * Category Structure:
 * - text/        : TechText, SplitText, DecryptedText, CountUp, ShinyText
 * - animations/  : ElectricBorder, AnimatedContent, FadeContent, Magnet
 * - backgrounds/ : GridScan, DarkVeil
 * - components/  : SpotlightCard, MagicBento, ChromaGrid, Dock, AnimatedList, Stepper, GlassSurface
 * - micro/       : LatticeLoader, SquishSwitch, HoldButton, StatusMark
 */

// Text animations
export { default as TechText } from './text/TechText';
export { default as SplitText } from './text/SplitText';
export { default as DecryptedText } from './text/DecryptedText';
export { default as CountUp } from './text/CountUp';
export { default as ShinyText } from './text/ShinyText';

// Animations
export { default as ElectricBorder } from './animations/ElectricBorder';
export { default as AnimatedContent } from './animations/AnimatedContent';
export { default as FadeContent } from './animations/FadeContent';
export { default as Magnet } from './animations/Magnet';

// Backgrounds
export { default as GridScan } from './backgrounds/GridScan';
export { default as DarkVeil } from './backgrounds/DarkVeil';

// UI Components
export { default as SpotlightCard } from './components/SpotlightCard';
export { default as MagicBento } from './components/MagicBento';
export { ChromaGrid, default as ChromaGridDefault } from './components/ChromaGrid';
export { default as Dock } from './components/Dock';
export { default as MobileDock } from './components/Dock';
export { default as AnimatedList } from './components/AnimatedList';
export { Stepper, GlassSurface, default as StepperDefault } from './components/Stepper';

// Micro-interactions
export { default as LatticeLoader } from './micro/LatticeLoader';
export { default as SquishSwitch } from './micro/SquishSwitch';
export { default as HoldButton } from './micro/HoldButton';
export { StatusMark, default as StatusMarkDefault } from './micro/StatusMark';
