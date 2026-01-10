// src/hooks/useAudioChannel.ts
import { useEffect, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

export function useAudioChannel(audioFile: any) {
  const sound = useRef<Audio.Sound | null>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    loadSound();
    return () => {
      unloadSound();
    };
  }, []);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioFile,
        { isLooping: true, volume: 0 },
        onPlaybackStatusUpdate
      );
      sound.current = newSound;
      isLoaded.current = true;
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const unloadSound = async () => {
    if (sound.current) {
      await sound.current.unloadAsync();
      sound.current = null;
      isLoaded.current = false;
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Playback error: ${status.error}`);
      }
    }
  };

  const play = async (volume: number = 0.7) => {
    if (sound.current && isLoaded.current) {
      try {
        await sound.current.setVolumeAsync(volume);
        const status = await sound.current.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await sound.current.playAsync();
        }
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  };

  const pause = async () => {
    if (sound.current && isLoaded.current) {
      try {
        await sound.current.pauseAsync();
        await sound.current.setPositionAsync(0);
      } catch (error) {
        console.error('Error pausing sound:', error);
      }
    }
  };

  const setVolume = async (volume: number) => {
    if (sound.current && isLoaded.current) {
      try {
        await sound.current.setVolumeAsync(volume);
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
  };

  return { play, pause, setVolume };
}