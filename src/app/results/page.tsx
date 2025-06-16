import { useState, useEffect } from 'react';

// refetch recommendations
setLoading(true);

const latestPayload = JSON.parse(localStorage.getItem('cc-recommendation-input') || '{}')

fetch('/api/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userSpending: latestPayload.userSpending || [],
    rewardPreference: latestPayload.rewardPreference || 'cashback',
    pointValue: latestPayload.pointValue ?? 0.01,
    cardCustomizations: updated
  })
}).then(r => r.json()).then(d => setRecommendations(d)).finally(() => setLoading(false));