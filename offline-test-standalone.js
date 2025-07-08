// オフライン機能テストスクリプト (スタンドアロン版)
const fs = require('fs');
const path = require('path');

// モック用のLocalStorageクラス
class MockLocalStorage {
  constructor() {
    this.data = {};
  }

  setItem(key, value) {
    this.data[key] = value;
  }

  getItem(key) {
    return this.data[key] || null;
  }

  removeItem(key) {
    delete this.data[key];
  }

  clear() {
    this.data = {};
  }

  getAllKeys() {
    return Object.keys(this.data);
  }
}

// モックネットワーク状態
class MockNetworkManager {
  constructor() {
    this.currentStatus = {
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
      connectionQuality: 'good',
    };
    this.listeners = [];
  }

  addListener(callback) {
    const id = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.push({ id, callback });
    callback(this.currentStatus);
    return id;
  }

  removeListener(id) {
    const initialLength = this.listeners.length;
    this.listeners = this.listeners.filter(listener => listener.id !== id);
    return this.listeners.length < initialLength;
  }

  getCurrentStatus() {
    return { ...this.currentStatus };
  }
}

// 簡易LocalStorageService
class LocalStorageService {
  constructor() {
    this.storage = new MockLocalStorage();
  }

  async setItem(key, value) {
    this.storage.setItem(key, JSON.stringify(value));
  }

