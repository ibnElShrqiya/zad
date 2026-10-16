import { QuranReciterId, ReciterInfo } from '../../domain/settings/types';

export interface RecitationTrack {
  surahNumber: number;
  surahName: string;
  ayahNumberInSurah: number;
  globalAyahNumber: number;
  audioUrl: string;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTrack: RecitationTrack | null;
  currentTime: number;
  duration: number;
  progressPercent: number;
  repeatMode: 'none' | 'ayah' | 'surah';
  reciterId: QuranReciterId;
  playbackSpeed: number;
  error: string | null;
}

export const AVAILABLE_RECITERS: Record<QuranReciterId, ReciterInfo> = {
  'ar.alafasy': {
    id: 'ar.alafasy',
    nameAr: 'مشاري راشد العفاسي',
    nameEn: 'Mishary Rashid Alafasy',
    styleAr: 'مرتل مهدئ ومتقن',
    serverUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy',
  },
  'ar.abdulbasitmurattal': {
    id: 'ar.abdulbasitmurattal',
    nameAr: 'عبد الباسط عبد الصمد',
    nameEn: 'Abdul Basit Murattal',
    styleAr: 'مرتل برواية حفص',
    serverUrl: 'https://cdn.islamic.network/quran/audio/128/ar.abdulbasitmurattal',
  },
  'ar.husary': {
    id: 'ar.husary',
    nameAr: 'محمود خليل الحصري',
    nameEn: 'Mahmoud Khalil Al-Husary',
    styleAr: 'معلم متقن الأحكام',
    serverUrl: 'https://cdn.islamic.network/quran/audio/128/ar.husary',
  },
  'ar.saoodshuraym': {
    id: 'ar.saoodshuraym',
    nameAr: 'سعود الشريم',
    nameEn: 'Saud Ash-Shuraim',
    styleAr: 'تلاوة المسجد الحرام',
    serverUrl: 'https://cdn.islamic.network/quran/audio/128/ar.saoodshuraym',
  },
};

export type AudioStateListener = (state: AudioPlaybackState) => void;

/**
 * Service interface for Quran recitation playback.
 * Clean abstraction ready to be ported directly to Flutter using `just_audio`.
 */
export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private state: AudioPlaybackState = {
    isPlaying: false,
    isBuffering: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    progressPercent: 0,
    repeatMode: 'none',
    reciterId: 'ar.alafasy',
    playbackSpeed: 1.0,
    error: null,
  };
  private listeners: Set<AudioStateListener> = new Set();
  private onTrackEndedCallback?: () => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.attachListeners();
    }
  }

  private attachListeners(): void {
    if (!this.audio) return;

    this.audio.addEventListener('playing', () => {
      this.updateState({ isPlaying: true, isBuffering: false, error: null });
    });

    this.audio.addEventListener('waiting', () => {
      this.updateState({ isBuffering: true });
    });

    this.audio.addEventListener('pause', () => {
      this.updateState({ isPlaying: false });
    });

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) return;
      const cur = this.audio.currentTime;
      const dur = this.audio.duration || 1;
      this.updateState({
        currentTime: cur,
        duration: dur,
        progressPercent: (cur / dur) * 100,
      });
    });

    this.audio.addEventListener('ended', () => {
      if (this.state.repeatMode === 'ayah') {
        this.replayCurrent();
      } else if (this.onTrackEndedCallback) {
        this.onTrackEndedCallback();
      } else {
        this.updateState({ isPlaying: false, progressPercent: 100 });
      }
    });

    this.audio.addEventListener('error', () => {
      this.updateState({
        isPlaying: false,
        isBuffering: false,
        error: 'تعذر تشغيل التلاوة، يرجى التحقق من الاتصال بالإنترنت.',
      });
    });
  }

  private updateState(partial: Partial<AudioPlaybackState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AudioPlaybackState {
    return this.state;
  }

  setReciter(reciterId: QuranReciterId): void {
    this.updateState({ reciterId });
  }

  setOnTrackEnded(cb: () => void): void {
    this.onTrackEndedCallback = cb;
  }

  getAyahAudioUrl(globalAyahNumber: number, reciterId?: QuranReciterId): string {
    const reciter = AVAILABLE_RECITERS[reciterId || this.state.reciterId] || AVAILABLE_RECITERS['ar.alafasy'];
    return `${reciter.serverUrl}/${globalAyahNumber}.mp3`;
  }

  playAyah(track: RecitationTrack): void {
    if (!this.audio) return;

    this.updateState({
      currentTrack: track,
      isBuffering: true,
      error: null,
    });

    this.audio.src = track.audioUrl;
    this.audio.playbackRate = this.state.playbackSpeed;
    this.audio
      .play()
      .then(() => {
        this.updateMediaSession(track);
      })
      .catch((err) => {
        console.warn('Playback error:', err);
        this.updateState({
          isPlaying: false,
          isBuffering: false,
          error: 'تعذر بدء التشغيل الصوتي',
        });
      });
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  resume(): void {
    if (this.audio && this.audio.src) {
      this.audio.play().catch(console.warn);
    }
  }

  seek(percent: number): void {
    if (this.audio && this.audio.duration) {
      const targetTime = (percent / 100) * this.audio.duration;
      this.audio.currentTime = targetTime;
    }
  }

  setPlaybackSpeed(speed: number): void {
    if (this.audio) {
      this.audio.playbackRate = speed;
      this.updateState({ playbackSpeed: speed });
    }
  }

  setRepeatMode(mode: 'none' | 'ayah' | 'surah'): void {
    this.updateState({ repeatMode: mode });
  }

  replayCurrent(): void {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(console.warn);
    }
  }

  private updateMediaSession(track: RecitationTrack): void {
    if ('mediaSession' in navigator && window.MediaMetadata) {
      const reciter = AVAILABLE_RECITERS[this.state.reciterId];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `سورة ${track.surahName} - الآية ${track.ayahNumberInSurah}`,
        artist: reciter?.nameAr || 'زاد المسلم',
        album: 'القرآن الكريم — تطبيق زاد',
      });

      navigator.mediaSession.setActionHandler('play', () => this.resume());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
    }
  }
}

export const audioService = new AudioService();
