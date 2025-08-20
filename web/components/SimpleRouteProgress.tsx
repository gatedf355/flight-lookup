'use client';

import { useState, useEffect } from 'react';
import { fetchSimpleProgress, SimpleProgressResponse } from '../lib/simple-progress';

type Props = {
  originCode: string;
  destCode: string;
  position: { lat: number; lon: number };
};

export default function SimpleRouteProgress({ originCode, destCode, position }: Props) {
  const [data, setData] = useState<SimpleProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      console.log('SimpleRouteProgress: Loading progress for', { originCode, destCode, position });
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchSimpleProgress(originCode, destCode, position.lat, position.lon);
        if (result) {
          setData(result);
          console.log('SimpleRouteProgress: Data loaded successfully', result);
        } else {
          setError('Failed to load progress data');
          console.log('SimpleRouteProgress: No data returned');
        }
      } catch (err) {
        setError('Error loading progress');
        console.error('SimpleRouteProgress: Error loading progress', err);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [originCode, destCode, position.lat, position.lon]);

  if (loading) {
    return <div className="p-4 border rounded bg-yellow-50">Loading progress...</div>;
  }

  if (error) {
    return <div className="p-4 border rounded bg-red-50">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-4 border rounded bg-gray-50">No progress data</div>;
  }

  const pct = data.progress.pct;

  return (
    <div className="p-4 border rounded bg-orange-50">
      <h3 className="font-bold mb-2">Route Progress</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{data.origin.code}</span>
          <span className="font-medium">Current Position</span>
          <span>{data.destination.code}</span>
        </div>
        <div className="relative h-3 w-full rounded-full bg-gray-300 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>{pct}% Complete</span>
          <span>
            {Math.round(data.progress.coveredKm)} / {Math.round(data.progress.totalKm)} km
          </span>
        </div>
      </div>
    </div>
  );
}
