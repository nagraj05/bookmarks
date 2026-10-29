import { NativeModule, requireOptionalNativeModule } from 'expo';

type ScreenLockEvents = {
  onScreenOff: () => void;
};

declare class ScreenLockNativeModule extends NativeModule<ScreenLockEvents> {}

const ScreenLock = requireOptionalNativeModule<ScreenLockNativeModule>('ScreenLock');

export function addScreenOffListener(listener: () => void) {
  return ScreenLock?.addListener('onScreenOff', listener) ?? { remove() {} };
}
