import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useSyncStatus, useOfflineStore, useDataStats } from '@/store/offlineStore';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  style?: any;
}

export function SyncStatusIndicator({ showDetails = false, style }: SyncStatusIndicatorProps) {
  const syncStatus = useSyncStatus();
  const dataStats = useDataStats();
  const offlineStore = useOfflineStore();
  const [showModal, setShowModal] = React.useState(false);

  // 同期状態のアイコンと色を決定
  const getSyncStatusDisplay = () => {
    if (syncStatus.is_syncing) {
      return {
        icon: 'refresh-cw' as const,
        color: colors.orange,
        text: '同期中...',
        animated: true,
      };
    }
    
    if (dataStats.sync_queue.failed_items > 0) {
      return {
        icon: 'alert-circle' as const,
        color: colors.error,
        text: `同期失敗: ${dataStats.sync_queue.failed_items}件`,
        animated: false,
      };
    }
    
    if (dataStats.sync_queue.total_items > 0) {
      return {
        icon: 'upload-cloud' as const,
        color: colors.orange,
        text: `同期待ち: ${dataStats.sync_queue.total_items}件`,
        animated: false,
      };
    }
    
    if (syncStatus.last_successful_sync) {
      return {
        icon: 'check-circle' as const,
        color: colors.success,
        text: '同期完了',
        animated: false,
      };
    }
    
    return null;
  };

  const statusDisplay = getSyncStatusDisplay();
  
  if (!statusDisplay) {
    return null;
  }

  const handlePress = () => {
    if (showDetails) {
      setShowModal(true);
    }
  };

  const handleManualSync = async () => {
    try {
      await offlineStore.triggerAutoSync();
    } catch (error) {
      console.error('手動同期エラー:', error);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={handlePress}
        disabled={!showDetails}
      >
        <View style={styles.content}>
          {statusDisplay.animated ? (
            <ActivityIndicator size="small" color={statusDisplay.color} />
          ) : (
            <Feather name={statusDisplay.icon} size={16} color={statusDisplay.color} />
          )}
          <Text style={[styles.text, { color: statusDisplay.color }]}>
            {statusDisplay.text}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 詳細モーダル */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>同期状態</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Feather name="x" size={24} color={colors.charcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 現在の同期状態 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>現在の状態</Text>
              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  {statusDisplay.animated ? (
                    <ActivityIndicator size="small" color={statusDisplay.color} />
                  ) : (
                    <Feather name={statusDisplay.icon} size={20} color={statusDisplay.color} />
                  )}
                  <Text style={[styles.statusText, { color: statusDisplay.color }]}>
                    {statusDisplay.text}
                  </Text>
                </View>
                
                {syncStatus.is_syncing && syncStatus.sync_progress && (
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                      {syncStatus.sync_progress.current_operation}
                    </Text>
                    <Text style={styles.progressCount}>
                      {syncStatus.sync_progress.completed_items} / {syncStatus.sync_progress.total_items}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          {
                            width: `${(syncStatus.sync_progress.completed_items / syncStatus.sync_progress.total_items) * 100}%`
                          }
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* 同期統計 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>同期統計</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{dataStats.sync_queue.total_items}</Text>
                  <Text style={styles.statLabel}>同期待ち</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{dataStats.sync_queue.high_priority}</Text>
                  <Text style={styles.statLabel}>高優先度</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{dataStats.sync_queue.failed_items}</Text>
                  <Text style={styles.statLabel}>失敗</Text>
                </View>
              </View>
            </View>

            {/* 最終同期時刻 */}
            {syncStatus.last_successful_sync && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>最終同期</Text>
                <View style={styles.statusCard}>
                  <Text style={styles.timestampText}>
                    {new Date(syncStatus.last_successful_sync).toLocaleString('ja-JP')}
                  </Text>
                </View>
              </View>
            )}

            {/* エラー一覧 */}
            {syncStatus.errors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>エラー詳細</Text>
                {syncStatus.errors.map((error, index) => (
                  <View key={error.id || index} style={styles.errorCard}>
                    <View style={styles.errorHeader}>
                      <Feather name="alert-circle" size={16} color={colors.error} />
                      <Text style={styles.errorType}>{error.error_type}</Text>
                    </View>
                    <Text style={styles.errorMessage}>{error.error_message}</Text>
                    <Text style={styles.errorTimestamp}>
                      {new Date(error.timestamp).toLocaleString('ja-JP')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 手動同期ボタン */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  syncStatus.is_syncing && styles.syncButtonDisabled
                ]}
                onPress={handleManualSync}
                disabled={syncStatus.is_syncing}
              >
                <Feather 
                  name="refresh-cw" 
                  size={16} 
                  color={syncStatus.is_syncing ? colors.darkGray : colors.cream} 
                />
                <Text style={[
                  styles.syncButtonText,
                  syncStatus.is_syncing && styles.syncButtonTextDisabled
                ]}>
                  {syncStatus.is_syncing ? '同期中...' : '手動同期'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  modal: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.beige,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.charcoal,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 8,
  },
  progressCount: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.beige,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.orange,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.darkGray,
  },
  timestampText: {
    fontSize: 14,
    color: colors.charcoal,
  },
  errorCard: {
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '30',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  errorType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
    textTransform: 'uppercase',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 4,
  },
  errorTimestamp: {
    fontSize: 11,
    color: colors.darkGray,
  },
  syncButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncButtonDisabled: {
    backgroundColor: colors.beige,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.cream,
  },
  syncButtonTextDisabled: {
    color: colors.darkGray,
  },
});