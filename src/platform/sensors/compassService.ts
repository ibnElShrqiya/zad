export type CompassStatus = 'unsupported' | 'prompt' | 'granted' | 'denied' | 'calibrating';

export interface CompassReading {
  heading: number; // 0 to 360 degrees (0 = North)
  accuracy?: number;
  status: CompassStatus;
  errorMessage?: string;
}

export type CompassCallback = (reading: CompassReading) => void;

export class CompassService {
  private listener: ((event: DeviceOrientationEvent) => void) | null = null;
  private currentHeading: number = 0;
  private status: CompassStatus = 'prompt';

  constructor() {
    if (typeof window !== 'undefined' && !('DeviceOrientationEvent' in window)) {
      this.status = 'unsupported';
    }
  }

  isSensorAvailable(): boolean {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  }

  async requestPermissionAndStart(callback: CompassCallback): Promise<boolean> {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      this.status = 'unsupported';
      callback({
        heading: 0,
        status: 'unsupported',
        errorMessage: 'حساس البوصلة غير متوفر في هذا الجهاز.',
      });
      return false;
    }

    const DeviceOrientationEventAny = window.DeviceOrientationEvent as any;

    // iOS 13+ permission request
    if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response !== 'granted') {
          this.status = 'denied';
          callback({
            heading: 0,
            status: 'denied',
            errorMessage: 'تم رفض إذن الوصول لحساس البوصلة.',
          });
          return false;
        }
      } catch (err) {
        this.status = 'denied';
        callback({
          heading: 0,
          status: 'denied',
          errorMessage: 'حدث خطأ أثناء طلب إذن البوصلة.',
        });
        return false;
      }
    }

    this.status = 'granted';
    this.startListening(callback);
    return true;
  }

  private startListening(callback: CompassCallback): void {
    this.stopListening();

    this.listener = (event: DeviceOrientationEvent) => {
      let heading = 0;

      // iOS Safari provides webkitCompassHeading directly (degrees relative to magnetic north)
      if ((event as any).webkitCompassHeading !== undefined) {
        heading = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Android / standard: alpha is rotation around z-axis
        heading = 360 - event.alpha;
      }

      heading = (heading + 360) % 360;
      this.currentHeading = Math.round(heading);

      callback({
        heading: this.currentHeading,
        status: 'granted',
      });
    };

    window.addEventListener('deviceorientation', this.listener, true);
  }

  stopListening(): void {
    if (this.listener) {
      window.removeEventListener('deviceorientation', this.listener, true);
      this.listener = null;
    }
  }
}

export const compassService = new CompassService();
