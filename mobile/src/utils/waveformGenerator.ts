/**
 * Waveform generation utility for voice messages
 * Generates realistic waveform data based on audio characteristics
 */

export interface WaveformData {
  bars: number[];
  duration: number;
}

/**
 * Generate realistic waveform data for a voice message
 * Since we can't easily analyze the actual audio file in React Native,
 * we'll generate realistic patterns based on duration and some randomness
 */
export const generateWaveformData = (duration: number, seed?: string): WaveformData => {
  const BARS_COUNT = 50; // Number of waveform bars
  const MIN_HEIGHT = 0.1; // Minimum bar height (10%)
  const MAX_HEIGHT = 1.0; // Maximum bar height (100%)
  
  // Use seed for consistent patterns (based on audio URL or timestamp)
  const randomSeed = seed ? hashString(seed) : Date.now();
  const random = seededRandom(randomSeed);
  
  const bars: number[] = [];
  
  for (let i = 0; i < BARS_COUNT; i++) {
    // Create realistic voice patterns
    const position = i / BARS_COUNT;
    
    // Base pattern: voice typically has more energy in middle frequencies
    const basePattern = Math.sin(position * Math.PI * 2) * 0.3 + 0.7;
    
    // Add some randomness for natural variation
    const randomVariation = (random() - 0.5) * 0.4;
    
    // Simulate speech patterns: some quiet parts, some loud parts
    const speechPattern = Math.sin(position * Math.PI * 8) * 0.2 + 0.8;
    
    // Combine patterns
    let height = basePattern * speechPattern + randomVariation;
    
    // Ensure height is within bounds
    height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height));
    
    // Add some silence periods (whispers, pauses)
    if (random() < 0.15) { // 15% chance of quiet bars
      height *= 0.3;
    }
    
    // Add some emphasis (louder parts)
    if (random() < 0.1) { // 10% chance of louder bars
      height = Math.min(MAX_HEIGHT, height * 1.3);
    }
    
    bars.push(height);
  }
  
  return {
    bars,
    duration
  };
};

/**
 * Simple hash function for string to number conversion
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator for consistent results
 */
function seededRandom(seed: number): () => number {
  let currentSeed = seed;
  return () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

/**
 * Generate waveform data for a specific audio file
 * This would ideally analyze the actual audio file, but for now we'll use
 * the file URL as a seed for consistent patterns
 */
export const generateWaveformForAudio = (audioUrl: string, duration: number): WaveformData => {
  return generateWaveformData(duration, audioUrl);
};
