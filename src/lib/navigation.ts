import { router } from 'expo-router';

export function goBackOrLibrary() {
  if (router.canDismiss()) {
    router.back();
  } else {
    router.replace('/');
  }
}
