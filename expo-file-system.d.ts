declare module 'expo-file-system' {
  export const documentDirectory: string | null
  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: string }
  ): Promise<void>
  // Add other functions as needed
}