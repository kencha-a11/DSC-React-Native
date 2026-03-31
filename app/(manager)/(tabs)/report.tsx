// ReportScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const { width: screenWidth } = Dimensions.get('window');

// ==================== TYPES ====================

// KRI - Key Result Indicators (Top 10%)
interface KRI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
  category: 'financial' | 'operational' | 'customer';
  history: { period: string; value: number }[];
}

// RI & PI - Result Indicators & Performance Indicators (Middle 80%)
interface RIPerformanceMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  formula?: string;
  benchmark?: string;
  history: { period: string; value: number }[];
}

// KPI - Winning KPIs (Top 10%)
interface WinningKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  achievement: number;
  trend: number;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
  owner: string;
  dueDate: string;
  progress: number;
  history: { period: string; value: number }[];
}

// Report Configuration
interface ReportConfig {
  dateRange: {
    start: Date;
    end: Date;
  };
  includeKRI: boolean;
  includeRIPI: boolean;
  includeKPIs: boolean;
  includeCharts: boolean;
  format: 'pdf' | 'csv' | 'json';
}

// Report Summary
interface ReportSummary {
  totalMetrics: number;
  excellentCount: number;
  goodCount: number;
  warningCount: number;
  criticalCount: number;
  topPerforming: string[];
  needsAttention: string[];
  overallScore: number;
}

// ==================== MOCK DATA ====================

const generateMockKRIData = (): KRI[] => {
  return [
    {
      id: 'kri_1',
      name: 'Annual Recurring Revenue',
      value: 1850000,
      target: 2000000,
      unit: '$',
      trend: 12.5,
      status: 'good',
      description: 'Predictable revenue from ongoing operations',
      category: 'financial',
      history: [
        { period: 'Jan', value: 1500000 },
        { period: 'Feb', value: 1620000 },
        { period: 'Mar', value: 1750000 },
        { period: 'Apr', value: 1850000 },
      ],
    },
    {
      id: 'kri_2',
      name: 'Gross Profit Margin',
      value: 42.5,
      target: 45,
      unit: '%',
      trend: 3.2,
      status: 'warning',
      description: 'Profitability after cost of goods sold',
      category: 'financial',
      history: [
        { period: 'Jan', value: 41.2 },
        { period: 'Feb', value: 41.8 },
        { period: 'Mar', value: 42.1 },
        { period: 'Apr', value: 42.5 },
      ],
    },
    {
      id: 'kri_3',
      name: 'Customer Lifetime Value',
      value: 1250,
      target: 1500,
      unit: '$',
      trend: 8.7,
      status: 'good',
      description: 'Average revenue per customer over lifetime',
      category: 'customer',
      history: [
        { period: 'Jan', value: 1100 },
        { period: 'Feb', value: 1150 },
        { period: 'Mar', value: 1200 },
        { period: 'Apr', value: 1250 },
      ],
    },
    {
      id: 'kri_4',
      name: 'Market Share',
      value: 15.3,
      target: 20,
      unit: '%',
      trend: 2.1,
      status: 'excellent',
      description: 'Percentage of total market captured',
      category: 'operational',
      history: [
        { period: 'Jan', value: 14.5 },
        { period: 'Feb', value: 14.8 },
        { period: 'Mar', value: 15.1 },
        { period: 'Apr', value: 15.3 },
      ],
    },
    {
      id: 'kri_5',
      name: 'Inventory Turnover Ratio',
      value: 6.8,
      target: 8,
      unit: 'x',
      trend: -1.2,
      status: 'critical',
      description: 'Times inventory sold and replaced per year',
      category: 'operational',
      history: [
        { period: 'Jan', value: 7.2 },
        { period: 'Feb', value: 7.0 },
        { period: 'Mar', value: 6.9 },
        { period: 'Apr', value: 6.8 },
      ],
    },
  ];
};

