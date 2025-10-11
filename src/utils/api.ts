import type { Tournament } from '@/types';

const API_BASE_URL = 'https://functions.poehali.dev';

// Load function URLs
let functionUrls: Record<string, string> = {};

const loadFunctionUrls = async () => {
  try {
    const response = await fetch('/backend/func2url.json');
    functionUrls = await response.json();
  } catch {
    // Fallback URLs
    functionUrls = {
      users: 'https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792',
      tournaments: 'https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45'
    };
  }
};

// Initialize function URLs
loadFunctionUrls();

export const api = {
  // Tournament API
  tournaments: {
    async getAll() {
      const url = functionUrls.tournaments || 'https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tournaments: ${response.status}`);
      }
      
      return response.json();
    },

    async create(tournament: Tournament) {
      const url = functionUrls.tournaments || 'https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45';
      
      // Map Tournament object to backend API format
      const backendTournament = {
        name: tournament.name,
        type: tournament.format, // Use format as type
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendTournament),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create tournament: ${response.status}`);
      }
      
      return response.json();
    }
  },

  // Users API  
  users: {
    async getAll() {
      const url = functionUrls.users || 'https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      return response.json();
    },

    async create(user: any) {
      const url = functionUrls.users || 'https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.status}`);
      }
      
      return response.json();
    }
  },

  // Seating API
  async deleteSeatingRound(tournamentId: string) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['X-Auth-Token'] = token;
    }

    const response = await fetch('https://functions.poehali.dev/f701e507-6542-4d30-be94-8bcad260ece0', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        tournament_id: tournamentId,
        round_number: 0
      })
    });

    return response;
  }
};