  async getItem(key) {
    const item = this.storage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  async removeItem(key) {
    this.storage.removeItem(key);
  }

  async clearAll() {
    this.storage.clear();
  }

  generateLocalId() {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveTenkoRecord(record) {
    const records = await this.getTenkoRecords();
    const existingIndex = records.findIndex(r => r.local_id === record.local_id);
    
    if (existingIndex >= 0) {
      records[existingIndex] = {
        ...record,
        updated_at_local: new Date().toISOString(),
      };
    } else {
      records.push({
        ...record,
        created_at_local: new Date().toISOString(),
        updated_at_local: new Date().toISOString(),
      });
    }
    
    await this.setItem('tenko_records', records);
  }

  async getTenkoRecords() {
    return (await this.getItem('tenko_records')) || [];
  }

  async deleteTenkoRecord(localId) {
    const records = await this.getTenkoRecords();
    const filteredRecords = records.filter(r => r.local_id !== localId);
    await this.setItem('tenko_records', filteredRecords);
  }

  async saveVehicle(vehicle) {
    const vehicles = await this.getVehicles();
    const existingIndex = vehicles.findIndex(v => v.id === vehicle.id);
    
    if (existingIndex >= 0) {
      vehicles[existingIndex] = {
        ...vehicle,
        updated_at_local: new Date().toISOString(),
      };
    } else {
      vehicles.push({
        ...vehicle,
        created_at_local: new Date().toISOString(),
        updated_at_local: new Date().toISOString(),
      });
    }
    
    await this.setItem('vehicles', vehicles);
  }

  async getVehicles() {
    return (await this.getItem('vehicles')) || [];
  }

  async addToSyncQueue(item) {
    const queue = await this.getSyncQueue();
    const newItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retry_count: 0,
    };
    
    queue.push(newItem);
    await this.setItem('sync_queue', queue);
  }

  async getSyncQueue() {
    return (await this.getItem('sync_queue')) || [];
  }

  async updateSyncQueueItem(id, updates) {
    const queue = await this.getSyncQueue();
    const itemIndex = queue.findIndex(item => item.id === id);
    
    if (itemIndex >= 0) {
      queue[itemIndex] = { ...queue[itemIndex], ...updates };
      await this.setItem('sync_queue', queue);
    }
  }

  async removeSyncQueueItem(id) {
    const queue = await this.getSyncQueue();
    const filteredQueue = queue.filter(item => item.id !== id);
    await this.setItem('sync_queue', filteredQueue);
  }

  async getStorageInfo() {
    const keys = this.storage.getAllKeys();
    let totalSize = 0;
    
    for (const key of keys) {
      const value = this.storage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
    
    return {
      total_size_bytes: totalSize,
      item_count: keys.length,
    };
  }

  async createBackup() {
    const allKeys = this.storage.getAllKeys();
    const allData = {};
    
    for (const key of allKeys) {
      const value = this.storage.getItem(key);
      if (value) {
        allData[key] = JSON.parse(value);
      }
    }
    
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: allData,
    };
    
    return JSON.stringify(backup);
  }

  async restoreFromBackup(backupData) {
    const backup = JSON.parse(backupData);
    
    if (!backup.version || !backup.data) {
      throw new Error('無効なバックアップデータです');
    }
    
    // 既存データをクリア
    this.storage.clear();
    
    // バックアップデータを復元
    for (const [key, value] of Object.entries(backup.data)) {
      this.storage.setItem(key, JSON.stringify(value));
    }
  }
}

// テスト実行
async function runTests() {
  console.log('🔄 オフライン機能テスト開始\n');
  
  const localStorageService = new LocalStorageService();
  const networkManager = new MockNetworkManager();
  const testResults = {};

  // テスト実行関数
  const runTest = async (testName, testFunction) => {
    try {
      await testFunction();
      testResults[testName] = { success: true, message: 'テスト成功' };
      console.log(`✅ ${testName}: 成功`);
    } catch (error) {
      testResults[testName] = { success: false, message: error.message };
      console.log(`❌ ${testName}: 失敗 - ${error.message}`);
    }
  };

  // 1. AsyncStorageの基本操作テスト
  await runTest('AsyncStorage基本操作', async () => {
    const testKey = 'test_key';
    const testValue = { message: 'Hello AsyncStorage', timestamp: new Date().toISOString() };
    
    // 保存テスト
    await localStorageService.setItem(testKey, testValue);
    
    // 取得テスト
    const retrievedValue = await localStorageService.getItem(testKey);
    if (!retrievedValue || retrievedValue.message !== testValue.message) {
      throw new Error('データの保存・取得に失敗');
    }
    
    // 削除テスト
    await localStorageService.removeItem(testKey);
    const deletedValue = await localStorageService.getItem(testKey);
    if (deletedValue !== null) {
      throw new Error('データの削除に失敗');
    }
  });

  // 2. 点呼記録のローカル保存テスト
  await runTest('点呼記録ローカル保存', async () => {
    const testRecord = {
      local_id: localStorageService.generateLocalId(),
      user_id: 'test_user',
      vehicle_id: 'test_vehicle',
      date: new Date().toISOString().split('T')[0],
      type: 'before',
      check_method: '対面',
      executor: '本人',
      alcohol_level: 0.00,
      health_status: 'good',
      daily_check_completed: true,
      notes: 'テスト記録',
      platform: 'mobile',
      is_synced: false,
      is_offline_created: true,
    };

    // 保存テスト
    await localStorageService.saveTenkoRecord(testRecord);
    
    // 取得テスト
    const records = await localStorageService.getTenkoRecords();
    const savedRecord = records.find(r => r.local_id === testRecord.local_id);
    
    if (!savedRecord) {
      throw new Error('点呼記録の保存に失敗');
    }
    
    // 削除テスト
    await localStorageService.deleteTenkoRecord(testRecord.local_id);
    const recordsAfterDelete = await localStorageService.getTenkoRecords();
    const deletedRecord = recordsAfterDelete.find(r => r.local_id === testRecord.local_id);
    
    if (deletedRecord) {
      throw new Error('点呼記録の削除に失敗');
    }
  });

  // 3. 車両情報のローカル保存テスト
  await runTest('車両情報ローカル保存', async () => {
    const testVehicle = {
      id: localStorageService.generateLocalId(),
      user_id: 'test_user',
      plate_number: 'テスト123',
      vehicle_name: 'テスト車両',
      is_default: false,
      is_active: true,
      is_synced: false,
    };

    // 保存テスト
    await localStorageService.saveVehicle(testVehicle);
    
    // 取得テスト
    const vehicles = await localStorageService.getVehicles();
    const savedVehicle = vehicles.find(v => v.id === testVehicle.id);
    
    if (!savedVehicle) {
      throw new Error('車両情報の保存に失敗');
    }
    
    // 更新テスト
    const updatedVehicle = { ...savedVehicle, plate_number: 'テスト456' };
    await localStorageService.saveVehicle(updatedVehicle);
    
    const vehiclesAfterUpdate = await localStorageService.getVehicles();
    const updatedSavedVehicle = vehiclesAfterUpdate.find(v => v.id === testVehicle.id);
    
    if (!updatedSavedVehicle || updatedSavedVehicle.plate_number !== 'テスト456') {
      throw new Error('車両情報の更新に失敗');
    }
  });

  // 4. 同期キューのテスト
  await runTest('同期キュー', async () => {
    const testItem = {
      type: 'tenko_record',
      action: 'create',
      data: { test: 'data' },
      priority: 'high',
      max_retries: 3,
    };

    // 追加テスト
    await localStorageService.addToSyncQueue(testItem);
    
    // 取得テスト
    const queue = await localStorageService.getSyncQueue();
    const addedItem = queue.find(item => item.data.test === 'data');
    
    if (!addedItem) {
      throw new Error('同期キューへの追加に失敗');
    }
    
    // 更新テスト
    await localStorageService.updateSyncQueueItem(addedItem.id, { retry_count: 1 });
    
    const queueAfterUpdate = await localStorageService.getSyncQueue();
    const updatedItem = queueAfterUpdate.find(item => item.id === addedItem.id);
    
    if (!updatedItem || updatedItem.retry_count !== 1) {
      throw new Error('同期キューアイテムの更新に失敗');
    }
    
    // 削除テスト
    await localStorageService.removeSyncQueueItem(addedItem.id);
    
    const queueAfterDelete = await localStorageService.getSyncQueue();
    const deletedItem = queueAfterDelete.find(item => item.id === addedItem.id);
    
    if (deletedItem) {
      throw new Error('同期キューアイテムの削除に失敗');
    }
  });

  // 5. ネットワーク状態監視テスト
  await runTest('ネットワーク監視', async () => {
    // 現在の状態取得テスト
    const currentStatus = networkManager.getCurrentStatus();
    if (!currentStatus) {
      throw new Error('ネットワーク状態の取得に失敗');
    }
    
    // リスナー追加テスト
    let listenerCalled = false;
    const listenerId = networkManager.addListener((status) => {
      listenerCalled = true;
    });
    
    // 少し待機してリスナーが呼ばれることを確認
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!listenerCalled) {
      throw new Error('ネットワークリスナーの追加に失敗');
    }
    
    // リスナー削除テスト
    const removed = networkManager.removeListener(listenerId);
    if (!removed) {
      throw new Error('ネットワークリスナーの削除に失敗');
    }
  });

