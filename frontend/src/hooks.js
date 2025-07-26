import { useState, useEffect, useCallback } from 'react';
import { tokenAPI, modelAPI, adminAPI, apiUtils } from './api';
import { useAuth } from './AuthContext';

// Custom hook for token management
export const useTokens = () => {
  const { isAuthenticated, isViewer } = useAuth();
  const [tokenData, setTokenData] = useState({
    balance: 0,
    totalSpent: 0,
    packages: [],
    transactions: [],
    isLoading: false,
    error: null,
  });

  // Fetch token packages
  const fetchPackages = useCallback(async () => {
    try {
      const packages = await tokenAPI.getPackages();
      setTokenData(prev => ({ ...prev, packages: packages.packages || {} }));
    } catch (error) {
      console.error('Error fetching token packages:', error);
    }
  }, []);

  // Fetch token balance
  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated || !isViewer()) return;
    
    try {
      setTokenData(prev => ({ ...prev, isLoading: true }));
      const balanceData = await tokenAPI.getBalance();
      setTokenData(prev => ({
        ...prev,
        balance: balanceData.token_balance || 0,
        totalSpent: balanceData.total_spent || 0,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      setTokenData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [isAuthenticated, isViewer]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async (limit = 20, offset = 0) => {
    if (!isAuthenticated || !isViewer()) return;
    
    try {
      const transactions = await tokenAPI.getTransactions(limit, offset);
      setTokenData(prev => ({
        ...prev,
        transactions: offset === 0 ? transactions : [...prev.transactions, ...transactions],
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [isAuthenticated, isViewer]);

  // Purchase tokens
  const purchaseTokens = useCallback(async (tokens, phoneNumber) => {
    if (!isAuthenticated || !isViewer()) {
      return { success: false, error: 'Authentication required' };
    }
    
    try {
      setTokenData(prev => ({ ...prev, isLoading: true }));
      
      const response = await tokenAPI.purchaseTokens({
        tokens: parseInt(tokens),
        phone_number: phoneNumber,
      });
      
      setTokenData(prev => ({ ...prev, isLoading: false }));
      
      if (response.success) {
        // Refresh balance after purchase
        setTimeout(() => fetchBalance(), 2000);
        return { success: true, data: response };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      setTokenData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, isViewer, fetchBalance]);

  // Check payment status
  const checkPaymentStatus = useCallback(async (checkoutRequestId) => {
    try {
      const response = await tokenAPI.checkPaymentStatus(checkoutRequestId);
      return response;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchPackages();
    if (isAuthenticated && isViewer()) {
      fetchBalance();
      fetchTransactions();
    }
  }, [isAuthenticated, isViewer, fetchPackages, fetchBalance, fetchTransactions]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  return {
    ...tokenData,
    purchaseTokens,
    checkPaymentStatus,
    refresh,
    fetchBalance,
    fetchTransactions,
  };
};

// Custom hook for model earnings
export const useModelEarnings = () => {
  const { isAuthenticated, isModel } = useAuth();
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    pendingWithdrawals: 0,
    totalWithdrawn: 0,
    revenueSharePercentage: 50,
    withdrawals: [],
    isLoading: false,
    error: null,
  });

  // Fetch earnings data
  const fetchEarnings = useCallback(async () => {
    if (!isAuthenticated || !isModel()) return;
    
    try {
      setEarningsData(prev => ({ ...prev, isLoading: true }));
      const earnings = await modelAPI.getEarnings();
      setEarningsData(prev => ({
        ...prev,
        totalEarnings: earnings.total_earnings || 0,
        availableBalance: earnings.available_balance || 0,
        pendingWithdrawals: earnings.pending_withdrawals || 0,
        totalWithdrawn: earnings.total_withdrawn || 0,
        revenueSharePercentage: earnings.revenue_share_percentage || 50,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      setEarningsData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [isAuthenticated, isModel]);

  // Fetch withdrawal history
  const fetchWithdrawals = useCallback(async (limit = 20, offset = 0) => {
    if (!isAuthenticated || !isModel()) return;
    
    try {
      const withdrawals = await modelAPI.getWithdrawals(limit, offset);
      setEarningsData(prev => ({
        ...prev,
        withdrawals: offset === 0 ? withdrawals : [...prev.withdrawals, ...withdrawals],
      }));
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  }, [isAuthenticated, isModel]);

  // Request withdrawal
  const requestWithdrawal = useCallback(async (amount, phoneNumber) => {
    if (!isAuthenticated || !isModel()) {
      return { success: false, error: 'Authentication required' };
    }
    
    try {
      setEarningsData(prev => ({ ...prev, isLoading: true }));
      
      const response = await modelAPI.requestWithdrawal({
        amount: parseFloat(amount),
        phone_number: phoneNumber,
      });
      
      setEarningsData(prev => ({ ...prev, isLoading: false }));
      
      if (response.success) {
        // Refresh earnings data after withdrawal request
        setTimeout(() => {
          fetchEarnings();
          fetchWithdrawals();
        }, 1000);
        return { success: true, data: response };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      setEarningsData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, isModel, fetchEarnings, fetchWithdrawals]);

  // Send tip to model
  const sendTip = useCallback(async (modelId, tokens, message = '') => {
    if (!isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }
    
    try {
      const response = await modelAPI.sendTip({
        model_id: modelId,
        tokens: parseInt(tokens),
        message: message || undefined,
      });
      
      return { success: response.success, data: response };
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated]);

  // Initialize data on mount
  useEffect(() => {
    if (isAuthenticated && isModel()) {
      fetchEarnings();
      fetchWithdrawals();
    }
  }, [isAuthenticated, isModel, fetchEarnings, fetchWithdrawals]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchEarnings();
    fetchWithdrawals();
  }, [fetchEarnings, fetchWithdrawals]);

  return {
    ...earningsData,
    requestWithdrawal,
    sendTip,
    refresh,
    fetchEarnings,
    fetchWithdrawals,
  };
};

// Custom hook for admin statistics
export const useAdminStats = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [adminData, setAdminData] = useState({
    stats: {
      totalUsers: 0,
      totalModels: 0,
      totalViewers: 0,
      activeModels: 0,
      totalTransactions: 0,
      platformRevenue: 0,
      pendingWithdrawals: 0,
      totalTokensPurchased: 0,
      dailyActiveUsers: 0,
    },
    users: [],
    withdrawals: [],
    settings: [],
    isLoading: false,
    error: null,
  });

  // Fetch platform statistics
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !isAdmin()) return;
    
    try {
      setAdminData(prev => ({ ...prev, isLoading: true }));
      const stats = await adminAPI.getPlatformStats();
      setAdminData(prev => ({
        ...prev,
        stats: stats,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      setAdminData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [isAuthenticated, isAdmin]);

  // Fetch all users
  const fetchUsers = useCallback(async (role = null, limit = 50, offset = 0) => {
    if (!isAuthenticated || !isAdmin()) return;
    
    try {
      const users = await adminAPI.getAllUsers(role, limit, offset);
      setAdminData(prev => ({
        ...prev,
        users: offset === 0 ? users : [...prev.users, ...users],
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [isAuthenticated, isAdmin]);

  // Fetch all withdrawals
  const fetchWithdrawals = useCallback(async (statusFilter = null, limit = 50, offset = 0) => {
    if (!isAuthenticated || !isAdmin()) return;
    
    try {
      const withdrawals = await adminAPI.getAllWithdrawals(statusFilter, limit, offset);
      setAdminData(prev => ({
        ...prev,
        withdrawals: offset === 0 ? withdrawals : [...prev.withdrawals, ...withdrawals],
      }));
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  }, [isAuthenticated, isAdmin]);

  // Process withdrawal (approve/reject)
  const processWithdrawal = useCallback(async (withdrawalId, action, data = {}) => {
    if (!isAuthenticated || !isAdmin()) {
      return { success: false, error: 'Authentication required' };
    }
    
    try {
      const response = await adminAPI.processWithdrawal(withdrawalId, action, data);
      
      if (response.success) {
        // Refresh withdrawals after processing
        setTimeout(() => fetchWithdrawals(), 1000);
        return { success: true, data: response };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, isAdmin, fetchWithdrawals]);

  // Update user status
  const updateUserStatus = useCallback(async (userId, isActive) => {
    if (!isAuthenticated || !isAdmin()) {
      return { success: false, error: 'Authentication required' };
    }
    
    try {
      const response = await adminAPI.updateUserStatus(userId, isActive);
      
      if (response.success) {
        // Refresh users after status update
        setTimeout(() => fetchUsers(), 1000);
        return { success: true, data: response };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, isAdmin, fetchUsers]);

  // Initialize data on mount
  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      fetchStats();
      fetchUsers();
      fetchWithdrawals();
    }
  }, [isAuthenticated, isAdmin, fetchStats, fetchUsers, fetchWithdrawals]);

  // Refresh all data
  const refresh = useCallback(() => {
    fetchStats();
    fetchUsers();
    fetchWithdrawals();
  }, [fetchStats, fetchUsers, fetchWithdrawals]);

  return {
    ...adminData,
    processWithdrawal,
    updateUserStatus,
    refresh,
    fetchStats,
    fetchUsers,
    fetchWithdrawals,
  };
};

export default { useTokens, useModelEarnings, useAdminStats };