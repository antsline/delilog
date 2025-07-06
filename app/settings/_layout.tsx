import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.cream,
        },
        headerTintColor: colors.charcoal,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: '戻る',
      }}
    >
      <Stack.Screen
        name="vehicles"
        options={{
          title: '車両管理',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'プロフィール編集',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'アプリについて',
        }}
      />
    </Stack>
  );
}