export default ({ config }) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...config,
    name: "CCSA FIMS",
    slug: "ccsa-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    platforms: ["ios", "android"],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "ng.edu.cosmopolitan.fims",
      buildNumber: "1",
      icon: "./assets/icon.png",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app uses location to capture farmer coordinates during registration.",
        NSCameraUsageDescription: "This app uses camera to scan QR codes and take photos for farmer registration.",
        NSPhotoLibraryUsageDescription: "This app accesses photo library to select images for farmer profiles.",
        NSMicrophoneUsageDescription: "Allow $(PRODUCT_NAME) to access your microphone",
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "ng.edu.cosmopolitan.fims",
      versionCode: 1,
      icon: "./assets/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      // Fix for crashes
      softwareKeyboardLayoutMode: "pan",
      // Handle large assets properly
      allowBackup: false,
      // Fix memory issues - removed jsEngineSwitch as it's not valid
      // Permissions
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION", 
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "android.permission.CAMERA",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-font",
      [
        "expo-camera",
        {
          cameraPermission: "This app uses camera to scan QR codes and take photos for farmer registration."
        }
      ],
      [
        "expo-location", 
        {
          locationAlwaysAndWhenInUsePermission: "This app uses location to capture farmer coordinates during registration.",
          locationAlwaysPermission: "This app uses location to capture farmer coordinates during registration.",
          locationWhenInUsePermission: "This app uses location to capture farmer coordinates during registration."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "1deec560-5e59-4944-b0c4-7c9e028e7943"
      },
      // Environment-specific configuration
      // IMPORTANT: Use EXPO_PUBLIC_API_BASE_URL from EAS build environment
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "https://fims.cosmopolitan.edu.ng"
    },
    updates: {
      url: "https://u.expo.dev/ccsa-mobile-fims"
    },
    runtimeVersion: {
      policy: "sdkVersion"
    },
    owner: "doudgaya"
  };
};
