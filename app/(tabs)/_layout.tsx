import { Tabs } from 'expo-router';
import { colors } from '@/constants/colors';
import { Feather } from '@expo/vector-icons';
import { useNotificationNavigation } from '@/hooks/useNotificationNavigation';

// アイコンコンポーネント
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const color = focused ? colors.orange : colors.darkGray;
  
  const getIconName = () => {
    switch (name) {
      case 'home':
        return 'home';
      case 'records':
        return 'file-text';
      case 'pdf-export':
        return 'printer';
      case 'settings':
        return 'settings';
      default:
        return 'circle';
    }
  };
  
  return (
    <Feather 
      name={getIconName() as any}
      size={24}
      color={color}
    />
  );
};

export default function TabLayout() {
  // 通知タップ時のナビゲーション処理
  useNotificationNavigation();
  
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
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '記録一覧',
          tabBarIcon: ({ focused }) => <TabIcon name="records" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pdf-export"
        options={{
          title: 'PDF出力',
          tabBarIcon: ({ focused }) => <TabIcon name="pdf-export" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}