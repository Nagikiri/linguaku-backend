// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REMEMBER_ME: 'remember_me',
};

/**
 * Save data to AsyncStorage
 */
export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

/**
 * Get data from AsyncStorage
 */
export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
};

/**
 * Remove data from AsyncStorage
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing data:', error);
    return false;
  }
};

/**
 * Clear all data from AsyncStorage
 */
export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Save auth token
 */
export const saveToken = async (token) => {
  return await saveData(StorageKeys.AUTH_TOKEN, token);
};

/**
 * Get auth token
 */
export const getToken = async () => {
  return await getData(StorageKeys.AUTH_TOKEN);
};

/**
 * Remove auth token
 */
export const removeToken = async () => {
  return await removeData(StorageKeys.AUTH_TOKEN);
};

/**
 * Save user data
 */
export const saveUser = async (user) => {
  return await saveData(StorageKeys.USER_DATA, user);
};

/**
 * Get user data
 */
export const getUser = async () => {
  return await getData(StorageKeys.USER_DATA);
};

/**
 * Remove user data
 */
export const removeUser = async () => {
  return await removeData(StorageKeys.USER_DATA);
};

/**
 * Logout - clear all auth data
 */
export const logout = async () => {
  await removeToken();
  await removeUser();
  return true;
};