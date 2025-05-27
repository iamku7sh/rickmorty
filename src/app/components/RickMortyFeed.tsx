'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchEpisodes, fetchCharacters, fetchEpisodeCharacters } from '@/lib/api';
import { Episode, Character, ApiResponse } from '@/types/api';



// Main Component
const RickAndMortyFeed: React.FC = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all episodes on component mount
  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        const episodeData = await fetchEpisodes();
        setEpisodes(episodeData);
      } catch (err) {
        setError('Failed to load episodes');
        console.error('Error fetching episodes:', err);
      }
    };

    loadEpisodes();
  }, []);

  // Fetch initial characters (first page)
  useEffect(() => {
    const loadInitialCharacters = async () => {
      try {
        setLoading(true);
        const characterData = await fetchCharacters();
        setCharacters(characterData);
        setError(null);
      } catch (err) {
        setError('Failed to load characters');
        console.error('Error fetching characters:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialCharacters();
  }, []);

  // Handle episode selection
  const handleEpisodeClick = async (episode: Episode) => {
    try {
      if (selectedEpisodeId === episode.id) {
        // Unselect episode - revert to initial view
        setSelectedEpisodeId(null);
        setCharactersLoading(true);
        const characterData = await fetchCharacters();
        setCharacters(characterData);
        setError(null);
      } else {
        // Select new episode
        setSelectedEpisodeId(episode.id);
        setCharactersLoading(true);
        const episodeCharacters = await fetchEpisodeCharacters(episode.characters);
        setCharacters(episodeCharacters);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load episode characters');
      console.error('Error handling episode click:', err);
    } finally {
      setCharactersLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Episodes */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 bg-green-600 text-white">
          <h1 className="text-xl font-bold">Rick & Morty Episodes</h1>
        </div>
        <div className="p-2">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              onClick={() => handleEpisodeClick(episode)}
              className={`p-3 m-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                selectedEpisodeId === episode.id
                  ? 'bg-green-100 border-2 border-green-500 shadow-md'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="font-semibold text-sm text-gray-800">
                {episode.episode}
              </div>
              <div className="font-medium text-gray-700 mt-1">
                {episode.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {episode.air_date}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Characters */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedEpisodeId 
                ? `Characters from ${episodes.find(ep => ep.id === selectedEpisodeId)?.name}`
                : 'All Characters'
              }
            </h2>
            {selectedEpisodeId && (
              <p className="text-gray-600 mt-1">
                Episode: {episodes.find(ep => ep.id === selectedEpisodeId)?.episode}
              </p>
            )}
          </div>

          {(loading || charactersLoading) ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {characters.map((character) => (
                <div key={character.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="relative w-full h-48">
                    <Image
                      src={character.image}
                      alt={character.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {character.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          character.status === 'Alive' ? 'bg-green-500' :
                          character.status === 'Dead' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></span>
                        <span className="text-sm text-gray-600">
                          {character.status} - {character.species}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <strong>Origin:</strong> {character.origin.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && !charactersLoading && characters.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No characters found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RickAndMortyFeed;