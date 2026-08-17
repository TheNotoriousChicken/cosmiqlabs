import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchPosts } from '../services/instagramApi';

const STORAGE_KEY = 'processed_reel_ids';

function getProcessedIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function markAsProcessed(id) {
  const ids = getProcessedIds();
  if (!ids.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]));
  }
}

export function useNewReelDetector() {
  const { accessToken } = useAppStore();
  const [newReel, setNewReel] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const detect = async () => {
      try {
        const posts = await fetchPosts(accessToken, 10);
        const processedIds = getProcessedIds();

        const unprocessed = posts.find(
          (p) =>
            (p.media_type === 'VIDEO' || p.media_type === 'REEL') &&
            !processedIds.includes(p.id)
        );

        if (unprocessed) {
          setNewReel(unprocessed);
        }
      } catch (err) {
        console.error('Reel detector error:', err);
      }
    };

    detect();
  }, [accessToken]);

  const dismiss = () => {
    if (newReel) markAsProcessed(newReel.id);
    setDismissed(true);
    setNewReel(null);
  };

  const markDone = (reelId) => {
    markAsProcessed(reelId);
    setNewReel(null);
  };

  return {
    newReel: dismissed ? null : newReel,
    dismiss,
    markDone,
  };
}
