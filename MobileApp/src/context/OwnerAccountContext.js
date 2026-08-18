import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL, { fetchWithAuth } from "../config/Api";

export const OwnerAccountContext = createContext();

export const OwnerAccountProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  // On mount: load from storage for instant display, then fetch from API
  useEffect(() => {
    const init = async () => {
      await loadAccountsFromStorage();
      await loadAccountsFromAPI();
    };
    init();
  }, []);

  const loadAccountsFromStorage = async () => {
    try {
      const storedAccounts = await AsyncStorage.getItem("owner_accounts_cache");
      const storedSelectedId = await AsyncStorage.getItem("selectedAccountId");

      if (storedAccounts) {
        const parsedAccounts = JSON.parse(storedAccounts);
        setAccounts(parsedAccounts);

        if (storedSelectedId) {
          const selected = parsedAccounts.find(acc => acc.id === storedSelectedId);
          if (selected) {
            setSelectedAccount(selected);
          } else if (parsedAccounts.length > 0) {
            setSelectedAccount(parsedAccounts[0]);
            await AsyncStorage.setItem("selectedAccountId", parsedAccounts[0].id);
          }
        } else if (parsedAccounts.length > 0) {
          setSelectedAccount(parsedAccounts[0]);
          await AsyncStorage.setItem("selectedAccountId", parsedAccounts[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading accounts from storage:", error);
    }
  };

  // Fetch accounts using the proven owner_accounts/<phone>/ endpoint
  const loadAccountsFromAPI = async () => {
    setLoading(true);
    try {
      // Get the owner's phone number from AsyncStorage (set during login)
      const ownerPhone = await AsyncStorage.getItem("ownerPhone");
      if (!ownerPhone) {
        console.log("OwnerAccountContext: No ownerPhone in storage, skipping API fetch");
        setLoading(false);
        return;
      }

      const trimmedPhone = ownerPhone.trim();

      // Use the proven endpoint that works: /api/owner_accounts/<phone>/
      const response = await fetchWithAuth(
        `${BASE_URL}/api/owner_accounts/${encodeURIComponent(trimmedPhone)}/`
      );

      if (response.ok) {
        const responseData = await response.json();
        // The response has { accounts: [...] } structure
        const rawAccounts = responseData.accounts || responseData || [];
        
        // Normalize: ensure id is a string
        const normalized = rawAccounts.map(acc => ({
          ...acc,
          id: String(acc.id),
        }));

        setAccounts(normalized);
        await AsyncStorage.setItem("owner_accounts_cache", JSON.stringify(normalized));

        // Set selected account — prefer active accounts, never auto-select suspended ones
        const storedSelectedId = await AsyncStorage.getItem("selectedAccountId");
        let active = normalized.find(acc => acc.id === storedSelectedId && acc.status !== "suspend");
        if (!active) {
          // Pick first non-suspended account
          active = normalized.find(acc => acc.status !== "suspend");
        }
        if (!active && normalized.length > 0) {
          // All accounts suspended — pick first but don't auto-set so caller can handle
          active = null;
        }

        if (active) {
          setSelectedAccount(active);
          await AsyncStorage.setItem("selectedAccountId", active.id);
        } else {
          setSelectedAccount(null);
          await AsyncStorage.removeItem("selectedAccountId");
        }
      } else {
        console.log("OwnerAccountContext: API response not ok:", response.status);
      }
    } catch (error) {
      console.error("Error fetching accounts from backend:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAccounts = async () => {
    await loadAccountsFromAPI();
  };

  // Switch the selected account
  const switchAccount = async (accountId) => {
    setLoading(true);
    try {
      // Try in-memory state first
      let targetAccount = accounts.find(acc => acc.id === accountId);

      // Fallback: read from cache (handles timing when called right after refreshAccounts)
      if (!targetAccount) {
        const cachedRaw = await AsyncStorage.getItem("owner_accounts_cache");
        if (cachedRaw) {
          const cachedAccounts = JSON.parse(cachedRaw);
          targetAccount = cachedAccounts.find(acc => String(acc.id) === String(accountId));
          if (cachedAccounts.length > 0) {
            setAccounts(cachedAccounts);
          }
        }
      }

      if (targetAccount) {
        setSelectedAccount(targetAccount);
        await AsyncStorage.setItem("selectedAccountId", String(accountId));
        await AsyncStorage.setItem("ownerPhone", String(accountId));
      }
      return { success: true };
    } catch (error) {
      console.error("Error switching account:", error);
      return { success: false, error: "Network error" };
    } finally {
      setLoading(false);
    }
  };

  // Add another property account
  const addAccount = async (action, data = {}) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/owner/accounts/add/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...data }),
      });

      if (response.ok) {
        await loadAccountsFromAPI();
        return { success: true };
      } else {
        const errData = await response.json();
        return { success: false, error: errData.error || "Failed to add account" };
      }
    } catch (error) {
      console.error("Error adding account:", error);
      return { success: false, error: "Network error" };
    } finally {
      setLoading(false);
    }
  };

  const removeAccount = async (accountId) => {
    // Remove account locally
    const updated = accounts.filter(acc => acc.id !== accountId);
    setAccounts(updated);
    await AsyncStorage.setItem("owner_accounts_cache", JSON.stringify(updated));
    if (selectedAccount && selectedAccount.id === accountId) {
      if (updated.length > 0) {
        setSelectedAccount(updated[0]);
        await AsyncStorage.setItem("selectedAccountId", updated[0].id);
      } else {
        setSelectedAccount(null);
        await AsyncStorage.removeItem("selectedAccountId");
      }
    }
  };

  return (
    <OwnerAccountContext.Provider
      value={{
        accounts,
        selectedAccount,
        loading,
        loadAccounts: loadAccountsFromAPI,
        switchAccount,
        refreshAccounts,
        addAccount,
        removeAccount,
      }}
    >
      {children}
    </OwnerAccountContext.Provider>
  );
};
