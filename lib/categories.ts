import type { Category } from '@/types';

export const categories: Category[] = [
  { id: 'geological', name: "Geological", icon: "🌋", subcategories: ["Earthquake", "Volcanic Eruption", "Tsunami", "Landslide"] },
  { id: 'meteorological', name: "Meteorological", icon: "🌪️", subcategories: ["Typhoon/Hurricane", "Tornado", "Blizzard", "Extreme Heat", "Drought"] },
  { id: 'hydrological', name: "Hydrological", icon: "🌊", subcategories: ["Flood", "Flash Flood", "Avalanche"] },
  { id: 'biological', name: "Biological", icon: "🦠", subcategories: ["Epidemic", "Pandemic", "Insect Plague", "Animal Plague"] },
  { id: 'technological', name: "Technological", icon: "💻", subcategories: ["Chemical Spill", "Nuclear Accident", "Building Collapse", "Industrial Accident"] },
  { id: 'intentional', name: "Intentional", icon: "💥", subcategories: ["Terrorism", "Mass Violence", "Bombing"] },
  { id: 'transportation', name: "Transportation", icon: "🚗", subcategories: ["Plane Crash", "Train Accident", "Bus Accident", "Major Car Crash"] },
  { id: 'other', name: "Other", icon: "🚨", subcategories: ["Power Outage", "Large-Scale Fire", "Structural Fire", "Gas Leak"] }
];

export const defaultCategory: Category = {
  id: 'general',
  name: "General Emergency",
  icon: "🚨",
  subcategories: ["General Emergency"]
};

