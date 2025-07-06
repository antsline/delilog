import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { VehicleService } from '@/services/vehicleService';
import { Database } from '@/types/database';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export default function VehiclesScreen() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    license_plate_region: '',
    license_plate_classification: '',
    license_plate_kana: '',
    license_plate_number: '',
    vehicle_name: '',
  });

  useEffect(() => {
    if (user) {
      loadVehicles();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadVehicles = async () => {
    if (!user) {
      console.log('User not found');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading vehicles for user:', user.id);
      const vehicleList = await VehicleService.getUserVehicles(user.id);
      console.log('Loaded vehicles:', vehicleList);
      setVehicles(vehicleList);
    } catch (error) {
      console.error('車両一覧の取得エラー:', error);
      Alert.alert('エラー', '車両一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      license_plate_region: '',
      license_plate_classification: '',
      license_plate_kana: '',
      license_plate_number: '',
      vehicle_name: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    // plate_numberを分割して表示用に変換
    const plateparts = vehicle.plate_number.split(' ');
    setFormData({
      license_plate_region: plateparts[0] || '',
      license_plate_classification: plateparts[1] || '',
      license_plate_kana: plateparts[2] || '',
      license_plate_number: plateparts[3] || '',
      vehicle_name: vehicle.vehicle_name || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user) return;

    // バリデーション
    if (!formData.license_plate_region.trim() || 
        !formData.license_plate_classification.trim() || 
        !formData.license_plate_kana.trim() || 
        !formData.license_plate_number.trim()) {
      Alert.alert('エラー', 'すべての車両番号フィールドを入力してください');
      return;
    }

    // 分割されたフィールドを結合してplate_numberを作成
    const plate_number = `${formData.license_plate_region} ${formData.license_plate_classification} ${formData.license_plate_kana} ${formData.license_plate_number}`;

    try {
      const vehicleData = {
        plate_number,
        vehicle_name: formData.vehicle_name || null,
      };

      if (editingVehicle) {
        // 編集
        await VehicleService.updateVehicle(editingVehicle.id, vehicleData);
      } else {
        // 新規追加
        await VehicleService.createVehicle({
          user_id: user.id,
          ...vehicleData,
        });
      }
      
      setModalVisible(false);
      loadVehicles();
    } catch (error) {
      console.error('車両保存エラー:', error);
      Alert.alert('エラー', '車両の保存に失敗しました');
    }
  };

  const handleDelete = (vehicle: Vehicle) => {
    Alert.alert(
      '車両削除',
      `${vehicle.plate_number} を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: async () => {
            try {
              await VehicleService.deleteVehicle(vehicle.id);
              loadVehicles();
            } catch (error) {
              console.error('車両削除エラー:', error);
              Alert.alert('エラー', '車両の削除に失敗しました');
            }
          }
        },
      ]
    );
  };

  const handleSetDefault = async (vehicle: Vehicle) => {
    if (!user) return;
    
    try {
      await VehicleService.setDefaultVehicle(vehicle.id, user.id);
      loadVehicles();
    } catch (error) {
      console.error('デフォルト設定エラー:', error);
      Alert.alert('エラー', 'デフォルト車両の設定に失敗しました');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={colors.cream} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>ユーザー情報を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={colors.cream} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.orange} size="large" />
          <Text style={styles.loadingText}>車両一覧を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.cream} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>車両管理</Text>
        </View>

        {/* 車両一覧 */}
        <View style={styles.vehicleList}>
          {vehicles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>登録された車両がありません</Text>
              <Text style={styles.emptySubText}>「車両を追加」ボタンから車両を登録してください</Text>
            </View>
          ) : (
            vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.vehicleCard}>
                {vehicle.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>デフォルト</Text>
                  </View>
                )}
                <View style={styles.vehicleInfo}>
                  <View style={styles.licensePlate}>
                    <Text style={styles.licensePlateText}>
                      {vehicle.plate_number}
                    </Text>
                  </View>
                  {vehicle.vehicle_name && (
                    <Text style={styles.vehicleType}>{vehicle.vehicle_name}</Text>
                  )}
                </View>
                
                <View style={styles.vehicleActions}>
                  {!vehicle.is_default && (
                    <TouchableOpacity 
                      style={styles.defaultButton}
                      onPress={() => handleSetDefault(vehicle)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.defaultButtonText}>デフォルトに設定</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => openEditModal(vehicle)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editButtonText}>編集</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDelete(vehicle)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteButtonText}>削除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 車両追加ボタン */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ 車両を追加</Text>
        </TouchableOpacity>
      </View>

      {/* 車両追加/編集モーダル */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingVehicle ? '車両編集' : '車両追加'}
            </Text>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>車両番号</Text>
              
              <View style={styles.licensePlateRow}>
                <TextInput
                  style={[styles.input, styles.regionInput]}
                  value={formData.license_plate_region}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, license_plate_region: text }))}
                  placeholder="品川"
                  maxLength={4}
                />
                <TextInput
                  style={[styles.input, styles.classificationInput]}
                  value={formData.license_plate_classification}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, license_plate_classification: text }))}
                  placeholder="500"
                  maxLength={3}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.licensePlateRow}>
                <TextInput
                  style={[styles.input, styles.kanaInput]}
                  value={formData.license_plate_kana}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, license_plate_kana: text }))}
                  placeholder="あ"
                  maxLength={1}
                />
                <TextInput
                  style={[styles.input, styles.numberInput]}
                  value={formData.license_plate_number}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, license_plate_number: text }))}
                  placeholder="1234"
                  maxLength={4}
                  keyboardType="numeric"
                />
              </View>
              
              <Text style={styles.formLabel}>車両名（任意）</Text>
              <TextInput
                style={styles.input}
                value={formData.vehicle_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, vehicle_name: text }))}
                placeholder="軽貨物車"
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  bottomButtonContainer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.beige,
  },
  addButton: {
    backgroundColor: colors.orange,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
  },
  vehicleList: {
    marginBottom: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
  },
  vehicleCard: {
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  vehicleInfo: {
    marginBottom: 16,
  },
  licensePlate: {
    marginBottom: 8,
  },
  licensePlateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
    textAlign: 'center',
  },
  vehicleType: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  defaultBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cream,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  defaultButton: {
    flex: 1,
    backgroundColor: colors.beige,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  defaultButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.charcoal,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cream,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.darkGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.charcoal,
    marginBottom: 24,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  licensePlateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.beige,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.charcoal,
    backgroundColor: colors.cream,
  },
  regionInput: {
    flex: 2,
  },
  classificationInput: {
    flex: 1.5,
  },
  kanaInput: {
    flex: 1,
  },
  numberInput: {
    flex: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.beige,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.orange,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
  },
});