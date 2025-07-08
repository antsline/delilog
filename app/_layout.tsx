import { Stack } from 'expo-router';
import 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="tenko-before" 
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="tenko-after" 
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animationDuration: 300,
        }}
      />
      <Stack.Screen name="touch-test" />
      <Stack.Screen name="simple-test" />
      <Stack.Screen name="touch-fix-test" />
      <Stack.Screen name="basic-button-test" />
    </Stack>
  );
}