import { basePlatformerCode } from './base-platformer';
import { baseAdventureCode } from './base-adventure';
import { basePuzzleCode } from './base-puzzle';
import { baseShooterCode } from './base-shooter';
import { baseArcadeCode } from './base-arcade';
import { baseRPGCode } from './base-rpg';
import { baseRacingCode } from './base-racing';
import { baseEducationalCode } from './base-educational';
import { basePlatformerCodePython } from './base-platformer-python';
import { baseShooterCodePython } from './base-shooter-python';
import { 
  baseAdventureCodePython, 
  basePuzzleCodePython,
  baseRPGCodePython,
  baseRacingCodePython,
  baseEducationalCodePython,
  baseArcadeCodePython
} from './base-python-templates';
import { GameTemplate, TemplateCategory } from '../game-templates';

// JavaScript/HTML5 Canvas templates
const BASE_CODE_MAP_JS: Record<TemplateCategory, string> = {
  platformer: basePlatformerCode,
  adventure: baseAdventureCode,
  puzzle: basePuzzleCode,
  rpg: baseRPGCode,
  shooter: baseShooterCode,
  racing: baseRacingCode,
  educational: baseEducationalCode,
  arcade: baseArcadeCode,
};

// Python/Pygame templates
const BASE_CODE_MAP_PYTHON: Record<TemplateCategory, string> = {
  platformer: basePlatformerCodePython,
  adventure: baseAdventureCodePython,
  puzzle: basePuzzleCodePython,
  rpg: baseRPGCodePython,
  shooter: baseShooterCodePython,
  racing: baseRacingCodePython,
  educational: baseEducationalCodePython,
  arcade: baseArcadeCodePython,
};

const DIFFICULTY_MAP = {
  beginner: 0.7,
  intermediate: 1.0,
  advanced: 1.4,
};

const COLOR_MAP: Record<string, { player: string; enemy: string }> = {
  hopeful: { player: '#3498db', enemy: '#e74c3c' },
  gritty: { player: '#95a5a6', enemy: '#7f8c8d' },
  heroic: { player: '#f39c12', enemy: '#8e44ad' },
};

interface InjectionParams {
  template: GameTemplate;
  playerName?: string;
  enemyName?: string;
  goal?: string;
  tone?: 'hopeful' | 'gritty' | 'heroic';
  language?: 'python' | 'javascript';
}

export function injectTemplateCode(params: InjectionParams): string {
  const { template, playerName, enemyName, goal, tone, language = 'javascript' } = params;
  
  // Get base code for category and language
  const codeMap = language === 'python' ? BASE_CODE_MAP_PYTHON : BASE_CODE_MAP_JS;
  let code = codeMap[template.category];
  
  if (!code) {
    // Fallback to JavaScript if Python version doesn't exist
    code = BASE_CODE_MAP_JS[template.category];
    if (!code) {
      throw new Error(`No base code found for category: ${template.category} and language: ${language}`);
    }
  }
  
  // Get colors based on tone
  const toneColors = tone ? COLOR_MAP[tone] : { player: '#3498db', enemy: '#e74c3c' };
  
  // Prepare replacements
  const replacements: Record<string, string> = {
    '{{GAME_TITLE}}': template.name,
    '{{PLAYER_NAME}}': playerName || 'Hero',
    '{{ENEMY_NAME}}': enemyName || 'Enemy',
    '{{GOAL}}': goal || template.description,
    '{{PLAYER_COLOR}}': toneColors.player,
    '{{ENEMY_COLOR}}': toneColors.enemy,
    '{{DIFFICULTY_MULTIPLIER}}': DIFFICULTY_MAP[template.difficulty].toString(),
    '{{GRID_SIZE}}': template.difficulty === 'beginner' ? '6' : template.difficulty === 'intermediate' ? '8' : '10',
  };
  
  // Perform replacements
  Object.entries(replacements).forEach(([placeholder, value]) => {
    code = code.replaceAll(placeholder, value);
  });
  
  return code;
}

export function getBaseCodeForCategory(category: TemplateCategory, language: 'python' | 'javascript' = 'javascript'): string {
  const codeMap = language === 'python' ? BASE_CODE_MAP_PYTHON : BASE_CODE_MAP_JS;
  return codeMap[category] || '';
}

