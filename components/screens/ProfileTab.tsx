// app/(cashier)/(tabs)/profile.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import Header from "@/components/layout/Header";
import LogoutButton from "@/components/common/LogoutButton";
import { router, useSegments } from "expo-router";
import { getUserProfile, UserProfile } from "@/services/profileService"; // ✅ Import from new service

export default function ProfileTab() {
    const { user: authUser } = useAuth();
    const { permissions } = usePermissions();
    const insets = useSafeAreaInsets();
    const segments = useSegments();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const loadFullProfile = async () => {
            try {
                // ✅ Using the new profileService
                const fullUser = await getUserProfile();
                setProfile(fullUser);
            } catch (error) {
                console.error("Failed to load full profile:", error);
                // Fallback to auth user if API fails
                if (authUser) {
                    setProfile(authUser as UserProfile);
                }
            } finally {
                setLoading(false);
            }
        };

        if (authUser) {
            loadFullProfile();
        } else {
            setLoading(false);
            setProfile(null);
        }
    }, [authUser]);

    const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 60 : 80;
    const bottomPadding = TAB_BAR_HEIGHT + insets.bottom + 20;

    // Use profile for display (contains email/phone), fallback to authUser
    const displayUser = profile || authUser;

    const enabledPermissions = Object.values(permissions).filter(Boolean).length;
    const totalPermissions = Object.keys(permissions).length;

    const getFullName = () => {
        if (displayUser?.first_name && displayUser?.last_name) {
            return `${displayUser.first_name} ${displayUser.last_name}`;
        }
        return "Cashier User";
    };

    const getInitials = () => {
        if (!displayUser?.first_name && !displayUser?.last_name) {
            return "U";
        }
        const first = displayUser?.first_name?.charAt(0) || "";
        const last = displayUser?.last_name?.charAt(0) || "";
        return (first + last).toUpperCase();
    };

    const rawRole = displayUser?.role?.toLowerCase().replace(/\s/g, "") || "cashier";
    const displayRole = displayUser?.role
        ? displayUser.role.charAt(0).toUpperCase() + displayUser.role.slice(1)
        : "Cashier";

    const isSuperadmin = rawRole === "superadmin";
    const isManager = rawRole === "manager";
    const isCashier = rawRole === "cashier";

    // Determine current view from route segments
    let currentView = "";
    for (const segment of segments) {
        const seg = String(segment);
        if (seg === "(manager)" || seg === "manager") {
            currentView = "manager";
            break;
        } else if (seg === "(cashier)" || seg === "cashier") {
            currentView = "cashier";
            break;
        } else if (seg === "(superadmin)" || seg === "superadmin") {
            currentView = "superadmin";
            break;
        }
    }

    // Fallback: if not detected, use user's actual role
    if (!currentView) {
        currentView = rawRole;
    }

    // Determine allowed views based on user's actual role
    let allowedViews: string[] = [];
    if (isSuperadmin) {
        allowedViews = ["superadmin", "manager", "cashier"];
    } else if (isManager) {
        allowedViews = ["manager", "cashier"];
    } else {
        allowedViews = [];
    }

    // Show buttons for roles in allowedViews EXCEPT the current view
    const viewsToDisplay = allowedViews.filter((v) => v !== currentView);

    const handleSwitchRole = (targetRole: string) => {
        if (targetRole === "cashier") {
            router.replace("/(cashier)/(tabs)" as any);
        } else if (targetRole === "manager") {
            router.replace("/(manager)/(tabs)" as any);
        } else if (targetRole === "superadmin") {
            router.replace("/(superadmin)/(tabs)" as any);
        }
    };

    const getRoleDisplayName = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const getRoleIcon = (role: string) => {
        switch(role) {
            case "superadmin":
                return "shield-outline";
            case "manager":
                return "briefcase-outline";
            case "cashier":
                return "cart-outline";
            default:
                return "person-outline";
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#ED277C" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header
                title="Profile"
                showBackButton={false}
                backgroundColor="#fff"
                titleColor="#333"
                rightComponent={<View style={styles.placeholder} />}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: bottomPadding }}
            >
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials()}</Text>
                        </View>
                    </View>
                    <Text style={styles.userName}>{getFullName()}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{displayRole}</Text>
                    </View>
                </View>

                {/* Contact Info Cards */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                        <Ionicons name="mail-outline" size={24} color="#ED277C" />
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {displayUser?.email || "No email"}
                        </Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Ionicons name="call-outline" size={24} color="#ED277C" />
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {displayUser?.phone_number || "No phone"}
                        </Text>
                    </View>
                </View>

                {/* Permissions Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#ED277C" />
                        <Text style={styles.sectionTitle}>Permissions</Text>
                    </View>
                    <View style={styles.permissionSummary}>
                        <Text style={styles.permissionCount}>
                            {enabledPermissions} / {totalPermissions}
                        </Text>
                        <Text style={styles.permissionLabel}>enabled</Text>
                    </View>
                    <View style={styles.permissionBar}>
                        <View
                            style={[
                                styles.permissionProgress,
                                { width: `${totalPermissions > 0 ? (enabledPermissions / totalPermissions) * 100 : 0}%` },
                            ]}
                        />
                    </View>
                </View>

                {/* Switch Role Section */}
                {viewsToDisplay.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="swap-horizontal-outline" size={20} color="#ED277C" />
                            <Text style={styles.sectionTitle}>Switch Role View</Text>
                        </View>
                        <View style={styles.roleActions}>
                            {viewsToDisplay.includes("superadmin") && (
                                <TouchableOpacity
                                    style={styles.switchButton}
                                    onPress={() => handleSwitchRole("superadmin")}
                                >
                                    <Ionicons name={getRoleIcon("superadmin")} size={20} color="#fff" />
                                    <Text style={styles.switchButtonText}>
                                        Switch to {getRoleDisplayName("superadmin")}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {viewsToDisplay.includes("manager") && (
                                <TouchableOpacity
                                    style={styles.switchButton}
                                    onPress={() => handleSwitchRole("manager")}
                                >
                                    <Ionicons name={getRoleIcon("manager")} size={20} color="#fff" />
                                    <Text style={styles.switchButtonText}>
                                        Switch to {getRoleDisplayName("manager")}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {viewsToDisplay.includes("cashier") && (
                                <TouchableOpacity
                                    style={styles.switchButton}
                                    onPress={() => handleSwitchRole("cashier")}
                                >
                                    <Ionicons name={getRoleIcon("cashier")} size={20} color="#fff" />
                                    <Text style={styles.switchButtonText}>
                                        Switch to {getRoleDisplayName("cashier")}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Account Details */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle-outline" size={20} color="#ED277C" />
                        <Text style={styles.sectionTitle}>Account Details</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoRowLabel}>First Name</Text>
                        <Text style={styles.infoRowValue}>{displayUser?.first_name || "N/A"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoRowLabel}>Last Name</Text>
                        <Text style={styles.infoRowValue}>{displayUser?.last_name || "N/A"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoRowLabel}>Role</Text>
                        <Text style={styles.infoRowValue}>{displayRole}</Text>
                    </View>
                    {displayUser?.email && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoRowLabel}>Email</Text>
                            <Text style={styles.infoRowValue}>{displayUser.email}</Text>
                        </View>
                    )}
                    {displayUser?.phone_number && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoRowLabel}>Phone</Text>
                            <Text style={styles.infoRowValue}>{displayUser.phone_number}</Text>
                        </View>
                    )}
                </View>

                <LogoutButton />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
    },
    placeholder: {
        width: 24,
        height: 24,
    },
    profileCard: {
        backgroundColor: "#fff",
        alignItems: "center",
        paddingVertical: 24,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarContainer: {
        marginBottom: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#ED277C",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "bold",
    },
    userName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 6,
    },
    roleBadge: {
        backgroundColor: "#ED277C10",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        color: "#ED277C",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    infoGrid: {
        flexDirection: "row",
        gap: 12,
        marginHorizontal: 20,
        marginTop: 20,
    },
    infoCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    infoLabel: {
        fontSize: 12,
        color: "#999",
        marginTop: 6,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: "600",
        color: "#333",
    },
    section: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    permissionSummary: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
        marginBottom: 8,
    },
    permissionCount: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#ED277C",
    },
    permissionLabel: {
        fontSize: 14,
        color: "#666",
    },
    permissionBar: {
        height: 8,
        backgroundColor: "#f0f0f0",
        borderRadius: 4,
        overflow: "hidden",
    },
    permissionProgress: {
        height: "100%",
        backgroundColor: "#ED277C",
        borderRadius: 4,
    },
    roleActions: {
        gap: 10,
        marginTop: 8,
    },
    switchButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ED277C",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    switchButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    infoRowLabel: {
        fontSize: 14,
        color: "#666",
    },
    infoRowValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
});