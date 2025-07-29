package com.brainbites.timer

import android.app.*
import android.content.Intent
import android.os.*
import com.brainbites.timer.notifications.BrainBitesNotificationManager
import android.content.Context
import android.os.PowerManager
import android.os.PowerManager.WakeLock
import com.brainbites.permissions.NotificationPermissionHandler

class ScreenTimeService : Service() {
    companion object {
        private const val WAKE_LOCK_TAG = "BrainBites:TimerWakeLock"
        
        // Actions
        const val ACTION_START = "com.brainbites.timer.START"
        const val ACTION_PAUSE = "com.brainbites.timer.PAUSE"
        const val ACTION_STOP = "com.brainbites.timer.STOP"
    }

    private var wakeLock: WakeLock? = null
    private val binder = LocalBinder()
    private var isRunning = false
    private var timerHandler = Handler(Looper.getMainLooper())
    private var screenTimeManager: ScreenTimeManager? = null
    private lateinit var notificationManager: BrainBitesNotificationManager
    
    inner class LocalBinder : Binder() {
        fun getService(): ScreenTimeService = this@ScreenTimeService
    }

    override fun onCreate() {
        super.onCreate()
        screenTimeManager = ScreenTimeManager.getInstance(applicationContext)
        notificationManager = BrainBitesNotificationManager.getInstance(applicationContext)
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startTimer()
            ACTION_PAUSE -> pauseTimer()
            ACTION_STOP -> stopTimer()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent): IBinder {
        return binder
    }

    private fun startTimer() {
        if (!isRunning && NotificationPermissionHandler.checkNotificationPermission(applicationContext)) {
            isRunning = true
            screenTimeManager?.let { manager ->
                startForeground(
                    BrainBitesNotificationManager.NOTIFICATION_TIMER,
                    notificationManager.createTimerNotification(manager.getTimerState())
                )
            }
            startTimeTracking()
        }
    }

    private fun pauseTimer() {
        isRunning = false
        screenTimeManager?.pauseTimer()
        if (NotificationPermissionHandler.checkNotificationPermission(applicationContext)) {
            updateNotification()
        }
    }

    private fun stopTimer() {
        isRunning = false
        screenTimeManager?.stopTimer()
        stopForeground(true)
        stopSelf()
    }

    private fun startTimeTracking() {
        screenTimeManager?.startTimer()
        timerHandler.post(object : Runnable {
            override fun run() {
                if (isRunning) {
                    if (NotificationPermissionHandler.checkNotificationPermission(applicationContext)) {
                        updateNotification()
                        screenTimeManager?.let { manager ->
                            notificationManager.checkAndShowWarnings(manager.getTimerState())
                        }
                    }
                    timerHandler.postDelayed(this, 1000)
                }
            }
        })
    }

    private fun updateNotification() {
        screenTimeManager?.let { manager ->
            val notification = notificationManager.createTimerNotification(manager.getTimerState())
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(BrainBitesNotificationManager.NOTIFICATION_TIMER, notification)
        }
    }

    private fun acquireWakeLock() {
        wakeLock = (getSystemService(Context.POWER_SERVICE) as PowerManager).run {
            newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG).apply {
                acquire()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        wakeLock?.release()
        timerHandler.removeCallbacksAndMessages(null)
    }
} 