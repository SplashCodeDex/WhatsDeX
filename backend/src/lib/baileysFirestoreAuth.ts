import { AuthenticationState, AuthenticationCreds, BufferJSON, initAuthCreds, proto } from 'baileys';
import { firebaseService } from '@/services/FirebaseService.js';

/**
 * Custom Baileys Auth State using Firestore subcollections
 * Structure: tenants/{tenantId}/bots/{botId}/auth/{type}
 */
export async function useFirestoreAuthState(tenantId: string, botId: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> {

  const writeData = async (data: any, id: string) => {
    const serialized = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
    // Wrap in object to ensure it is a valid Firestore document (cannot be primitive)
    await (firebaseService as any).setDoc(`bots/${botId}/auth`, id, { value: serialized }, tenantId);
  };

  const readData = async (id: string) => {
    try {
      const doc = await (firebaseService as any).getDoc(`bots/${botId}/auth`, id, tenantId);
      if (doc && 'value' in doc) {
        return JSON.parse(JSON.stringify((doc as any).value), BufferJSON.reviver);
      }
      // Backward compatibility for existing docs (if any) or handle potential direct saves
      if (doc) {
        return JSON.parse(JSON.stringify(doc), BufferJSON.reviver);
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const removeData = async (id: string) => {
    // Note: FirebaseService doesn't have deleteDoc yet, but we'll add it or mock it
    // For now, setting to empty as placeholder
    await (firebaseService as any).setDoc(`bots/${botId}/auth`, id, { deleted: true }, tenantId);
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
