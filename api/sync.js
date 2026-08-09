import { fetchProfile, fetchPostsWithInsights, fetchAccountInsights, fetchFollowerDemographics } from '../src/services/instagramApi.js';
import { getUserByIgId, upsertUser, saveSnapshot, upsertPostsAndInsights, upsertDemographics } from '../src/lib/db.js';

export default async function handler(req, res) {
  // 0. Only allow GET or POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Get the IG Token from Environment Variables
    const token = process.env.IG_ACCESS_TOKEN;
    if (!token) {
      console.error('Missing IG_ACCESS_TOKEN');
      return res.status(500).json({ error: 'Missing IG_ACCESS_TOKEN environment variable.' });
    }

    const IG_USER_ID = '17841410004708818'; // Hardcoded for this specific dashboard
    
    // 2. Fetch the user's UUID from Supabase using their hardcoded IG ID
    const user = await getUserByIgId(IG_USER_ID);
    if (!user) {
      console.error('User not found in Supabase for IG_USER_ID:', IG_USER_ID);
      return res.status(404).json({ error: 'User not found in Supabase.' });
    }
    const dbUserId = user.id;

    // 3. Run the exact same sync logic as the frontend refresh()
    console.log(`Starting background sync for user: ${dbUserId}`);
    
    const [profile, posts, insights, demographics] = await Promise.all([
      fetchProfile(token),
      fetchPostsWithInsights(token),
      fetchAccountInsights(token, 'day'),
      fetchFollowerDemographics(token),
    ]);

    // 4. Save to Supabase
    await upsertUser(profile, dbUserId);
    await saveSnapshot(dbUserId, profile, insights);
    await upsertPostsAndInsights(dbUserId, posts);
    await upsertDemographics(dbUserId, demographics);

    console.log('Background sync completed successfully!');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Background sync completed successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Background sync failed:', error);
    return res.status(500).json({ error: 'Background sync failed', details: error.message });
  }
}