  // 6. ストレージ情報テスト
  await runTest('ストレージ情報', async () => {
    const storageInfo = await localStorageService.getStorageInfo();
    
    if (typeof storageInfo.total_size_bytes !== 'number' || typeof storageInfo.item_count !== 'number') {
      throw new Error('ストレージ情報の取得に失敗');
    }
  });

  // 7. バックアップ・リストアテスト
  await runTest('バックアップ・リストア', async () => {
    // テストデータを作成
    const testData = { test: 'backup_data', timestamp: new Date().toISOString() };
    await localStorageService.setItem('backup_test', testData);
    
    // バックアップ作成
    const backupData = await localStorageService.createBackup();
    if (!backupData || typeof backupData !== 'string') {
      throw new Error('バックアップの作成に失敗');
    }
    
    // 元データを削除
    await localStorageService.removeItem('backup_test');
    
    // リストア実行
    await localStorageService.restoreFromBackup(backupData);
    
    // リストア後のデータ確認
    const restoredData = await localStorageService.getItem('backup_test');
    if (!restoredData || restoredData.test !== testData.test) {
      throw new Error('バックアップからの復元に失敗');
    }
    
    // クリーンアップ
    await localStorageService.removeItem('backup_test');
  });

  // 結果の表示
  console.log('\n📊 テスト結果サマリー:');
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(result => result.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`✅ 成功: ${passedTests}/${totalTests}`);
  console.log(`❌ 失敗: ${failedTests}/${totalTests}`);
  
  if (failedTests > 0) {
    console.log('\n❌ 失敗したテスト:');
    Object.entries(testResults).forEach(([testName, result]) => {
      if (!result.success) {
        console.log(`  - ${testName}: ${result.message}`);
      }
    });
  }
  
  console.log('\n🎉 オフライン機能テスト完了!');
  
  return passedTests === totalTests;
}

// スクリプト実行
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('テスト実行エラー:', error);
    process.exit(1);
  });
}

module.exports = { runTests };