import { SafeAreaView } from "react-native-safe-area-context";
import WelcomeScreen from "@/components/welcome-screen";
import GetRequestHTTP from "@/components/test/get-request-http";

// File tracking
console.log('(root)/(tabs)/index.tsx')

export default function Index() {


  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <WelcomeScreen/>
      <GetRequestHTTP/>
    </SafeAreaView>
  );
}
