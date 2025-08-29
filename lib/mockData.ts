// Mock US Open 2025 data for demonstration
// Since SportDevs API doesn't have 2025 data yet, we'll use realistic mock data

import { DateTime } from 'luxon';

export interface MockMatch {
  id: string;
  round: string;
  court: string;
  startTime: string;
  status: 'live' | 'upcoming' | 'completed';
  players: [
    { name: string; seed?: number; countryCode: string; flagEmoji: string },
    { name: string; seed?: number; countryCode: string; flagEmoji: string }
  ];
  sets: [number, number][];
  currentGame?: { p1Points: number; p2Points: number };
}

const currentTime = DateTime.now().setZone('America/New_York');

export const mockMatches: { [key: string]: { men: MockMatch[]; women: MockMatch[] } } = {
  '2025-08-26': {
    men: [
      {
        id: 'live-1',
        round: 'Round 1',
        court: 'Arthur Ashe Stadium',
        startTime: currentTime.minus({ hours: 1 }).toISO()!,
        status: 'live',
        players: [
          { name: 'Alexander Zverev', seed: 4, countryCode: 'DE', flagEmoji: '🇩🇪' },
          { name: 'Maximilian Marterer', countryCode: 'DE', flagEmoji: '🇩🇪' }
        ],
        sets: [[6, 2], [6, 7], [1, 0]],
        currentGame: { p1Points: 30, p2Points: 15 }
      },
      {
        id: 'live-2',
        round: 'Round 1',
        court: 'Louis Armstrong Stadium',
        startTime: currentTime.minus({ hours: 2 }).toISO()!,
        status: 'live',
        players: [
          { name: 'Carlos Alcaraz', seed: 1, countryCode: 'ES', flagEmoji: '🇪🇸' },
          { name: 'Li Tu', countryCode: 'AU', flagEmoji: '🇦🇺' }
        ],
        sets: [[6, 2], [4, 2]],
        currentGame: { p1Points: 40, p2Points: 30 }
      },
      {
        id: 'upcoming-1',
        round: 'Round 1',
        court: 'Court 17',
        startTime: currentTime.plus({ hours: 1 }).toISO()!,
        status: 'upcoming',
        players: [
          { name: 'Novak Djokovic', seed: 2, countryCode: 'RS', flagEmoji: '🇷🇸' },
          { name: 'Radu Albot', countryCode: 'MD', flagEmoji: '🇲🇩' }
        ],
        sets: [],
      },
      {
        id: 'upcoming-2',
        round: 'Round 1',
        court: 'Grandstand',
        startTime: currentTime.plus({ hours: 2 }).toISO()!,
        status: 'upcoming',
        players: [
          { name: 'Daniil Medvedev', seed: 3, countryCode: 'RU', flagEmoji: '🇷🇺' },
          { name: 'Attila Balazs', countryCode: 'HU', flagEmoji: '🇭🇺' }
        ],
        sets: [],
      },
      {
        id: 'completed-1',
        round: 'Round 1',
        court: 'Court 7',
        startTime: currentTime.minus({ hours: 4 }).toISO()!,
        status: 'completed',
        players: [
          { name: 'Jannik Sinner', seed: 5, countryCode: 'IT', flagEmoji: '🇮🇹' },
          { name: 'Mackenzie McDonald', countryCode: 'US', flagEmoji: '🇺🇸' }
        ],
        sets: [[6, 2], [6, 2], [6, 1]],
      },
      {
        id: 'completed-2',
        round: 'Round 1',
        court: 'Court 11',
        startTime: currentTime.minus({ hours: 5 }).toISO()!,
        status: 'completed',
        players: [
          { name: 'Taylor Fritz', seed: 9, countryCode: 'US', flagEmoji: '🇺🇸' },
          { name: 'Camilo Ugo Carabelli', countryCode: 'AR', flagEmoji: '🇦🇷' }
        ],
        sets: [[7, 5], [6, 1], [6, 2]],
      }
    ],
    women: [
      {
        id: 'w-live-1',
        round: 'Round 1',
        court: 'Court 5',
        startTime: currentTime.minus({ minutes: 45 }).toISO()!,
        status: 'live',
        players: [
          { name: 'Iga Swiatek', seed: 1, countryCode: 'PL', flagEmoji: '🇵🇱' },
          { name: 'Kamilla Rakhimova', countryCode: 'RU', flagEmoji: '🇷🇺' }
        ],
        sets: [[6, 2], [3, 2]],
        currentGame: { p1Points: 15, p2Points: 0 }
      },
      {
        id: 'w-live-2',
        round: 'Round 1',
        court: 'Court 10',
        startTime: currentTime.minus({ hours: 1, minutes: 30 }).toISO()!,
        status: 'live',
        players: [
          { name: 'Coco Gauff', seed: 3, countryCode: 'US', flagEmoji: '🇺🇸' },
          { name: 'Varvara Gracheva', countryCode: 'FR', flagEmoji: '🇫🇷' }
        ],
        sets: [[6, 2], [5, 5]],
        currentGame: { p1Points: 40, p2Points: 40 }
      },
      {
        id: 'w-upcoming-1',
        round: 'Round 1',
        court: 'Arthur Ashe Stadium',
        startTime: currentTime.plus({ hours: 3 }).toISO()!,
        status: 'upcoming',
        players: [
          { name: 'Aryna Sabalenka', seed: 2, countryCode: 'BY', flagEmoji: '🇧🇾' },
          { name: 'Priscilla Hon', countryCode: 'AU', flagEmoji: '🇦🇺' }
        ],
        sets: [],
      },
      {
        id: 'w-completed-1',
        round: 'Round 1',
        court: 'Court 13',
        startTime: currentTime.minus({ hours: 3 }).toISO()!,
        status: 'completed',
        players: [
          { name: 'Jessica Pegula', seed: 6, countryCode: 'US', flagEmoji: '🇺🇸' },
          { name: 'Shelby Rogers', countryCode: 'US', flagEmoji: '🇺🇸' }
        ],
        sets: [[6, 4], [6, 3]],
      }
    ]
  },
  '2025-08-27': {
    men: [
      {
        id: 'tm-upcoming-1',
        round: 'Round 2',
        court: 'Arthur Ashe Stadium',
        startTime: DateTime.fromISO('2025-08-27T11:00:00').setZone('America/New_York').toISO()!,
        status: 'upcoming',
        players: [
          { name: 'Carlos Alcaraz', seed: 1, countryCode: 'ES', flagEmoji: '🇪🇸' },
          { name: 'Botic van de Zandschulp', countryCode: 'NL', flagEmoji: '🇳🇱' }
        ],
        sets: [],
      },
      {
        id: 'tm-upcoming-2',
        round: 'Round 2',
        court: 'Louis Armstrong Stadium',
        startTime: DateTime.fromISO('2025-08-27T13:00:00').setZone('America/New_York').toISO()!,
        status: 'upcoming',
        players: [
          { name: 'Alexander Zverev', seed: 4, countryCode: 'DE', flagEmoji: '🇩🇪' },
          { name: 'Alexandre Muller', countryCode: 'FR', flagEmoji: '🇫🇷' }
        ],
        sets: [],
      }
    ],
    women: [
      {
        id: 'tw-upcoming-1',
        round: 'Round 2',
        court: 'Grandstand',
        startTime: DateTime.fromISO('2025-08-27T12:00:00').setZone('America/New_York').toISO()!,
        status: 'upcoming',
        players: [
          { name: 'Iga Swiatek', seed: 1, countryCode: 'PL', flagEmoji: '🇵🇱' },
          { name: 'Daria Saville', countryCode: 'AU', flagEmoji: '🇦🇺' }
        ],
        sets: [],
      }
    ]
  }
};

export function getMockMatchesByDate(gender: 'men' | 'women', date: string) {
  const dayData = mockMatches[date];
  if (!dayData) return { live: [], upcoming: [], completed: [] };
  
  const matches = gender === 'men' ? dayData.men || [] : dayData.women || [];
  
  return {
    live: matches.filter(m => m.status === 'live'),
    upcoming: matches.filter(m => m.status === 'upcoming'),
    completed: matches.filter(m => m.status === 'completed')
  };
}
