export async function fetchOptimizerRecommendations() {
  const response = await fetch('/api/optimizer/recommendations');
  return response.json();
}
