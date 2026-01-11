// Add this method to EnhancedCVIntelligence class

extractBullets(cvText) {
  return cvText.split('\n')
    .filter(line => /^[\s]*[•\-\*\d+\.]/.test(line))
    .map(line => line.replace(/^[\s]*[•\-\*\d+\.]/, '').trim())
    .filter(line => line.length > 10);
}