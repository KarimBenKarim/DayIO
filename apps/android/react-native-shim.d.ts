declare module 'react-native' {
  export const StyleSheet: any;
  export const Text: any;
  export const View: any;
  export const TextInput: any;
  export const TouchableOpacity: any;
  export const FlatList: any;
  export const SafeAreaView: any;
  export const StatusBar: any;
  export const ActivityIndicator: any;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}
