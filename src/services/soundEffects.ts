// Sound effects disabled
class SoundManager {
  public enabled: boolean = false;
  playPop() {}
  playLike() {}
  playDislike() {}
  playSuperlike() {}
  playFanfare() {}
  playWinner() {}
  playMatch() {}
  playCountdown() {}
}

export const soundFx = new SoundManager();

