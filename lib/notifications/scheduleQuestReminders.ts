import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/*
 * Local-only reminder scheduling. There is no backend or push service here,
 * and Expo cannot guarantee delivery if the OS aggressively kills the app or
 * deprioritizes scheduled notifications.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const QUEST_REMINDER_CHANNEL = 'quest-reminders';

export const reminderIds = {
  dailyQuest: 'daily-quest-reminder',
  noFapCheckIn: 'nofap-checkin-reminder',
  focusWorkout: 'focus-workout-reminder',
} as const;

export type ReminderId = (typeof reminderIds)[keyof typeof reminderIds];

// Where a tapped notification should deep-link to. Keys must stay in sync with reminderIds above.
export const reminderRoutes: Record<ReminderId, string> = {
  [reminderIds.dailyQuest]: '/dashboard',
  [reminderIds.noFapCheckIn]: '/no-fap',
  [reminderIds.focusWorkout]: '/workout-progress',
};

export async function requestNotificationPermission(): Promise<boolean> {
  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (finalStatus !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(QUEST_REMINDER_CHANNEL, {
      name: 'Quest Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 80, 150],
      lightColor: '#C9A227',
    });
  }

  return true;
}

export async function scheduleDailyReminder(
  id: string,
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<void> {
  await cancelReminder(id);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: false,
      data: {
        reminderId: id,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? QUEST_REMINDER_CHANNEL : undefined,
    },
  });
}

export async function cancelReminder(id: string): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    scheduledNotifications
      .filter((notification) => notification.content.data?.reminderId === id)
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier))
  );
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function getReminderCopy(reminderType: 'dailyQuest' | 'noFapCheckIn' | 'focusWorkout'): {
  title: string;
  body: string;
} {
  switch (reminderType) {
    case 'dailyQuest':
      return {
        title: '📜 QUEST LOG',
        body: '2 main quests still open today, Hunter. Close them before the penalty window shuts.',
      };
    case 'noFapCheckIn':
      return {
        title: '🔥 STREAK AT RISK',
        body: 'Your NoFap streak breaks at midnight if today remains unlogged.',
      };
    case 'focusWorkout':
      return {
        title: '⚠ SYSTEM ALERT',
        body: 'Workout block missing. Claim one clean session before the day resets.',
      };
    default:
      return {
        title: '⚠ SYSTEM ALERT',
        body: 'A daily system task is still unresolved.',
      };
  }
}
