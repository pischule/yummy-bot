export function orderByExample(array: string[], example: string[]): string[] {
  const indexMap = new Map();
  example.forEach((el, index) => {
    indexMap.set(el, index);
  });

  // Sort the array
  return array.sort((a, b) => {
    // Check if both elements are in the example list
    const indexA = indexMap.has(a) ? indexMap.get(a) : Infinity;
    const indexB = indexMap.has(b) ? indexMap.get(b) : Infinity;

    // Compare the indices
    return indexA - indexB;
  });
}
