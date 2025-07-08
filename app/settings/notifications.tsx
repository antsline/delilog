/**
 * 通知設定画面
 * プッシュ通知とリマインダーの設定
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/constants/colors';
import { useNotificationStore } from '@/store/notificationStore';
import { AnimatedButton } from '@/components/common/AnimatedButton';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function NotificationSettingsScreen() {
  const {
    settings,
    hasPermission,
    permissionStatus,
    isLoading,
    isSaving,
    error,
    initialize,
    toggleNotifications,
    toggleBeforeWorkReminder,
    toggleAfterWorkReminder,
    updateBeforeWorkTime,
    updateAfterWorkTime,
    toggleWeekendNotifications,
    sendTestNotification,
    clearError,
  } = useNotificationStore();

  const [showBeforeTimePicker, setShowBeforeTimePicker] = React.useState(false);
  const [showAfterTimePicker, setShowAfterTimePicker] = React.useState(false);

  React.useEffect(() => {
    initialize();
  }, []);

  React.useEffect(() => {
    if (error) {
      Alert.alert('エラー', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const handleTimeChange = (
    event: any,
    selectedDate: Date | undefined,
    isBeforeWork: boolean
  ) => {
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      if (isBeforeWork) {
        updateBeforeWorkTime(timeString);
      } else {
        updateAfterWorkTime(timeString);
      }
    }
  };

  const getTimeAsDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={colors.cream} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="戻る"
            accessibilityHint="前の画面に戻ります"
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>通知設定</Text>
        </View>
        {/* 権限状態の表示 */}
        {permissionStatus === 'denied' && (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionText}>
              通知を有効にするには、設定アプリから通知権限を許可してください。
            </Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                Alert.alert(
                  '通知権限',
                  '設定アプリを開いて通知を有効にしてください。',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.settingsButtonText}>設定を開く</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* メイン通知設定 */}
        <View style={styles.section}>
          <View style={styles.mainToggleContainer}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>プッシュ通知</Text>
                <Text style={styles.toggleDescription}>
                  点呼リマインダーを受け取る
                </Text>
              </View>
              <Switch
                value={settings.enabled && hasPermission}
                onValueChange={toggleNotifications}
                disabled={!hasPermission || isSaving}
                trackColor={{ false: colors.lightGray, true: colors.orange }}
                thumbColor={colors.cream}
              />
            </View>
          </View>
        </View>

        {/* リマインダー設定 */}
        {settings.enabled && hasPermission && (
          <>
            {/* 業務前リマインダー */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>業務前点呼リマインダー</Text>
              
              <View style={styles.reminderCard}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>有効化</Text>
                  <Switch
                    value={settings.beforeWork.enabled}
                    onValueChange={toggleBeforeWorkReminder}
                    disabled={isSaving}
                    trackColor={{ false: colors.lightGray, true: colors.orange }}
                    thumbColor={colors.cream}
                  />
                </View>

                {settings.beforeWork.enabled && (
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => setShowBeforeTimePicker(true)}
                    disabled={isSaving}
                  >
                    <Text style={styles.timeSelectorLabel}>通知時刻</Text>
                    <Text style={styles.timeSelectorValue}>
                      {settings.beforeWork.time}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 業務後リマインダー */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>業務後点呼リマインダー</Text>
              
              <View style={styles.reminderCard}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>有効化</Text>
                  <Switch
                    value={settings.afterWork.enabled}
                    onValueChange={toggleAfterWorkReminder}
                    disabled={isSaving}
                    trackColor={{ false: colors.lightGray, true: colors.orange }}
                    thumbColor={colors.cream}
                  />
                </View>

                {settings.afterWork.enabled && (
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => setShowAfterTimePicker(true)}
                    disabled={isSaving}
                  >
                    <Text style={styles.timeSelectorLabel}>通知時刻</Text>
                    <Text style={styles.timeSelectorValue}>
                      {settings.afterWork.time}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 週末設定 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>週末・休日設定</Text>
              
              <View style={styles.reminderCard}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>週末も通知する</Text>
                    <Text style={styles.toggleDescription}>
                      土日も通知を受け取る
                    </Text>
                  </View>
                  <Switch
                    value={settings.weekendEnabled}
                    onValueChange={toggleWeekendNotifications}
                    disabled={isSaving}
                    trackColor={{ false: colors.lightGray, true: colors.orange }}
                    thumbColor={colors.cream}
                  />
                </View>
              </View>
            </View>

            {/* テスト通知 */}
            <View style={styles.section}>
              <AnimatedButton
                title="テスト通知を送信"
                onPress={sendTestNotification}
                disabled={isSaving}
                loading={isSaving}
                variant="secondary"
                size="medium"
                accessibilityLabel="テスト通知を送信"
                accessibilityHint="通知が正しく動作するかテストします"
              />
            </View>
          </>
        )}

        {/* 注意事項 */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>ご注意</Text>
          <Text style={styles.noteText}>
            • 通知は設定した時刻の前後数分の誤差が生じる場合があります
          </Text>
          <Text style={styles.noteText}>
            • バッテリー節約モードでは通知が遅延する可能性があります
          </Text>
          <Text style={styles.noteText}>
            • 通知音やバイブレーションは端末の設定に従います
          </Text>
        </View>
      </ScrollView>

      {/* 時刻選択ピッカー */}
      {showBeforeTimePicker && (
        <Modal
          visible={showBeforeTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBeforeTimePicker(false)}
        >
          <View style={styles.timePickerModalOverlay}>
            <View style={styles.timePickerModalContent}>
              <View style={styles.timePickerHeader}>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowBeforeTimePicker(false)}
                >
                  <Text style={styles.timePickerButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerTitle}>業務前通知時刻</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowBeforeTimePicker(false)}
                >
                  <Text style={[styles.timePickerButtonText, styles.timePickerConfirmText]}>完了</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={getTimeAsDate(settings.beforeWork.time)}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, date) => handleTimeChange(event, date, true)}
                style={styles.timePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {showAfterTimePicker && (
        <Modal
          visible={showAfterTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAfterTimePicker(false)}
        >
          <View style={styles.timePickerModalOverlay}>
            <View style={styles.timePickerModalContent}>
              <View style={styles.timePickerHeader}>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowAfterTimePicker(false)}
                >
                  <Text style={styles.timePickerButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerTitle}>業務後通知時刻</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowAfterTimePicker(false)}
                >
                  <Text style={[styles.timePickerButtonText, styles.timePickerConfirmText]}>完了</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={getTimeAsDate(settings.afterWork.time)}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, date) => handleTimeChange(event, date, false)}
                style={styles.timePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* 保存中インジケーター */}
      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  backIcon: {
    padding: 8,
    marginRight: 12,
  },
  backIconText: {
    fontSize: 24,
    color: colors.charcoal,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.charcoal,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionCard: {
    backgroundColor: colors.lightOrange,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: 12,
  },
  settingsButton: {
    backgroundColor: colors.orange,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 12,
  },
  mainToggleContainer: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.beige,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.darkGray,
  },
  reminderCard: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.beige,
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  timeSelectorLabel: {
    fontSize: 14,
    color: colors.charcoal,
  },
  timeSelectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.orange,
  },
  noteSection: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 4,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerModalContent: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  timePickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timePickerButtonText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  timePickerConfirmText: {
    color: colors.orange,
    fontWeight: '600',
  },
  timePicker: {
    backgroundColor: colors.cream,
  },
});