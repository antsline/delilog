import { Tabs } from 'expo-router';
import { colors } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.beige,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.darkGray,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
        }}
      />
      <Tabs.Screen
        name="tenko-before"
        options={{
          href: null, // タブバーから除外
        }}
      />
      <Tabs.Screen
        name="tenko-after"
        options={{
          href: null, // タブバーから除外
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '記録一覧',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
        }}
      />
    </Tabs>
  );
}