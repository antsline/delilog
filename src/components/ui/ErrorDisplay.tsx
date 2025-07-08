/**
 * エラー表示UIコンポーネント
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useErrorStore } from '@/store/errorStore';
import { AppError, ErrorSeverity, ErrorRecoveryOption } from '@/types/error';

interface ErrorDisplayProps {
  visible?: boolean;
  onDismiss?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  visible: propVisible,
  onDismiss,
}) => {
  const {
    currentError,
    multipleErrors,
    recoveryOptions,
    isShowingError,
    isAutoRecovering,
    clearError,
    executeRecovery,
  } = useErrorStore();

  const visible = propVisible !== undefined ? propVisible : isShowingError;
  const error = currentError;

  if (!visible || (!error && !multipleErrors)) return null;

  const handleDismiss = () => {
    clearError();
    onDismiss?.();
  };

  const handleRecovery = async (option: ErrorRecoveryOption) => {
    try {
      await executeRecovery(option);
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
    }
  };

  const getErrorColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'low':
        return colors.orange;
      case 'medium':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      case 'critical':
        return '#dc2626';
      default:
        return colors.darkGray;
    }
  };

  const getErrorIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'alert-triangle';
      case 'high':
        return 'alert-circle';
      case 'critical':
        return 'x-circle';
      default:
        return 'alert-circle';
    }
  };

  const renderSingleError = () => {
    if (!error) return null;

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          {/* エラーヘッダー */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather
                name={getErrorIcon(error.severity)}
                size={24}
                color={getErrorColor(error.severity)}
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {error.severity === 'critical' ? '重要なエラー' : 
                 error.severity === 'high' ? 'エラー' : 
                 error.severity === 'medium' ? '警告' : '情報'}
              </Text>
              {error.metadata?.timestamp && (
                <Text style={styles.timestamp}>
                  {error.metadata.timestamp.toLocaleTimeString()}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleDismiss}
              accessibilityLabel="エラーダイアログを閉じる"
              accessibilityRole="button"
              accessibilityHint="タップしてエラーメッセージを閉じます"
            >
              <Feather name="x" size={20} color={colors.darkGray} />
            </TouchableOpacity>
          </View>

          {/* エラーメッセージ */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{error.userMessage}</Text>
            {error.metadata?.context && (
              <Text style={styles.context}>
                コンテキスト: {error.metadata.context}
              </Text>
            )}
          </View>

          {/* 復旧オプション */}
          {recoveryOptions.length > 0 && (
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>対処方法:</Text>
              {recoveryOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    option.strategy === 'retry' && styles.primaryActionButton,
                  ]}
                  onPress={() => handleRecovery(option)}
                  disabled={isAutoRecovering}
                  accessibilityLabel={`${option.label}ボタン`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isAutoRecovering }}
                >
                  {isAutoRecovering && option.strategy === 'retry' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.actionButtonText,
                        option.strategy === 'retry' && styles.primaryActionButtonText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 詳細情報（開発時のみ） */}
          {__DEV__ && error.metadata && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>デバッグ情報:</Text>
              <Text style={styles.debugText}>
                コード: {error.code}
              </Text>
              <Text style={styles.debugText}>
                技術メッセージ: {error.message}
              </Text>
              {error.metadata.operation && (
                <Text style={styles.debugText}>
                  操作: {error.metadata.operation}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMultipleErrors = () => {
    if (!multipleErrors) return null;

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="alert-triangle" size={24} color="#f59e0b" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>複数のエラー</Text>
              <Text style={styles.subtitle}>
                {multipleErrors.successCount}件成功、{multipleErrors.failureCount}件失敗
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleDismiss}
              accessibilityLabel="エラーダイアログを閉じる"
              accessibilityRole="button"
              accessibilityHint="タップしてエラーメッセージを閉じます"
            >
              <Feather name="x" size={20} color={colors.darkGray} />
            </TouchableOpacity>
          </View>

          {/* エラーリスト */}
          <ScrollView style={styles.errorList} showsVerticalScrollIndicator={false}>
            {multipleErrors.errors.map((err, index) => (
              <View key={index} style={styles.errorItem}>
                <Feather
                  name={getErrorIcon(err.severity)}
                  size={16}
                  color={getErrorColor(err.severity)}
                  style={styles.errorItemIcon}
                />
                <Text style={styles.errorItemText}>{err.userMessage}</Text>
              </View>
            ))}
          </ScrollView>

          {/* 部分成功メッセージ */}
          {multipleErrors.partialSuccess && (
            <View style={styles.partialSuccessContainer}>
              <Feather name="check-circle" size={16} color="#22c55e" />
              <Text style={styles.partialSuccessText}>
                一部の処理は正常に完了しました
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        {multipleErrors ? renderMultipleErrors() : renderSingleError()}
      </View>
    </Modal>
  );
};

// インライン表示用の軽量コンポーネント
export const InlineErrorDisplay: React.FC<{
  error: AppError;
  onDismiss?: () => void;
  showActions?: boolean;
}> = ({ error, onDismiss, showActions = true }) => {
  const { executeRecovery } = useErrorStore();
  const recoveryOptions: ErrorRecoveryOption[] = showActions ? [] : []; // 簡略化のため空配列

  return (
    <View style={[styles.inlineContainer, { borderColor: getErrorColor(error.severity) }]}>
      <View style={styles.inlineHeader}>
        <Feather
          name={getErrorIcon(error.severity)}
          size={16}
          color={getErrorColor(error.severity)}
        />
        <Text style={styles.inlineMessage}>{error.userMessage}</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.inlineCloseButton}>
            <Feather name="x" size={14} color={colors.darkGray} />
          </TouchableOpacity>
        )}
      </View>
      
      {showActions && recoveryOptions.length > 0 && (
        <View style={styles.inlineActions}>
          {recoveryOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.inlineActionButton}
              onPress={() => executeRecovery(option)}
            >
              <Text style={styles.inlineActionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// トースト表示用のコンポーネント
export const ErrorToast: React.FC<{
  error: AppError;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}> = ({ error, visible, onDismiss, duration = 3000 }) => {
  React.useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.toastContainer}>
      <View style={[styles.toast, { borderLeftColor: getErrorColor(error.severity) }]}>
        <Feather
          name={getErrorIcon(error.severity)}
          size={16}
          color={getErrorColor(error.severity)}
        />
        <Text style={styles.toastText}>{error.userMessage}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Feather name="x" size={14} color={colors.darkGray} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ヘルパー関数（スタイル外で定義）
const getErrorColor = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'low': return colors.orange;
    case 'medium': return '#f59e0b';
    case 'high': return '#ef4444';
    case 'critical': return '#dc2626';
    default: return colors.darkGray;
  }
};

const getErrorIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'low': return 'info' as const;
    case 'medium': return 'alert-triangle' as const;
    case 'high': return 'alert-circle' as const;
    case 'critical': return 'x-circle' as const;
    default: return 'alert-circle' as const;
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.darkGray,
  },
  timestamp: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  messageContainer: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: colors.charcoal,
    lineHeight: 22,
  },
  context: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: colors.beige,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryActionButton: {
    backgroundColor: colors.orange,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  primaryActionButtonText: {
    color: '#fff',
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: colors.darkGray,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  errorList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 6,
  },
  errorItemIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  errorItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
  },
  partialSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  partialSuccessText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#166534',
  },
  // インライン表示用スタイル
  inlineContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderLeftWidth: 4,
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    marginLeft: 8,
  },
  inlineCloseButton: {
    padding: 4,
  },
  inlineActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  inlineActionButton: {
    backgroundColor: colors.beige,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  inlineActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  // トースト用スタイル
  toastContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    marginHorizontal: 12,
  },
});