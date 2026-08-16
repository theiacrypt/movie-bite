// Sound effects disabled
class SoundManager {
  public enabled: boolean = false;
  playPop() {}
  playLike() {}
  playDislike() {}
  playSuperlike() {}
  playFanfare() {}
}

export const soundFx = new SoundManager();

