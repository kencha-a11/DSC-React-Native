import { View, Text, Button } from "react-native";
import { useState } from "react";
import api from "@/api/axios";

const GetRequestHTTP = () => {
  const [message, setMessage] = useState("");

  const getData = async () => {
    try {
      const response = await api.get("/test");

      setMessage(response.data.message); // <-- drill into the actual string

      console.log("[API RESPONSE]", JSON.stringify(response.data));
    } catch (error: any) {
      console.log("[API ERROR]", error.response?.data || error.message);

      setMessage("Failed to fetch data");
    }
  };

  return (
    <View>
      <Text>GetRequestHTTP</Text>
      <Button title="GET from Laravel" onPress={getData} />
      <Text style={{ marginTop: 20 }}>{message}</Text>
    </View>
  );
};

export default GetRequestHTTP;
