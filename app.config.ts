import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "academia",
  slug: "academia",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: "com.anisse3000.academia",
    infoPlist: {
      ...config.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
      NSFaceIDUsageDescription: "Academia utilise Face ID pour vous permettre de vous connecter rapidement et de manière sécurisée à votre compte.",
      FacebookAppID: "653735364141256",
      FacebookClientToken: "4a146c687260212ea9d812f5209cecc7",
      FacebookDisplayName: "AcademIA",
      LSApplicationQueriesSchemes: [
        "fbapi",
        "fb-messenger-share-api",
        "fbapi",
        "fb-messenger-share-api"
      ],
      NSUserTrackingUsageDescription: "Nous utilisons cette autorisation pour vous proposer une expérience personnalisée.",
      SKAdNetworkItems: [
        {
          SKAdNetworkIdentifier: "v9wttpbfk9.skadnetwork"
        },
        {
          SKAdNetworkIdentifier: "n38lu8286q.skadnetwork"
        }
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST
    },
    entitlements: {
      "com.apple.developer.networking.wifi-info": true
    }
  },
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    adaptiveIcon: {
      foregroundImage: "./assets/images/splash_screen_android.png",
      backgroundColor: "#ffffff"
    },
    package: "com.anisse3000.academia",
    permissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
      "android.permission.INTERNET",
      "com.google.android.gms.permission.AD_ID"
    ]
  },
  plugins: [
    "expo-router",
    [
      "expo-document-picker",
      {
        "iCloudContainerEnvironment": "Production"
      }
    ],
    [
      "expo-image-picker",
      {
        "photosPermission": "Nous avons besoin de votre permission pour utiliser la caméra.",
        "cameraPermission": "Autoriser $(PRODUCT_NAME) à ouvrir la caméra"
      }
    ],
    [
      "expo-splash-screen",
      {
        "enableFullScreenImage_legacy": true,
        "resizeMode": "contain",
        "ios": {
          "backgroundColor": "#ffffff",
          "image": "./assets/images/splash_icon.png"
        },
        "android": {
          "backgroundColor": "#ffffff",
          "image": "./assets/images/splash_screen_android.png",
          "imageWidth": 195
        }
      }
    ],
    [
      "expo-local-authentication",
      {
        "faceIDPermission": "Autoriser $(PRODUCT_NAME) à utiliser Face ID."
      }
    ],
    [
      "expo-notifications",
      {
        "icon": "./assets/images/icon.png",
        "color": "#ffffff",
        "defaultChannel": "default",
        "sounds": [
          "./assets/sounds/notif.wav"
        ],
        "enableBackgroundRemoteNotifications": false
      }
    ],
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": "ca-app-pub-9849575862637315~4909955983",
        "iosAppId": "ca-app-pub-9849575862637315~3948002761"
      }
    ],
    [
      "react-native-fbsdk-next",
      {
        "appID": "653735364141256",
        "clientToken": "4a146c687260212ea9d812f5209cecc7",
        "displayName": "AcademIA",
        "scheme": "fb653735364141256",
        "advertiserIDCollectionEnabled": false,
        "autoLogAppEventsEnabled": false,
        "isAutoInitEnabled": true,
        "iosUserTrackingPermission": "Nous utilisons cette autorisation pour vous proposer une expérience personnalisée."
      }
    ],
    "expo-tracking-transparency",
    [
      "expo-secure-store",
      {
        "configureAndroidBackup": true,
        "faceIDPermission": "Autoriser $(PRODUCT_NAME) à utiliser Face ID."
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: "05388435-4c2f-49e4-83a2-1ed0d62649b4"
    },
    EXPO_PUBLIC_REVENUECAT_API_KEY_IOS: "appl_YPDPIHytWWRxjTtvctxgrFmpmbB"
  },
  owner: "anisse3000",
  runtimeVersion: "1.0.0",
  updates: {
    url: "https://u.expo.dev/05388435-4c2f-49e4-83a2-1ed0d62649b4"
  }
}); 