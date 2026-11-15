import { guessGender } from '../utils/userPortrait';
import { portraitUrl } from '../utils/portrait';

export function getTabStudentAvatar(name: string, seed?: string): string {
  try {
    const gender = guessGender(name || '');
    return portraitUrl({
      seed: seed || name || 'student-seed',
      gender,
      age: 17,
      role: 'student'
    });
  } catch {
    return '/portraits/ms17.webp';
  }
}

