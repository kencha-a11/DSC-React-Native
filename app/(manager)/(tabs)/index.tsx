// app/(manager)/(tabs)/index.tsx
import DscToast from "@/components/common/DscToast";
import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardScreen() {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "warning" | "info"
  >("success");

  const showToast = (
    type: "success" | "error" | "warning" | "info",
    message: string,
  ) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Demo Buttons */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: "#34C759" }]}
              onPress={() =>
                showToast("success", "Dashboard loaded successfully!")
              }
            >
              <Text style={styles.demoButtonText}>Test</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          {/* Total Sales Card */}
          <View style={[styles.statCard, styles.salesCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total Sales</Text>
              <FontAwesome5 name="arrow-up" size={16} color="#34C759" />
            </View>
            <Text style={styles.salesAmount}>₱ 7,932.00</Text>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>↑ 16%</Text>
            </View>
          </View>

          {/* Total Items Sold Card */}
          <View style={[styles.statCard, styles.itemsCard]}>
            <Text style={styles.statLabel}>Total items sold</Text>
            <Text style={styles.itemsAmount}>392 pcs</Text>
          </View>
        </View>

        {/* Sales Trend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales trend</Text>
          <View style={styles.monthsContainer}>
            {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
              <View key={month} style={styles.monthItem}>
                <View style={styles.monthBar} />
                <Text style={styles.monthLabel}>{month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Selling Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top-selling items</Text>

          <View style={styles.topItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Souvenir</Text>
              <Text style={styles.itemSold}>130pcs sold</Text>
            </View>
            <View style={[styles.progressBar, { width: "65%" }]} />
          </View>

          <View style={styles.topItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Notebook</Text>
              <Text style={styles.itemSold}>110pcs sold</Text>
            </View>
            <View style={[styles.progressBar, { width: "55%" }]} />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Toast */}
      <DscToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
        showCloseButton={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },
  demoButtons: {
    flexDirection: "row",
  },
  demoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  demoButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  salesCard: {},
  itemsCard: {},
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  salesAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  itemsAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginTop: 8,
  },
  percentageBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  percentageText: {
    color: "#34C759",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 20,
  },
  monthsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  monthItem: {
    alignItems: "center",
    flex: 1,
  },
  monthBar: {
    width: "60%",
    height: 80,
    backgroundColor: "#ED277C",
    borderRadius: 8,
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 12,
    color: "#666",
  },
  topItem: {
    marginBottom: 20,
  },
  itemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  itemSold: {
    fontSize: 14,
    color: "#666",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#ED277C",
    borderRadius: 4,
  },
});
