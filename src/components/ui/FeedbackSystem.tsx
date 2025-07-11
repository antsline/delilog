/**
 * フィードバックシステム
 * トースト、アラート、確認ダイアログの統一管理
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useFadeSlideAnimation, useTapFeedback } from '@/hooks/useAnimations';

const { width, height } = Dimensions.get('window');

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  type: FeedbackType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface AlertConfig {
  type: FeedbackType;
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }>;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
}

/**
 * フィードバック管理コンテキスト
 */
interface FeedbackContextType {
  showToast: (config: ToastConfig) => void;
  showAlert: (config: AlertConfig) => void;
  showConfirm: (config: ConfirmConfig) => void;
  hideAll: () => void;
}

const FeedbackContext = React.createContext<FeedbackContextType | null>(null);

/**
 * フィードバックプロバイダー
 */
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Array<ToastConfig & { id: string }>>([]);
  const [alert, setAlert] = React.useState<AlertConfig | null>(null);
  const [confirm, setConfirm] = React.useState<ConfirmConfig | null>(null);

  const showToast = React.useCallback((config: ToastConfig) => {
    const id = Date.now().toString();
    const toast = { ...config, id };
    
    setToasts(prev => [...prev, toast]);
    
    // 自動削除
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, config.duration || 4000);
  }, []);

  const showAlert = React.useCallback((config: AlertConfig) => {
    setAlert(config);
  }, []);

  const showConfirm = React.useCallback((config: ConfirmConfig) => {
    setConfirm(config);
  }, []);

  const hideAll = React.useCallback(() => {
    setToasts([]);
    setAlert(null);
    setConfirm(null);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value: FeedbackContextType = {
    showToast,
    showAlert,
    showConfirm,
    hideAll,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      
      {/* トースト表示 */}
      <View style={styles.toastContainer}>
        {toasts.map(toast => (
          <ToastComponent
            key={toast.id}
            {...toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </View>
      
      {/* アラート表示 */}
      {alert && (
        <AlertComponent
          {...alert}
          onDismiss={() => setAlert(null)}
        />
      )}
      
      {/* 確認ダイアログ表示 */}
      {confirm && (
        <ConfirmComponent
          {...confirm}
          onDismiss={() => setConfirm(null)}
        />
      )}
    </FeedbackContext.Provider>
  );
};

/**
 * フィードバックフック
 */
export const useFeedback = (): FeedbackContextType => {
  const context = React.useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
};

/**
 * トーストコンポーネント
 */
const ToastComponent: React.FC<ToastConfig & { id: string; onDismiss: () => void }> = ({
  type,
  title,
  message,
  action,
  onDismiss,
}) => {
  const { opacity, translateY, animateIn, animateOut } = useFadeSlideAnimation(0, -100);
  const { scale, onPressIn, onPressOut } = useTapFeedback();

  React.useEffect(() => {
    animateIn();
  }, [animateIn]);

  const handleDismiss = React.useCallback(async () => {
    await animateOut();
    onDismiss();
  }, [animateOut, onDismiss]);

  const config = getTypeConfig(type);

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity, transform: [{ translateY }, { scale }] },
        { backgroundColor: config.backgroundColor, borderLeftColor: config.color }
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={handleDismiss}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.8}
      >
        <View style={styles.toastHeader}>
          <Feather name={config.icon} size={20} color={config.color} />
          <Text style={[styles.toastTitle, { color: config.textColor }]}>
            {title}
          </Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Feather name="x" size={16} color={config.textColor} />
          </TouchableOpacity>
        </View>
        
        {message && (
          <Text style={[styles.toastMessage, { color: config.textColor }]}>
            {message}
          </Text>
        )}
        
        {action && (
          <TouchableOpacity
            style={[styles.toastAction, { borderColor: config.color }]}
            onPress={action.onPress}
          >
            <Text style={[styles.toastActionText, { color: config.color }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * アラートコンポーネント
 */
const AlertComponent: React.FC<AlertConfig & { onDismiss: () => void }> = ({
  type,
  title,
  message,
  buttons,
  onDismiss,
}) => {
  const { opacity, animateIn } = useFadeSlideAnimation(0, 50);

  React.useEffect(() => {
    animateIn();
  }, [animateIn]);

  const config = getTypeConfig(type);

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity }]}>
        <Animated.View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Feather name={config.icon} size={24} color={config.color} />
            <Text style={styles.alertTitle}>{title}</Text>
          </View>
          
          <Text style={styles.alertMessage}>{message}</Text>
          
          <View style={styles.alertButtons}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alertButton,
                  button.style === 'destructive' && styles.destructiveButton,
                  button.style === 'cancel' && styles.cancelButton,
                ]}
                onPress={() => {
                  button.onPress?.();
                  onDismiss();
                }}
              >
                <Text style={[
                  styles.alertButtonText,
                  button.style === 'destructive' && styles.destructiveButtonText,
                  button.style === 'cancel' && styles.cancelButtonText,
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

/**
 * 確認ダイアログコンポーネント
 */
const ConfirmComponent: React.FC<ConfirmConfig & { onDismiss: () => void }> = ({
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  onConfirm,
  onCancel,
  onDismiss,
  destructive = false,
}) => {
  const { opacity, animateIn } = useFadeSlideAnimation(0, 30);

  React.useEffect(() => {
    animateIn();
  }, [animateIn]);

  const handleConfirm = React.useCallback(() => {
    onConfirm();
    onDismiss();
  }, [onConfirm, onDismiss]);

  const handleCancel = React.useCallback(() => {
    onCancel?.();
    onDismiss();
  }, [onCancel, onDismiss]);

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity }]}>
        <Animated.View style={styles.confirmContainer}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          
          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.cancelConfirmButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelConfirmButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.confirmButton,
                destructive ? styles.destructiveConfirmButton : styles.primaryConfirmButton
              ]}
              onPress={handleConfirm}
            >
              <Text style={[
                destructive ? styles.destructiveConfirmButtonText : styles.primaryConfirmButtonText
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

/**
 * タイプ別設定を取得
 */
function getTypeConfig(type: FeedbackType) {
  switch (type) {
    case 'success':
      return {
        color: colors.success,
        backgroundColor: colors.success + '15',
        textColor: colors.charcoal,
        icon: 'check-circle' as const,
      };
    case 'error':
      return {
        color: colors.error,
        backgroundColor: colors.error + '15',
        textColor: colors.charcoal,
        icon: 'alert-circle' as const,
      };
    case 'warning':
      return {
        color: colors.orange,
        backgroundColor: colors.orange + '15',
        textColor: colors.charcoal,
        icon: 'alert-triangle' as const,
      };
    case 'info':
      return {
        color: colors.charcoal,
        backgroundColor: colors.charcoal + '15',
        textColor: colors.charcoal,
        icon: 'info' as const,
      };
  }
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toastContent: {
    padding: 16,
  },
  toastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  toastTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  toastMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 32,
    marginBottom: 8,
  },
  toastAction: {
    alignSelf: 'flex-start',
    marginLeft: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 6,
  },
  toastActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: width - 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginLeft: 12,
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.charcoal,
    marginBottom: 24,
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.orange,
  },
  cancelButton: {
    backgroundColor: colors.beige,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
  },
  cancelButtonText: {
    color: colors.charcoal,
  },
  destructiveButtonText: {
    color: colors.cream,
  },
  confirmContainer: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: width - 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.charcoal,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelConfirmButton: {
    backgroundColor: colors.beige,
  },
  primaryConfirmButton: {
    backgroundColor: colors.orange,
  },
  destructiveConfirmButton: {
    backgroundColor: colors.error,
  },
  cancelConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  primaryConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
  },
  destructiveConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
  },
});

export default FeedbackProvider;