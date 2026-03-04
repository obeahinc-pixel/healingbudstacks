import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDrGreenApi } from './useDrGreenApi';
import { useToast } from './use-toast';

interface DrGreenClient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isKYCVerified: boolean;
  adminApproval: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  phoneCode?: string;
  phoneCountryCode?: string;
  contactNumber?: string;
  shippings?: Array<{ country: string; currency: string }>;
  nft?: { ownerId: string; tokenId: number };
}

interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

interface ClientSummary {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  kycVerified: number;
}

export function useDrGreenClientSync() {
  const { getDappClients, getDappOrders } = useDrGreenApi();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [clients, setClients] = useState<DrGreenClient[]>([]);
  const [summary, setSummary] = useState<ClientSummary | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all clients from Dr. Green API
  const fetchClients = useCallback(async (page = 1, take = 50) => {
    setError(null);
    try {
      const { data, error: apiError } = await getDappClients({ page, take, orderBy: 'desc' });
      if (apiError) {
        setError(apiError);
        return { clients: [], total: 0 };
      }
      if (data?.clients) {
        setClients(data.clients as unknown as DrGreenClient[]);
        return { clients: data.clients as unknown as DrGreenClient[], total: data.total || 0 };
      }
      return { clients: [], total: 0 };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch clients';
      setError(message);
      return { clients: [], total: 0 };
    }
  }, [getDappClients]);

  // Compute summary from fetched clients
  const fetchSummary = useCallback(async () => {
    try {
      const { clients: allClients, total } = await fetchClients(1, 100);
      if (allClients.length > 0) {
        const summaryData: ClientSummary = {
          total,
          verified: allClients.filter((c: any) => c.adminApproval === 'VERIFIED').length,
          pending: allClients.filter((c: any) => c.adminApproval === 'PENDING').length,
          rejected: allClients.filter((c: any) => c.adminApproval === 'REJECTED').length,
          kycVerified: allClients.filter((c: any) => c.isKYCVerified).length,
        };
        setSummary(summaryData);
        return summaryData;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      return null;
    }
  }, [fetchClients]);

  // Sync Dr. Green clients to local Supabase table
  const syncClientsToSupabase = useCallback(async (): Promise<SyncResult> => {
    setSyncing(true);
    setError(null);
    
    const result: SyncResult = { synced: 0, created: 0, updated: 0, errors: [] };

    try {
      // Fetch all clients from Dr. Green (paginate)
      let allClients: DrGreenClient[] = [];
      let page = 1;
      const take = 50;
      let hasMore = true;

      while (hasMore) {
        const { clients: pageClients, total } = await fetchClients(page, take);
        allClients = [...allClients, ...pageClients];
        hasMore = allClients.length < total;
        page++;
        if (page > 20) break;
      }

      // Upsert each client to local DB
      for (const client of allClients) {
        try {
          const { data: existing } = await supabase
            .from('drgreen_clients')
            .select('id, is_kyc_verified, admin_approval')
            .eq('drgreen_client_id', client.id)
            .maybeSingle();

          const countryCode = client.shippings?.[0]?.country || client.phoneCountryCode || 'PT';

          if (existing) {
            if (existing.is_kyc_verified !== client.isKYCVerified || existing.admin_approval !== client.adminApproval) {
              const { error: updateError } = await supabase
                .from('drgreen_clients')
                .update({
                  is_kyc_verified: client.isKYCVerified,
                  admin_approval: client.adminApproval,
                  email: client.email,
                  full_name: `${client.firstName} ${client.lastName}`.trim(),
                  country_code: countryCode,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);

              if (updateError) {
                result.errors.push(`Update ${client.email}: ${updateError.message}`);
              } else {
                result.updated++;
              }
            }
            result.synced++;
          } else {
            // Try to find a matching auth user by email to link
            console.log(`External client (no local record): ${client.email}`);
            result.synced++;
          }
        } catch (clientErr) {
          result.errors.push(`Client ${client.id}: ${clientErr instanceof Error ? clientErr.message : 'Unknown error'}`);
        }
      }

      // Also sync orders from Dr. Green API
      await syncOrdersFromApi(result);

      setClients(allClients);
      setLastSyncAt(new Date());

      toast({
        title: 'Sync Complete',
        description: `${result.synced} clients, ${result.updated} updated. Orders synced.`,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      result.errors.push(message);
      toast({ title: 'Sync Failed', description: message, variant: 'destructive' });
      return result;
    } finally {
      setSyncing(false);
    }
  }, [fetchClients, toast]);

  // Sync orders from Dr. Green API to local drgreen_orders table
  const syncOrdersFromApi = useCallback(async (result: SyncResult) => {
    try {
      let allOrders: any[] = [];
      let page = 1;
      const take = 50;
      let hasMore = true;

      while (hasMore) {
        const { data, error: apiError } = await getDappOrders({ page, take, orderBy: 'desc' });
        if (apiError || !data?.orders) break;
        allOrders = [...allOrders, ...data.orders];
        hasMore = allOrders.length < (data.total || 0);
        page++;
        if (page > 20) break;
      }

      // Get current user for user_id (admin performing sync)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const order of allOrders) {
        try {
          const { data: existing } = await supabase
            .from('drgreen_orders')
            .select('id, status, payment_status')
            .eq('drgreen_order_id', order.id)
            .maybeSingle();

          if (existing) {
            // Update if status changed
            const newStatus = order.orderStatus || order.status || 'PENDING';
            const newPayment = order.paymentStatus || 'PENDING';
            if (existing.status !== newStatus || existing.payment_status !== newPayment) {
              await supabase.from('drgreen_orders').update({
                status: newStatus,
                payment_status: newPayment,
                total_amount: order.totalAmount || order.totalPrice || 0,
                synced_at: new Date().toISOString(),
                sync_status: 'synced',
                updated_at: new Date().toISOString(),
              }).eq('id', existing.id);
            }
          } else {
            // Insert new order
            await supabase.from('drgreen_orders').insert({
              drgreen_order_id: order.id,
              user_id: user.id,
              status: order.orderStatus || order.status || 'PENDING',
              payment_status: order.paymentStatus || 'PENDING',
              total_amount: order.totalAmount || order.totalPrice || 0,
              items: order.items || [],
              client_id: order.clientId || null,
              customer_email: order.client?.email || null,
              customer_name: order.client ? `${order.client.firstName || ''} ${order.client.lastName || ''}`.trim() : null,
              country_code: order.client?.shippings?.[0]?.country || null,
              currency: order.currency || 'EUR',
              synced_at: new Date().toISOString(),
              sync_status: 'synced',
            });
            result.created++;
          }
        } catch (orderErr) {
          result.errors.push(`Order ${order.id}: ${orderErr instanceof Error ? orderErr.message : 'Unknown'}`);
        }
      }
    } catch (err) {
      console.error('Order sync error:', err);
      result.errors.push(`Order sync: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }, [getDappOrders]);

  // Check if a specific client is verified
  const checkClientStatus = useCallback(async (email: string) => {
    try {
      const { data, error: apiError } = await getDappClients({ search: email, searchBy: 'email', take: 1 });
      if (apiError || !data?.clients?.length) {
        return { exists: false, isKYCVerified: false, adminApproval: 'PENDING', drGreenClientId: null };
      }
      const client = data.clients[0] as unknown as DrGreenClient;
      return { exists: true, isKYCVerified: client.isKYCVerified, adminApproval: client.adminApproval, drGreenClientId: client.id };
    } catch {
      return { exists: false, isKYCVerified: false, adminApproval: 'PENDING', drGreenClientId: null };
    }
  }, [getDappClients]);

  // Link a Supabase user to their Dr. Green client record by email
  const linkUserToClient = useCallback(async (userId: string, email: string): Promise<boolean> => {
    try {
      const status = await checkClientStatus(email);
      if (!status.exists || !status.drGreenClientId) return false;

      const { data: existing } = await supabase
        .from('drgreen_clients').select('id').eq('user_id', userId).maybeSingle();

      if (existing) {
        const { error } = await supabase.from('drgreen_clients').update({
          drgreen_client_id: status.drGreenClientId,
          is_kyc_verified: status.isKYCVerified,
          admin_approval: status.adminApproval,
          email,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
        return !error;
      } else {
        const { error } = await supabase.from('drgreen_clients').insert({
          user_id: userId,
          drgreen_client_id: status.drGreenClientId,
          is_kyc_verified: status.isKYCVerified,
          admin_approval: status.adminApproval,
          email,
          country_code: 'PT',
        });
        return !error;
      }
    } catch (err) {
      console.error('Failed to link user:', err);
      return false;
    }
  }, [checkClientStatus]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchClients(), fetchSummary()]);
  }, [fetchClients, fetchSummary]);

  return {
    clients, summary, syncing, error, lastSyncAt,
    fetchClients, fetchSummary, syncClientsToSupabase, checkClientStatus, linkUserToClient, refresh,
  };
}