const generateMockRIPIData = (): RIPerformanceMetric[] => {
  return [
    {
      id: 'ri_1',
      name: 'Daily Sales Average',
      category: 'Sales Performance',
      value: 5230,
      target: 6000,
      unit: '$',
      trend: 4.2,
      status: 'good',
      formula: 'Total Sales / Number of Days',
      benchmark: 'Industry Avg: $5,000',
      history: [
        { period: 'Week 1', value: 4800 },
        { period: 'Week 2', value: 4950 },
        { period: 'Week 3', value: 5100 },
        { period: 'Week 4', value: 5230 },
      ],
    },
    {
      id: 'ri_2',
      name: 'Average Transaction Value',
      category: 'Sales Performance',
      value: 245,
      target: 280,
      unit: '$',
      trend: 2.8,
      status: 'good',
      formula: 'Total Revenue / Total Transactions',
      benchmark: 'Industry Avg: $220',
      history: [
        { period: 'Week 1', value: 235 },
        { period: 'Week 2', value: 238 },
        { period: 'Week 3', value: 242 },
        { period: 'Week 4', value: 245 },
      ],
    },
    {
      id: 'ri_3',
      name: 'Conversion Rate',
      category: 'Sales Performance',
      value: 68.5,
      target: 75,
      unit: '%',
      trend: -3.2,
      status: 'warning',
      formula: '(Total Sales / Total Visitors) * 100',
      benchmark: 'Industry Avg: 65%',
      history: [
        { period: 'Week 1', value: 71 },
        { period: 'Week 2', value: 70 },
        { period: 'Week 3', value: 69 },
        { period: 'Week 4', value: 68.5 },
      ],
    },
    {
      id: 'ri_4',
      name: 'Order Fulfillment Time',
      category: 'Operational Efficiency',
      value: 24,
      target: 48,
      unit: 'hours',
      trend: -15.5,
      status: 'excellent',
      formula: 'Average time from order to delivery',
      benchmark: 'Industry Avg: 36 hrs',
      history: [
        { period: 'Week 1', value: 32 },
        { period: 'Week 2', value: 28 },
        { period: 'Week 3', value: 26 },
        { period: 'Week 4', value: 24 },
      ],
    },
    {
      id: 'ri_5',
      name: 'Staff Productivity',
      category: 'Operational Efficiency',
      value: 1250,
      target: 1000,
      unit: '$/employee',
      trend: 8.3,
      status: 'excellent',
      formula: 'Total Revenue / Active Employees',
      benchmark: 'Industry Avg: $1,100',
      history: [
        { period: 'Week 1', value: 1150 },
        { period: 'Week 2', value: 1180 },
        { period: 'Week 3', value: 1220 },
        { period: 'Week 4', value: 1250 },
      ],
    },
    {
      id: 'ri_6',
      name: 'Customer Satisfaction Score',
      category: 'Customer Satisfaction',
      value: 4.2,
      target: 4.5,
      unit: '/5',
      trend: 0.1,
      status: 'good',
      formula: 'Average customer rating',
      benchmark: 'Industry Avg: 4.0',
      history: [
        { period: 'Week 1', value: 4.1 },
        { period: 'Week 2', value: 4.15 },
        { period: 'Week 3', value: 4.18 },
        { period: 'Week 4', value: 4.2 },
      ],
    },
  ];
};

const generateMockKPIData = (): WinningKPI[] => {
  return [
    {
      id: 'kpi_1',
      name: 'Same-Store Sales Growth',
      value: 18.5,
      target: 15,
      unit: '%',
      achievement: 123,
      trend: 5.2,
      priority: 'high',
      actionItems: ['Expand premium product line', 'Implement loyalty program', 'Launch targeted marketing campaign'],
      owner: 'Sales Director',
      dueDate: '2025-06-30',
      progress: 85,
      history: [
        { period: 'Jan', value: 15 },
        { period: 'Feb', value: 16 },
        { period: 'Mar', value: 17.2 },
        { period: 'Apr', value: 18.5 },
      ],
    },
    {
      id: 'kpi_2',
      name: 'Customer Acquisition Cost',
      value: 45,
      target: 40,
      unit: '$',
      achievement: 88,
      trend: -8.5,
      priority: 'high',
      actionItems: ['Optimize marketing channels', 'Referral program implementation', 'Reduce ad spend waste'],
      owner: 'Marketing Manager',
      dueDate: '2025-05-15',
      progress: 70,
      history: [
        { period: 'Jan', value: 52 },
        { period: 'Feb', value: 49 },
        { period: 'Mar', value: 47 },
        { period: 'Apr', value: 45 },
      ],
    },
    {
      id: 'kpi_3',
      name: 'Employee Satisfaction Index',
      value: 85,
      target: 90,
      unit: 'points',
      achievement: 94,
      trend: 3.2,
      priority: 'medium',
      actionItems: ['Staff training programs', 'Recognition initiatives', 'Flexible work arrangements'],
      owner: 'HR Director',
      dueDate: '2025-07-31',
      progress: 92,
      history: [
        { period: 'Jan', value: 82 },
        { period: 'Feb', value: 83 },
        { period: 'Mar', value: 84 },
        { period: 'Apr', value: 85 },
      ],
    },
  ];
};

