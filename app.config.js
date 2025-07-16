import 'dotenv/config';

export default {
  expo: {
    name: "delilog",
    slug: "delilog",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#FFFCF2"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "jp.delilog.app",
      buildNumber: "1",
      infoPlist: {
        NSMicrophoneUsageDescription: "音声入力機能で特記事項を入力するためにマイクを使用します。",
        NSSpeechRecognitionUsageDescription: "音声入力機能で音声をテキストに変換するために使用します。",
        NSFaceIDUsageDescription: "このアプリはセキュアなログインのために Face ID を使用します。"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFCF2"
      },
      package: "jp.delilog.app",
      versionCode: 1,
      permissions: [
        "android.permission.RECORD_AUDIO"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#EB5E28",
          sounds: ["./assets/notification.wav"]
        }
      ],
      [
        "expo-local-authentication",
        {
          faceIDPermission: "このアプリはセキュアなログインのために Face ID を使用します。"
        }
      ],
      "expo-secure-store"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      // Supabase設定
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      
      // RevenueCat設定
      revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      revenueCatAndroidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      revenueCatEntitlementId: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'delilog_basic',
      revenueCatProductId: process.env.EXPO_PUBLIC_REVENUECAT_PRODUCT_ID,
      
      // App設定
      appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development',
      debugLogs: process.env.EXPO_PUBLIC_DEBUG_LOGS === 'true',
      
      // EAS設定
      eas: {
        projectId: "your-eas-project-id" // EAS Build使用時に設定
      }
    }
  }
};