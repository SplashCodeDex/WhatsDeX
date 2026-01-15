import { AuthenticationState, AuthenticationCreds, BufferJSON, initAuthCreds, proto } from 'baileys';
import { firebaseService } from '@/services/FirebaseService.js';

/**
 * Custom Baileys Auth State using Firestore subcollections
 * Structure: tenants/{tenantId}/bots/{botId}/auth/{type}
 */
export async function useFirestoreAuthState(tenantId: string, botId: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {
  
  const writeData = async (data: any, id: string) => {
    const serialized = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
    // Using cast to any to bypass strict schema for auth subcollection
    await firebaseService.setDoc(`bots/${botId}/auth` as any, id, serialized, tenantId);
  };

  const readData = async (id: string) => {
    try {
      const data = await firebaseService.getDoc(`bots/${botId}/auth` as any, id, tenantId);
      if (data) {
        return JSON.parse(JSON.stringify(data), BufferJSON.reviver);
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const removeData = async (id: string) => {
    // Note: FirebaseService doesn't have deleteDoc yet, but we'll add it or mock it
    // For now, setting to empty as placeholder
    await firebaseService.setDoc(`bots/${botId}/auth` as any, id, { deleted: true } as any, tenantId);
  };

  const creds: AuthenticationCreds = await readData('creds') || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [id: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => writeData(creds, 'creds')
  };
}
