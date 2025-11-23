export default async (ctx, context) => {
  const { database } = context;
  const { isGroup, isOwner, userDb } = ctx;

  const botDb = await database.getBot();

  if (botDb?.mode === 'group' && !isGroup() && !isOwner && !userDb?.premium) return false;
  if (botDb?.mode === 'private' && isGroup() && !isOwner && !userDb?.premium) return false;
  if (botDb?.mode === 'self' && !isOwner) return false;

  return true;
};
