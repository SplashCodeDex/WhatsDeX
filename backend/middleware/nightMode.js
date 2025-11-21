import moment from 'moment-timezone';

export default async (ctx, context) => {
  const { config } = context;
  const { isOwner, userDb } = ctx;

  const now = moment().tz(config.system.timeZone);
  const hour = now.hour();
  if (hour >= 0 && hour < 6 && !isOwner && !userDb?.premium) return false;

  return true;
};