// ==================== COMPONENTS ====================

// Date Range Picker Component
const DateRangePicker: React.FC<{
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  return (
    <View style={styles.dateRangeContainer}>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowStartPicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
        <Text style={styles.datePickerText}>
          Start: {startDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      <Text style={styles.dateRangeSeparator}>to</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowEndPicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
        <Text style={styles.datePickerText}>
          End: {endDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Format Selector Component
const FormatSelector: React.FC<{
  selectedFormat: 'pdf' | 'csv' | 'json';
  onFormatChange: (format: 'pdf' | 'csv' | 'json') => void;
}> = ({ selectedFormat, onFormatChange }) => {
  const formats = [
    { id: 'pdf', label: 'PDF', icon: 'document-text' },
    { id: 'csv', label: 'CSV', icon: 'grid' },
    { id: 'json', label: 'JSON', icon: 'code' },
  ] as const;

  return (
    <View style={styles.formatContainer}>
      <Text style={styles.formatLabel}>Export Format:</Text>
      <View style={styles.formatButtons}>
        {formats.map((format) => (
          <TouchableOpacity
            key={format.id}
            style={[
              styles.formatButton,
              selectedFormat === format.id && styles.formatButtonActive,
            ]}
            onPress={() => onFormatChange(format.id)}
          >
            <Ionicons
              name={format.icon as any}
              size={20}
              color={selectedFormat === format.id ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[
                styles.formatButtonText,
                selectedFormat === format.id && styles.formatButtonTextActive,
              ]}
            >
              {format.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Section Selector Component
const SectionSelector: React.FC<{
  includeKRI: boolean;
  includeRIPI: boolean;
  includeKPIs: boolean;
  onToggle: (section: 'kri' | 'ripi' | 'kpis') => void;
}> = ({ includeKRI, includeRIPI, includeKPIs, onToggle }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionLabel}>Include Sections:</Text>
      <View style={styles.sectionButtons}>
        <TouchableOpacity
          style={[styles.sectionButton, includeKRI && styles.sectionButtonActive]}
          onPress={() => onToggle('kri')}
        >
          <View style={[styles.sectionBadge, styles.badgeKRI]}>
            <Text style={styles.sectionBadgeText}>10%</Text>
          </View>
          <Text style={[styles.sectionButtonText, includeKRI && styles.sectionButtonTextActive]}>
            KRIs
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.sectionButton, includeRIPI && styles.sectionButtonActive]}
          onPress={() => onToggle('ripi')}
        >
          <View style={[styles.sectionBadge, styles.badgeRIPI]}>
            <Text style={styles.sectionBadgeText}>80%</Text>
          </View>
          <Text style={[styles.sectionButtonText, includeRIPI && styles.sectionButtonTextActive]}>
            RIs & PIs
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.sectionButton, includeKPIs && styles.sectionButtonActive]}
          onPress={() => onToggle('kpis')}
        >
          <View style={[styles.sectionBadge, styles.badgeKPI]}>
            <Text style={styles.sectionBadgeText}>10%</Text>
          </View>
          <Text style={[styles.sectionButtonText, includeKPIs && styles.sectionButtonTextActive]}>
            Winning KPIs
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Report Preview Component
const ReportPreview: React.FC<{
  kris: KRI[];
  ripi: RIPerformanceMetric[];
  kpis: WinningKPI[];
  includeKRI: boolean;
  includeRIPI: boolean;
  includeKPIs: boolean;
  summary: ReportSummary;
}> = ({ kris, ripi, kpis, includeKRI, includeRIPI, includeKPIs, summary }) => {
  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewTitle}>Report Preview</Text>
      
      {/* Summary Section */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Executive Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{summary.overallScore}%</Text>
            <Text style={styles.summaryStatLabel}>Overall Score</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{summary.totalMetrics}</Text>
            <Text style={styles.summaryStatLabel}>Total Metrics</Text>
          </View>
        </View>
        
        <View style={styles.summaryStatus}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusText}>Excellent: {summary.excellentCount}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.statusText}>Good: {summary.goodCount}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.statusText}>Warning: {summary.warningCount}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.statusText}>Critical: {summary.criticalCount}</Text>
          </View>
        </View>
        
        {summary.topPerforming.length > 0 && (
          <View style={styles.topPerforming}>
            <Text style={styles.topPerformingTitle}>🏆 Top Performing Metrics:</Text>
            {summary.topPerforming.map((item, idx) => (
              <Text key={idx} style={styles.topPerformingItem}>• {item}</Text>
            ))}
          </View>
        )}
        
        {summary.needsAttention.length > 0 && (
          <View style={styles.needsAttention}>
            <Text style={styles.needsAttentionTitle}>⚠️ Needs Attention:</Text>
            {summary.needsAttention.map((item, idx) => (
              <Text key={idx} style={styles.needsAttentionItem}>• {item}</Text>
            ))}
          </View>
        )}
      </View>
      
      {/* KRI Section Preview */}
      {includeKRI && kris.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Key Result Indicators (KRIs) - Top 10%</Text>
          {kris.slice(0, 3).map((kri) => (
            <View key={kri.id} style={styles.previewItem}>
              <View style={styles.previewItemHeader}>
                <Text style={styles.previewItemName}>{kri.name}</Text>
                <Text style={[
                  styles.previewItemStatus,
                  kri.status === 'excellent' && styles.statusExcellent,
                  kri.status === 'good' && styles.statusGood,
                  kri.status === 'warning' && styles.statusWarning,
                  kri.status === 'critical' && styles.statusCritical,
                ]}>
                  {kri.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.previewItemValue}>
                {kri.unit === '$' ? `$${kri.value.toLocaleString()}` : `${kri.value}${kri.unit}`}
                {' '}/ {kri.unit === '$' ? `$${kri.target.toLocaleString()}` : `${kri.target}${kri.unit}`}
              </Text>
              <Text style={styles.previewItemTrend}>
                Trend: {kri.trend > 0 ? '+' : ''}{kri.trend}%
              </Text>
            </View>
          ))}
          {kris.length > 3 && (
            <Text style={styles.previewMore}>+{kris.length - 3} more metrics</Text>
          )}
        </View>
      )}
      
      {/* RI/PI Section Preview */}
      {includeRIPI && ripi.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Result & Performance Indicators - Middle 80%</Text>
          {ripi.slice(0, 3).map((metric) => (
            <View key={metric.id} style={styles.previewItem}>
              <View style={styles.previewItemHeader}>
                <Text style={styles.previewItemName}>{metric.name}</Text>
                <Text style={styles.previewItemCategory}>{metric.category}</Text>
              </View>
              <Text style={styles.previewItemValue}>
                {metric.unit === '$' ? `$${metric.value.toLocaleString()}` : `${metric.value}${metric.unit}`}
                {' '}/ {metric.unit === '$' ? `$${metric.target}` : `${metric.target}${metric.unit}`}
              </Text>
              <Text style={styles.previewItemTrend}>
                Trend: {metric.trend > 0 ? '+' : ''}{metric.trend}%
              </Text>
            </View>
          ))}
          {ripi.length > 3 && (
            <Text style={styles.previewMore}>+{ripi.length - 3} more metrics</Text>
          )}
        </View>
      )}
      
      {/* Winning KPI Section Preview */}
      {includeKPIs && kpis.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Winning KPIs - Top 10%</Text>
          {kpis.slice(0, 3).map((kpi) => (
            <View key={kpi.id} style={styles.previewItem}>
              <View style={styles.previewItemHeader}>
                <Text style={styles.previewItemName}>{kpi.name}</Text>
                <View style={[
                  styles.priorityBadge,
                  kpi.priority === 'high' && styles.priorityHigh,
                  kpi.priority === 'medium' && styles.priorityMedium,
                  kpi.priority === 'low' && styles.priorityLow,
                ]}>
                  <Text style={styles.priorityText}>{kpi.priority.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.previewItemValue}>
                {kpi.value}{kpi.unit} / {kpi.target}{kpi.unit}
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${kpi.achievement}%` }]} />
              </View>
              <Text style={styles.previewItemTrend}>
                Achievement: {kpi.achievement}% ({kpi.trend > 0 ? '+' : ''}{kpi.trend}%)
              </Text>
            </View>
          ))}
          {kpis.length > 3 && (
            <Text style={styles.previewMore}>+{kpis.length - 3} more KPIs</Text>
          )}
        </View>
      )}
    </View>
  );
};

// Export Modal Component
const ExportModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onExport: () => void;
  isExporting: boolean;
}> = ({ visible, onClose, onExport, isExporting }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Export Report</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Ionicons name="document-text-outline" size={48} color="#3B82F6" />
            <Text style={styles.modalText}>
              Your report is being generated. This may take a few moments.
            </Text>
            {isExporting ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : (
              <TouchableOpacity style={styles.modalButton} onPress={onExport}>
                <Text style={styles.modalButtonText}>Start Export</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ==================== MAIN REPORT SCREEN ====================

const ReportScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kris, setKris] = useState<KRI[]>([]);
  const [ripi, setRipi] = useState<RIPerformanceMetric[]>([]);
  const [kpis, setKpis] = useState<WinningKPI[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    totalMetrics: 0,
    excellentCount: 0,
    goodCount: 0,
    warningCount: 0,
    criticalCount: 0,
    topPerforming: [],
    needsAttention: [],
    overallScore: 0,
  });
  
  const [config, setConfig] = useState<ReportConfig>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    includeKRI: true,
    includeRIPI: true,
    includeKPIs: true,
    includeCharts: true,
    format: 'pdf',
  });
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReportData = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const kriData = generateMockKRIData();
      const ripiData = generateMockRIPIData();
      const kpiData = generateMockKPIData();
      
      setKris(kriData);
      setRipi(ripiData);
      setKpis(kpiData);
      
      // Calculate summary
      const allMetrics = [
        ...kriData.map(k => ({ name: k.name, status: k.status, value: k.value, target: k.target })),
        ...ripiData.map(r => ({ name: r.name, status: r.status, value: r.value, target: r.target })),
        ...kpiData.map(k => ({ 
          name: k.name, 
          status: k.achievement >= 100 ? 'excellent' : k.achievement >= 80 ? 'good' : k.achievement >= 60 ? 'warning' : 'critical' as 'excellent' | 'good' | 'warning' | 'critical', 
          value: k.achievement, 
          target: 100 
        })),
      ];
      
      const excellentCount = allMetrics.filter(m => m.status === 'excellent').length;
      const goodCount = allMetrics.filter(m => m.status === 'good').length;
      const warningCount = allMetrics.filter(m => m.status === 'warning').length;
      const criticalCount = allMetrics.filter(m => m.status === 'critical').length;
      
      const topPerforming = allMetrics
        .filter(m => m.status === 'excellent')
        .slice(0, 5)
        .map(m => m.name);
      
      const needsAttention = allMetrics
        .filter(m => m.status === 'critical')
        .slice(0, 5)
        .map(m => m.name);
      
      const overallScore = Math.round(
        (excellentCount * 100 + goodCount * 75 + warningCount * 40) / allMetrics.length
      );
      
      setSummary({
        totalMetrics: allMetrics.length,
        excellentCount,
        goodCount,
        warningCount,
        criticalCount,
        topPerforming,
        needsAttention,
        overallScore,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const generateCSV = () => {
    let csv = '10/80/10 Performance Report\n\n';
    csv += `Generated: ${new Date().toLocaleString()}\n`;
    csv += `Date Range: ${config.dateRange.start.toLocaleDateString()} - ${config.dateRange.end.toLocaleDateString()}\n\n`;
    
    if (config.includeKRI && kris.length > 0) {
      csv += 'KEY RESULT INDICATORS (KRIs) - Top 10%\n';
      csv += 'Name,Value,Target,Status,Trend\n';
      kris.forEach(k => {
        csv += `"${k.name}",${k.value},${k.target},${k.status},${k.trend}%\n`;
      });
      csv += '\n';
    }
    
    if (config.includeRIPI && ripi.length > 0) {
      csv += 'RESULT & PERFORMANCE INDICATORS (RIs & PIs) - Middle 80%\n';
      csv += 'Name,Category,Value,Target,Status,Trend\n';
      ripi.forEach(r => {
        csv += `"${r.name}",${r.category},${r.value},${r.target},${r.status},${r.trend}%\n`;
      });
      csv += '\n';
    }
    
    if (config.includeKPIs && kpis.length > 0) {
      csv += 'WINNING KEY PERFORMANCE INDICATORS (KPIs) - Top 10%\n';
      csv += 'Name,Value,Target,Achievement,Priority,Trend\n';
      kpis.forEach(k => {
        csv += `"${k.name}",${k.value},${k.target},${k.achievement}%,${k.priority},${k.trend}%\n`;
      });
      csv += '\n';
    }
    
    csv += `SUMMARY\n`;
    csv += `Overall Score,${summary.overallScore}%\n`;
    csv += `Total Metrics,${summary.totalMetrics}\n`;
    csv += `Excellent,${summary.excellentCount}\n`;
    csv += `Good,${summary.goodCount}\n`;
    csv += `Warning,${summary.warningCount}\n`;
    csv += `Critical,${summary.criticalCount}\n`;
    
    return csv;
  };

  const generateJSON = () => {
    const report = {
      metadata: {
        generated: new Date().toISOString(),
        dateRange: {
          start: config.dateRange.start.toISOString(),
          end: config.dateRange.end.toISOString(),
        },
        framework: '10/80/10 Rule',
      },
      summary: summary,
      kris: config.includeKRI ? kris : [],
      ripi: config.includeRIPI ? ripi : [],
      kpis: config.includeKPIs ? kpis : [],
    };
    return JSON.stringify(report, null, 2);
  };

  const generateHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>10/80/10 Performance Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 40px;
            color: #1F2937;
            line-height: 1.6;
          }
          h1 {
            color: #3B82F6;
            border-bottom: 2px solid #3B82F6;
            padding-bottom: 10px;
          }
          h2 {
            color: #6B7280;
            margin-top: 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .summary {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
          }
          .stat {
            text-align: center;
          }
          .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #3B82F6;
          }
          .stat-label {
            font-size: 12px;
            color: #6B7280;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #E5E7EB;
            padding: 12px;
            text-align: left;
          }
          th {
            background: #F9FAFB;
            font-weight: 600;
          }
          .status-excellent { color: #10B981; font-weight: bold; }
          .status-good { color: #3B82F6; font-weight: bold; }
          .status-warning { color: #F59E0B; font-weight: bold; }
          .status-critical { color: #EF4444; font-weight: bold; }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
          }
          .badge-kri { background: #3B82F620; color: #3B82F6; }
          .badge-ripi { background: #8B5CF620; color: #8B5CF6; }
          .badge-kpi { background: #F59E0B20; color: #F59E0B; }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #9CA3AF;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>10/80/10 Performance Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Period: ${config.dateRange.start.toLocaleDateString()} - ${config.dateRange.end.toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <h2>Executive Summary</h2>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${summary.overallScore}%</div>
              <div class="stat-label">Overall Score</div>
            </div>
            <div class="stat">
              <div class="stat-value">${summary.totalMetrics}</div>
              <div class="stat-label">Total Metrics</div>
            </div>
          </div>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${summary.excellentCount}</div>
              <div class="stat-label">Excellent</div>
            </div>
            <div class="stat">
              <div class="stat-value">${summary.goodCount}</div>
              <div class="stat-label">Good</div>
            </div>
            <div class="stat">
              <div class="stat-value">${summary.warningCount}</div>
              <div class="stat-label">Warning</div>
            </div>
            <div class="stat">
              <div class="stat-value">${summary.criticalCount}</div>
              <div class="stat-label">Critical</div>
            </div>
          </div>
          ${summary.topPerforming.length > 0 ? `
            <h3>🏆 Top Performing Metrics</h3>
            <ul>
              ${summary.topPerforming.map(item => `<li>${item}</li>`).join('')}
            </ul>
          ` : ''}
          ${summary.needsAttention.length > 0 ? `
            <h3>⚠️ Needs Attention</h3>
            <ul>
              ${summary.needsAttention.map(item => `<li>${item}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
        
        ${config.includeKRI && kris.length > 0 ? `
          <h2>Key Result Indicators (KRIs) <span class="badge badge-kri">Top 10%</span></h2>
          <table>
            <thead>
              <tr><th>Metric</th><th>Value</th><th>Target</th><th>Status</th><th>Trend</th></tr>
            </thead>
            <tbody>
              ${kris.map(k => `
                <tr>
                  <td>${k.name}</td>
                  <td>${k.unit === '$' ? `$${k.value.toLocaleString()}` : `${k.value}${k.unit}`}</td>
                  <td>${k.unit === '$' ? `$${k.target.toLocaleString()}` : `${k.target}${k.unit}`}</td>
                  <td class="status-${k.status}">${k.status.toUpperCase()}</td>
                  <td>${k.trend > 0 ? '+' : ''}${k.trend}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        ${config.includeRIPI && ripi.length > 0 ? `
          <h2>Result & Performance Indicators <span class="badge badge-ripi">Middle 80%</span></h2>
          <table>
            <thead>
              <tr><th>Metric</th><th>Category</th><th>Value</th><th>Target</th><th>Status</th><th>Trend</th></tr>
            </thead>
            <tbody>
              ${ripi.map(r => `
                <tr>
                  <td>${r.name}</td>
                  <td>${r.category}</td>
                  <td>${r.unit === '$' ? `$${r.value.toLocaleString()}` : `${r.value}${r.unit}`}</td>
                  <td>${r.unit === '$' ? `$${r.target}` : `${r.target}${r.unit}`}</td>
                  <td class="status-${r.status}">${r.status.toUpperCase()}</td>
                  <td>${r.trend > 0 ? '+' : ''}${r.trend}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        ${config.includeKPIs && kpis.length > 0 ? `
          <h2>Winning Key Performance Indicators <span class="badge badge-kpi">Top 10%</span></h2>
          <table>
            <thead>
              <tr><th>Metric</th><th>Value</th><th>Target</th><th>Achievement</th><th>Priority</th><th>Trend</th></tr>
            </thead>
            <tbody>
              ${kpis.map(k => `
                <tr>
                  <td>${k.name}</td>
                  <td>${k.value}${k.unit}</td>
                  <td>${k.target}${k.unit}</td>
                  <td>${k.achievement}%</td>
                  <td>${k.priority.toUpperCase()}</td>
                  <td>${k.trend > 0 ? '+' : ''}${k.trend}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        <div class="footer">
          <p>Generated by 10/80/10 Performance Management System</p>
          <p>© ${new Date().getFullYear()} - All Rights Reserved</p>
        </div>
      </body>
      </html>
    `;
  };

  const exportReport = async () => {
    setIsExporting(true);
    try {
      let content = '';
      let filename = '';
      let mimeType = '';
      
      if (config.format === 'csv') {
        content = generateCSV();
        filename = `performance_report_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else if (config.format === 'json') {
        content = generateJSON();
        filename = `performance_report_${Date.now()}.json`;
        mimeType = 'application/json';
      } else {
        const html = generateHTML();
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
        setIsExporting(false);
        setShowExportModal(false);
        return;
      }
      
      const fileUri = (FileSystem as any).documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: (FileSystem as any).EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Export Performance Report',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
      
      setIsExporting(false);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'There was an error generating the report');
      setIsExporting(false);
    }
  };

  const shareReport = async () => {
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Share.share({
        url: uri,
        message: 'Check out this performance report!',
        title: '10/80/10 Performance Report',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Failed', 'There was an error sharing the report');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading report data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.mainTitle}>Performance Reports</Text>
        <Text style={styles.mainSubtitle}>Generate and export 10/80/10 framework reports</Text>
        
        {/* Configuration Card */}
        <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.configCard}>
          <Text style={styles.configTitle}>Report Configuration</Text>
          
          <DateRangePicker
            startDate={config.dateRange.start}
            endDate={config.dateRange.end}
            onStartDateChange={(date) => setConfig({ ...config, dateRange: { ...config.dateRange, start: date } })}
            onEndDateChange={(date) => setConfig({ ...config, dateRange: { ...config.dateRange, end: date } })}
          />
          
          <SectionSelector
            includeKRI={config.includeKRI}
            includeRIPI={config.includeRIPI}
            includeKPIs={config.includeKPIs}
            onToggle={(section) => {
              if (section === 'kri') setConfig({ ...config, includeKRI: !config.includeKRI });
              if (section === 'ripi') setConfig({ ...config, includeRIPI: !config.includeRIPI });
              if (section === 'kpis') setConfig({ ...config, includeKPIs: !config.includeKPIs });
            }}
          />
          
          <FormatSelector
            selectedFormat={config.format}
            onFormatChange={(format) => setConfig({ ...config, format })}
          />
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.previewButton]}
              onPress={() => setShowExportModal(true)}
            >
              <Ionicons name="eye-outline" size={20} color="#3B82F6" />
              <Text style={styles.previewButtonText}>Preview Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.exportButton]}
              onPress={() => {
                setShowExportModal(true);
                setTimeout(() => exportReport(), 500);
              }}
            >
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              <Text style={styles.exportButtonText}>Export Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={shareReport}
            >
              <Ionicons name="share-outline" size={20} color="#10B981" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        {/* Report Preview */}
        <ReportPreview
          kris={kris}
          ripi={ripi}
          kpis={kpis}
          includeKRI={config.includeKRI}
          includeRIPI={config.includeRIPI}
          includeKPIs={config.includeKPIs}
          summary={summary}
        />
        
        {/* Export Modal */}
        <ExportModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={exportReport}
          isExporting={isExporting}
        />
      </View>
    </ScrollView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  datePickerText: {
    fontSize: 14,
    color: '#374151',
  },
  dateRangeSeparator: {
    marginHorizontal: 12,
    color: '#6B7280',
  },
  formatContainer: {
    marginBottom: 20,
  },
  formatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  formatButtonActive: {
    backgroundColor: '#3B82F6',
  },
  formatButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  formatButtonTextActive: {
    color: '#FFFFFF',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  sectionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  sectionButtonActive: {
    backgroundColor: '#3B82F610',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  sectionButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  sectionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeKRI: {
    backgroundColor: '#3B82F6',
  },
  badgeRIPI: {
    backgroundColor: '#8B5CF6',
  },
  badgeKPI: {
    backgroundColor: '#F59E0B',
  },
  sectionBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  previewButton: {
    backgroundColor: '#3B82F610',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  exportButton: {
    backgroundColor: '#3B82F6',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  shareButton: {
    backgroundColor: '#10B98110',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summarySection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  summaryStatus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  topPerforming: {
    marginBottom: 12,
  },
  topPerformingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  topPerformingItem: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  needsAttention: {
    marginBottom: 12,
  },
  needsAttentionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  needsAttentionItem: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  previewSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  previewItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  previewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  previewItemCategory: {
    fontSize: 10,
    color: '#6B7280',
  },
  previewItemStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  previewItemValue: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  previewItemTrend: {
    fontSize: 11,
    color: '#6B7280',
  },
  previewMore: {
    fontSize: 12,
    color: '#3B82F6',
    textAlign: 'center',
    marginTop: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityHigh: {
    backgroundColor: '#EF444420',
  },
  priorityMedium: {
    backgroundColor: '#F59E0B20',
  },
  priorityLow: {
    backgroundColor: '#10B98120',
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#EF4444',
  },
  statusExcellent: { color: '#10B981' },
  statusGood: { color: '#3B82F6' },
  statusWarning: { color: '#F59E0B' },
  statusCritical: { color: '#EF4444' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: screenWidth - 48,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    alignItems: 'center',
    gap: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ReportScreen;