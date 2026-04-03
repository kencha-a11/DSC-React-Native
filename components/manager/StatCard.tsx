// components/dashboard/StatCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  return (
    <LinearGradient
      colors={[color, `${color}CC`]}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statCardContent}>
        <View style={styles.statIconContainer}>
          <Ionicons name={icon as any} size={24} color="white" />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trend >= 0 ? 'trending-up' : 'trending-down'}
              size={12}
              color="white"
            />
            <Text style={styles.trendText}>{Math.abs(trend)}%</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  statCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardContent: {
    alignItems: 'flex-start',
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 4,
  },
});

export default StatCard;