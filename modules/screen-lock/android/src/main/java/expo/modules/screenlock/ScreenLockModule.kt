package expo.modules.screenlock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val SCREEN_OFF_EVENT = "onScreenOff"

class ScreenLockModule : Module() {
  private var screenOffReceiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("ScreenLock")
    Events(SCREEN_OFF_EVENT)

    OnStartObserving(SCREEN_OFF_EVENT) {
      registerScreenOffReceiver()
    }

    OnStopObserving(SCREEN_OFF_EVENT) {
      unregisterScreenOffReceiver()
    }

    OnDestroy {
      unregisterScreenOffReceiver()
    }
  }

  private fun registerScreenOffReceiver() {
    if (screenOffReceiver != null) return
    val context = appContext.reactContext ?: return
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_SCREEN_OFF) {
          sendEvent(SCREEN_OFF_EVENT)
        }
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(receiver, IntentFilter(Intent.ACTION_SCREEN_OFF), Context.RECEIVER_EXPORTED)
    } else {
      @Suppress("DEPRECATION")
      context.registerReceiver(receiver, IntentFilter(Intent.ACTION_SCREEN_OFF))
    }
    screenOffReceiver = receiver
  }

  private fun unregisterScreenOffReceiver() {
    val receiver = screenOffReceiver ?: return
    runCatching { appContext.reactContext?.unregisterReceiver(receiver) }
    screenOffReceiver = null
  }
}
