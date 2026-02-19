import { Link } from "expo-router";
import { Text, View } from "react-native";
// File tracking
console.log("components/welcome-screen.tsx");

const WelcomeScreen = () => {
  return (
    <View
      style={
        {
          // flex: 1,
          // justifyContent: "center",
          // alignItems: "center",
        }
      }
    >
      <Text className="font-bold text-lg my-10">Welcom to DSC</Text>

      <View className="items-center justify-center bg-blue-500">
        <Text className="text-white text-xl font-bold">NativeWind OK</Text>
      </View>

      <Link href={"/(auth)/pincode-login-screen"}>Sign In</Link>
      {/* <Link href={"/explore"}>explore</Link> */}
      {/* <Link href={"/profile"}>profile</Link> */}
      <Link
        href={{
          pathname: "/properties/[id]",
          params: { id: "1" },
        }}
      >
        properties
      </Link>
      {/* Navigates to the dynamic 'properties' route, passing '1' as the id parameter. */}
      <Text className="font-lato text-lg">Product Name</Text>
      <Text className="font-latoBold text-lg">Bold Product Name</Text>
      <Text className="font-robotoMono text-base">SKU: 12345</Text>
      <Text className="font-robotoMonoBold text-base">Bold SKU</Text>
    </View>
  );
};

export default WelcomeScreen;
