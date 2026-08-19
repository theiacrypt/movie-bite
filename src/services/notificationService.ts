class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
    return this.permission;
  }

  public isGranted(): boolean {
    return this.getPermission() === 'granted';
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch (e) {
      console.error('Fehler bei der Benachrichtigungsanfrage:', e);
      return false;
    }
  }

  public send(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isSupported() || !this.isGranted()) {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'movie-bite-alert',
        ...options
      });

      notification.onclick = () => {
        if (typeof window !== 'undefined') {
          window.focus();
          notification.close();
        }
      };

      return notification;
    } catch (e) {
      console.warn('Fehler beim Anzeigen der Benachrichtigung:', e);
      return null;
    }
  }

  public notifyPhaseChange(phase: string, roomCode?: string) {
    const codeStr = roomCode ? `[Raum ${roomCode}] ` : '';

    if (phase === 'ROUND_1_SUGGEST') {
      this.send(`🎬 ${codeStr}Runde 1 gestartet!`, {
        body: 'Schlage jetzt deine Wunschfilme vor, bevor das Voting beginnt!',
      });
    } else if (phase === 'ROUND_2_VOTE') {
      this.send(`🍿 ${codeStr}Das Voting läuft!`, {
        body: 'Gib jetzt deine Stimmen ab und wähle deinen Favoriten!',
      });
    } else if (phase === 'WINNER_SHOWDOWN') {
      this.send(`🏆 ${codeStr}Der Gewinner steht fest!`, {
        body: 'Schau dir das Ergebnis an und finde heraus, welcher Film gewonnen hat!',
      });
    }
  }
}

export const notificationService = new NotificationService();
