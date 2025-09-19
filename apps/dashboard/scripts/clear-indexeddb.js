// Clear IndexedDB script for development
// Run this in the browser console if you encounter version conflicts

console.log('🧹 Clearing IndexedDB...');

// Clear the RecordingChunks database
const deleteRequest = indexedDB.deleteDatabase('RecordingChunks');

deleteRequest.onsuccess = () => {
  console.log('✅ RecordingChunks database deleted successfully');
  console.log('🔄 Please refresh the page to reinitialize the database');
};

deleteRequest.onerror = () => {
  console.error('❌ Failed to delete RecordingChunks database');
};

deleteRequest.onblocked = () => {
  console.warn('⚠️ Database deletion blocked - please close other tabs and try again');
};

// Also clear any other related databases
const databases = ['RecordingChunks', 'chunk-storage', 'recording-chunks'];

databases.forEach(dbName => {
  const request = indexedDB.deleteDatabase(dbName);
  request.onsuccess = () => console.log(`✅ ${dbName} deleted`);
  request.onerror = () => console.log(`ℹ️ ${dbName} not found or couldn't be deleted`);
});
