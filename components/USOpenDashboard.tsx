'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateForDisplay, getCurrentEasternDate, getTournamentDates } from '@/lib/time';
import { DateTime } from 'luxon';

interface Player {
  name: string;
  seed?: number;
  countryCode: string;
  flagEmoji: string;
}

interface Match {
  id: string;
  round: string;
  court: string;
  startTime: string;
  status: 'live' | 'upcoming' | 'completed';
  players: [Player, Player];
  sets: [number, number][];
  currentGame?: {
    p1Points: number;
    p2Points: number;
  };
}

interface MatchData {
  date: string;
  gender: string;
  live: Match[];
  upcoming: Match[];
  completed: Match[];
  lastUpdated: string;
}

function MatchCard({ match }: { match: Match }) {
  const startTime = DateTime.fromISO(match.startTime);
  const timeDisplay = startTime.toFormat('h:mm a');
  
  const getPointsDisplay = (points: number) => {
    if (points === 50) return 'AD'; // Advantage
    const pointsMap = { 0: '0', 15: '15', 30: '30', 40: '40' };
    return pointsMap[points as keyof typeof pointsMap] || points.toString();
  };

  // Highlight favorite players
  const favoriteLastNames = [
    'sinner','alcaraz','djokovic','fritz','zverev','musetti', // Men
    'sabalenka','paolini','raducanu','gauff','swiatek','osaka' // Women (includes both Świątek and Swiatek)
  ];
  const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isFavoriteName = (full: string) => {
    const normalized = stripDiacritics(full.trim()).toLowerCase();
    return favoriteLastNames.some((fav) => normalized.includes(fav));
  };
  const isFavorite = isFavoriteName(match.players[0].name) || isFavoriteName(match.players[1].name);

  return (
    <div className={`border rounded-lg p-4 transition-all duration-300 h-full ${
      isFavorite && match.status === 'live' ? 'border-red-500 bg-red-100' :
      isFavorite && match.status === 'upcoming' ? 'border-blue-500 bg-blue-100' :
      isFavorite && match.status === 'completed' ? 'border-gray-300 bg-gray-100' :
      match.status === 'live' ? 'border-red-500 bg-red-50' : 
      match.status === 'upcoming' ? 'border-blue-500 bg-blue-50' : 
      'border-gray-300 bg-gray-50'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="text-sm text-gray-600 flex items-center gap-1">
          {isFavorite && <span className="text-orange-500 text-xl">⭐</span>}
          <span className="font-medium">{match.round}</span>
          {match.court !== 'Court TBD' && ` • ${match.court}`}
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          match.status === 'live' ? 'bg-red-500 text-white' :
          match.status === 'upcoming' ? 'bg-blue-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {match.status === 'live' ? 'LIVE' : match.status === 'upcoming' ? timeDisplay : 'Final'}
        </div>
      </div>
      
      <div className="space-y-2">
        {match.players.map((player, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-lg">{player.flagEmoji}</span>
              <span className="font-medium">
                {player.seed && <span className="text-gray-500 text-sm">({player.seed}) </span>}
                {player.name}
              </span>
            </div>
            
            {/* Only show scores for live and completed matches */}
            {(match.status === 'live' || match.status === 'completed') && (
              <div className="flex items-center">
                {/* Set scores aligned in fixed width columns */}
                <div className="flex items-center">
                                  {match.sets.map((set, setIdx) => (
                  <span key={setIdx} className={`text-sm w-6 text-center transition-all duration-300 ${
                    set[idx] > set[1 - idx] ? 'font-bold' : ''
                  }`}>
                    {set[idx]}
                  </span>
                ))}
                </div>
                
                {/* Current game score for live matches */}
                {match.status === 'live' && match.currentGame && (
                  <span className="text-sm font-bold text-red-600 ml-3 w-8 text-center bg-red-100 rounded px-1">
                    {getPointsDisplay(idx === 0 ? match.currentGame.p1Points : match.currentGame.p2Points)}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchSection({ title, matches, emptyMessage }: { 
  title: string; 
  matches: Match[]; 
  emptyMessage: string;
}) {
  if (matches.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">
        {title} <span className="text-sm font-normal text-gray-500">({matches.length})</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {matches.map((match) => (
          <div key={match.id} className="h-full">
            <MatchCard match={match} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function USOpenDashboard() {
  const [selectedDate, setSelectedDate] = useState(getCurrentEasternDate());
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('men');
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { dates } = getTournamentDates();

  const fetchMatches = async (gender: 'men' | 'women', date: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/usopen/${gender}/${date}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch matches');
      }
      
      setMatchData(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setMatchData(null);
    } finally {
      setLoading(false);
    }
  };

  // Merge only live scores in place to avoid flicker
  const mergeLiveUpdates = (prev: MatchData | null, next: MatchData): MatchData => {
    if (!prev) return next;
    const byId = new Map(prev.live.map(m => [m.id, m]));
    const mergedLive = next.live.map(m => {
      const old = byId.get(m.id);
      return old ? { ...old, sets: m.sets, currentGame: m.currentGame, round: m.round, court: m.court, startTime: m.startTime } : m;
    });
    return {
      date: next.date,
      gender: next.gender,
      live: mergedLive,
      // keep upcoming/completed from next (or prev?) — prefer next to catch schedule changes without loader
      upcoming: next.upcoming,
      completed: next.completed,
      lastUpdated: next.lastUpdated,
    };
  };

  // Silent poller for today's date
  const pollMatches = useCallback(async () => {
    try {
      const response = await fetch(`/api/usopen/${selectedGender}/${selectedDate}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) return;
      setMatchData(prev => mergeLiveUpdates(prev, data));
      setLastRefresh(new Date());
    } catch {
      // ignore poll errors silently
    }
  }, [selectedGender, selectedDate]);

  useEffect(() => {
    // Initial load
    fetchMatches(selectedGender, selectedDate);

    // Set up 5s polling for today's date only
    const isToday = DateTime.fromISO(selectedDate).hasSame(
      DateTime.now().setZone('America/New_York').startOf('day'),
      'day'
    );
    if (!isToday) return;

    const id = setInterval(pollMatches, 5000);
    return () => clearInterval(id);
  }, [selectedGender, selectedDate, pollMatches]);

  const displayDate = DateTime.fromISO(selectedDate).setZone('America/New_York');

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        {/* Tournament Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">US Open Tennis Championship</h1>
          <p className="text-2xl font-bold text-slate-600 mb-4">Created by David S Corson</p>
          <p className="text-gray-600">August 25 - September 7, 2025 • New York</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Gender Toggle */}
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setSelectedGender('men')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  selectedGender === 'men' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Men&apos;s Singles
              </button>
              <button
                onClick={() => setSelectedGender('women')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  selectedGender === 'women' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Women&apos;s Singles
              </button>
            </div>

            {/* Date Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-gray-700 font-medium">Date:</label>
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {dates.map(date => {
                  const dt = DateTime.fromISO(date).setZone('America/New_York');
                  return (
                    <option key={date} value={date}>
                      {formatDateForDisplay(dt)} ({dt.toFormat('M/d')})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchMatches(selectedGender, selectedDate)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Selected Date Display */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {formatDateForDisplay(displayDate)} - {selectedGender === 'men' ? 'Men\'s' : 'Women\'s'} Singles
          </h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading matches...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-6 mb-8">
            <h3 className="text-red-800 font-medium mb-2">Error Loading Matches</h3>
            <p className="text-red-700">{error}</p>
            {error.includes('429') || error.includes('quota') ? (
              <div className="text-sm text-red-600 mt-2">
                <p>⚠️ API quota exceeded. The free plan is limited to 50 calls per day.</p>
                <p className="mt-1">Your quota will reset tomorrow. For now, mock data will be displayed.</p>
              </div>
            ) : (
              <p className="text-sm text-red-600 mt-2">
                Note: Check your API configuration or try again later.
              </p>
            )}
          </div>
        )}

        {/* Match Data */}
        {matchData && !loading && (
          <div className="space-y-8">
            {/* Only show Live Matches section for today */}
            {(() => {
              const isToday = DateTime.fromISO(selectedDate).hasSame(
                DateTime.now().setZone('America/New_York').startOf('day'), 
                'day'
              );
              
              if (isToday) {
                return (
                  <MatchSection 
                    title="Live Matches" 
                    matches={matchData.live}
                    emptyMessage="No live matches at the moment"
                  />
                );
              }
              return null;
            })()}
            
            <MatchSection 
              title="Upcoming Matches" 
              matches={matchData.upcoming}
              emptyMessage="No upcoming matches scheduled"
            />
            
            <MatchSection 
              title="Completed Matches" 
              matches={matchData.completed}
              emptyMessage="No completed matches yet"
            />
          </div>
        )}

        {/* Footer */}
        {matchData && (
          <div className="text-center mt-12 text-sm text-gray-500">
            <div>Last updated: {lastRefresh.toLocaleTimeString()}</div>
          </div>
        )}
      </main>
    </div>
  );
}
