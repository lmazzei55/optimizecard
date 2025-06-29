import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Return JavaScript code that clears localStorage and resets state
  const clearScript = `
// Clear all localStorage data related to user state and subscription
console.log('🧹 Clearing all cached user data...');

// Remove all user state related items
localStorage.removeItem('userState');
localStorage.removeItem('subscriptionTier');
localStorage.removeItem('rewardPreference');
localStorage.removeItem('pointValue');
localStorage.removeItem('enableSubCategories');

// Clear spending data
localStorage.removeItem('spendingData');
localStorage.removeItem('recommendationInput');

// Clear any other cached data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.startsWith('user') || key.startsWith('subscription') || key.startsWith('spending'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log('🗑️ Removing:', key);
  localStorage.removeItem(key);
});

console.log('✅ Cache cleared successfully!');
console.log('🔄 Reloading page to apply changes...');

// Force reload to apply changes
setTimeout(() => {
  window.location.reload();
}, 1000);
`;

  return NextResponse.json({
    success: true,
    message: 'Copy and paste this script into your browser console to clear cached data',
    script: clearScript.trim(),
    instructions: [
      '1. Open browser console (F12)',
      '2. Copy and paste the script below',
      '3. Press Enter to execute',
      '4. Page will reload automatically'
    ]
  })
} 