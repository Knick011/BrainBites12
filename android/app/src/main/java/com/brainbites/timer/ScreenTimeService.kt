package com.brainbites.timer

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import android.app.PendingIntent
import com.brainbites.MainActivity
import com.brainbites.R
import com.brainbites.timer.notifications.BrainBitesNotificationManager
import com.brainbites.permissions.NotificationPermissionHandler

class ScreenTimeService : Service() {
    
    private lateinit var powerManager: PowerManager
    private lateinit var keyguardManager: KeyguardManager
    private lateinit var sharedPrefs: SharedPreferences
    private lateinit var notificationManagerCompat: NotificationManager
    private lateinit var notificationManager: BrainBitesNotificationManager
    
    private val handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null
    private var wakeLock: PowerManager.WakeLock? = null
    
    private var remainingTimeSeconds = 0
    private var todayScreenTimeSeconds = 0
    private var sessionStartTime = 0L
    private var isAppInForeground = false
    private var lastTickTime = 0L
    private var screenTimeManager: ScreenTimeManager? = null
    
    companion object {
        private const val TAG = "ScreenTimeService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "brainbites_timer_channel"
        private const val PREFS_NAME = "BrainBitesTimerPrefs"
        private const val KEY_REMAINING_TIME = "remaining_time"
        private const val KEY_TODAY_SCREEN_TIME = "today_screen_time"
        private const val KEY_LAST_SAVE_DATE = "last_save_date"
        private const val UPDATE_INTERVAL = 1000L // 1 second for smooth updates
        
        // Actions
        const val ACTION_START = "com.brainbites.timer.START"
        const val ACTION_PAUSE = "com.brainbites.timer.PAUSE" 
        const val ACTION_STOP = "com.brainbites.timer.STOP"
        const val ACTION_UPDATE_TIME = "update_time"
        const val ACTION_ADD_TIME = "add_time"
        const val ACTION_APP_FOREGROUND = "app_foreground"
        const val ACTION_APP_BACKGROUND = "app_background"
        const val EXTRA_TIME_SECONDS = "time_seconds"
    }
    
    private val binder = LocalBinder()
    
    inner class LocalBinder : android.os.Binder() {
        fun getService(): ScreenTimeService = this@ScreenTimeService
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "✅ ScreenTimeService created")
        
        powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        sharedPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        notificationManagerCompat = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager = BrainBitesNotificationManager.getInstance(applicationContext)
        screenTimeManager = ScreenTimeManager.getInstance(applicationContext)
        
        createNotificationChannel()
        loadSavedData()
        acquireWakeLock()
        
        Log.d(TAG, "✅ Service initialized with ${remainingTimeSeconds}s remaining, ${todayScreenTimeSeconds}s used today")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "✅ onStartCommand: ${intent?.action}")
        
        when (intent?.action) {
            ACTION_START -> startTimer()
            ACTION_PAUSE -> pauseTimer()
            ACTION_STOP -> stopTimer()
            ACTION_UPDATE_TIME -> {
                val timeSeconds = intent.getIntExtra(EXTRA_TIME_SECONDS, 0)
                updateRemainingTime(timeSeconds)
                startTimer()
            }
            ACTION_ADD_TIME -> {
                val timeSeconds = intent.getIntExtra(EXTRA_TIME_SECONDS, 0)
                addTime(timeSeconds)
            }
            ACTION_APP_FOREGROUND -> handleAppForeground()
            ACTION_APP_BACKGROUND -> handleAppBackground()
            else -> {
                // Default - start if we have time
                if (remainingTimeSeconds > 0) {
                    startTimer()
                }
            }
        }
        
        return START_STICKY
    }
    
    override fun onBind(intent: Intent): IBinder = binder

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "✅ ScreenTimeService destroyed - cleaning up")
        releaseWakeLock()
        stopTimer()
        saveData()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "BrainBites Screen Time Timer",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Shows remaining app time and screen time used"
            setShowBadge(false)
            setSound(null, null)
            enableLights(true)
            lightColor = 0xFFFF9F1C.toInt() // Theme orange
        }
        notificationManagerCompat.createNotificationChannel(channel)
    }

    private fun acquireWakeLock() {
        try {
            wakeLock?.release() // Release existing first
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "$TAG::TimerWakeLock"
            ).apply {
                setReferenceCounted(false)
                acquire(10*60*1000L) // 10 minutes timeout for safety
            }
            Log.d(TAG, "✅ Wake lock acquired")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to acquire wake lock", e)
        }
    }
    
    private fun releaseWakeLock() {
        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                    Log.d(TAG, "✅ Wake lock released")
                }
            }
            wakeLock = null
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to release wake lock", e)
        }
    }
    
    private fun startTimer() {
        if (!NotificationPermissionHandler.checkNotificationPermission(applicationContext)) {
            Log.w(TAG, "⚠️ No notification permission - cannot start foreground service")
            return
        }
        
        Log.d(TAG, "✅ Starting persistent timer")
        
        // Start foreground service with persistent notification
        startForeground(NOTIFICATION_ID, createPersistentNotification())
        
        // Cancel existing timer
        timerRunnable?.let { handler.removeCallbacks(it) }
        
        // Initialize timing
        lastTickTime = System.currentTimeMillis()
        if (sessionStartTime == 0L) {
            sessionStartTime = lastTickTime
        }
        
        // Start timer loop
        timerRunnable = object : Runnable {
            override fun run() {
                tick()
                handler.postDelayed(this, UPDATE_INTERVAL)
            }
        }
        handler.post(timerRunnable!!)
        
        broadcastUpdate()
        Log.d(TAG, "✅ Persistent timer started successfully")
    }
    
    private fun pauseTimer() {
        Log.d(TAG, "⏸️ Pausing timer")
        screenTimeManager?.pauseTimer()
        updatePersistentNotification()
    }
    
    private fun stopTimer() {
        Log.d(TAG, "⏹️ Stopping timer")
        timerRunnable?.let {
            handler.removeCallbacks(it)
            timerRunnable = null
        }
        screenTimeManager?.stopTimer()
        saveData()
        stopForeground(true)
        stopSelf()
    }
    
    private fun tick() {
        val currentTime = System.currentTimeMillis()
        val elapsedMs = currentTime - lastTickTime
        val elapsedSeconds = (elapsedMs / 1000).toInt()
        lastTickTime = currentTime
        
        val isScreenOn = powerManager.isInteractive
        val isLocked = keyguardManager.isKeyguardLocked
        
        // Timer should count down when:
        // 1. Screen is ON and device is NOT locked
        // 2. BrainBites app is NOT in foreground (user using other apps)
        // 3. We have remaining time
        val shouldDeductTime = isScreenOn && !isLocked && !isAppInForeground && remainingTimeSeconds > 0
        
        if (shouldDeductTime && elapsedSeconds > 0) {
            // Deduct from remaining time
            remainingTimeSeconds = maxOf(0, remainingTimeSeconds - elapsedSeconds)
            
            // Add to today's screen time usage
            todayScreenTimeSeconds += elapsedSeconds
            
            // Log every 10 seconds
            if (remainingTimeSeconds % 10 == 0) {
                Log.d(TAG, "⏰ Timer: ${formatTime(remainingTimeSeconds)} left, ${formatTime(todayScreenTimeSeconds)} used today")
            }
            
            // Check for warnings
            when (remainingTimeSeconds) {
                300 -> showLowTimeNotification(5) // 5 minutes
                60 -> showLowTimeNotification(1)   // 1 minute
                0 -> handleTimeExpired()
            }
        } else {
            // Log why timer isn't counting (every 10 seconds to avoid spam)
            if (remainingTimeSeconds % 10 == 0 && remainingTimeSeconds > 0) {
                val reason = when {
                    !isScreenOn -> "Screen OFF"
                    isLocked -> "Device LOCKED"
                    isAppInForeground -> "BrainBites FOREGROUND"
                    remainingTimeSeconds <= 0 -> "No TIME remaining"
                    else -> "Unknown reason"
                }
                Log.d(TAG, "⏸️ Timer paused: $reason")
            }
        }
        
        // Update persistent notification every second
        updatePersistentNotification()
        
        // Save data every 5 seconds
        if ((currentTime / 1000) % 5 == 0L) {
            saveData()
        }
        
        // Broadcast state every second
        broadcastUpdate()
    }
    
    private fun handleAppForeground() {
        if (!isAppInForeground) {
            isAppInForeground = true
            Log.d(TAG, "📱 BrainBites entered FOREGROUND - timer paused")
            screenTimeManager?.onAppForeground()
        }
    }
    
    private fun handleAppBackground() {
        if (isAppInForeground) {
            isAppInForeground = false
            Log.d(TAG, "📱 BrainBites moved to BACKGROUND - timer will resume")
            screenTimeManager?.onAppBackground()
            
            // Ensure timer is running if we have time
            if (remainingTimeSeconds > 0 && timerRunnable == null) {
                startTimer()
            }
        }
    }
    
    private fun handleTimeExpired() {
        Log.d(TAG, "⏰ TIME EXPIRED!")
        
        // Show high priority notification
        showTimeExpiredNotification()
        broadcastUpdate()
        
        // Update persistent notification to show "No time remaining"
        updatePersistentNotification()
    }
    
    private fun showLowTimeNotification(minutes: Int) {
        try {
            val notification = NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("⏱️ CaBBy Says: Time Check!")
                .setContentText("Whoa! Only $minutes minute${if (minutes > 1) "s" else ""} left! Time to power up! 🧠✨")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setColor(0xFFFF9F1C.toInt())
                .setLights(0xFFFF9F1C.toInt(), 1000, 1000)
                .build()
                
            notificationManagerCompat.notify(1000 + minutes, notification)
            Log.d(TAG, "⚠️ Sent ${minutes} minute warning notification")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to show low time notification", e)
        }
    }
    
    private fun showTimeExpiredNotification() {
        try {
            val intent = Intent(this, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                this, 0, intent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            val notification = NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("🎯 CaBBy Needs You!")
                .setContentText("Your earned time is up! Come challenge your brain to unlock more! 🌟")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setColor(0xFFFF9F1C.toInt())
                .setLights(0xFFFF9F1C.toInt(), 1000, 1000)
                .build()
                
            notificationManagerCompat.notify(999, notification)
            Log.d(TAG, "🚨 Sent time expired notification")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to show time expired notification", e)
        }
    }
    
    private fun createPersistentNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val timeText = if (remainingTimeSeconds > 0) {
            formatTime(remainingTimeSeconds)
        } else {
            "No time remaining"
        }
        
        val usedTimeText = formatTime(todayScreenTimeSeconds)
        
        val statusText = when {
            remainingTimeSeconds <= 0 -> "Complete quizzes to earn time!"
            isAppInForeground -> "BrainBites Open (Paused)"
            !powerManager.isInteractive -> "Screen Off (Paused)"
            keyguardManager.isKeyguardLocked -> "Device Locked (Paused)"
            else -> "Timer Running"
        }
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_recent_history)
            .setContentTitle("Time left: $timeText")
            .setContentText("$statusText • Screen time today: $usedTimeText")
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSilent(true)
            .setColor(0xFFFF9F1C.toInt())
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("Screen time today: $usedTimeText"))
            .build()
    }
    
    private fun updatePersistentNotification() {
        try {
            val notification = createPersistentNotification()
            notificationManagerCompat.notify(NOTIFICATION_ID, notification)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to update persistent notification", e)
        }
    }
    
    private fun updateRemainingTime(newTime: Int) {
        remainingTimeSeconds = newTime
        saveData()
        Log.d(TAG, "✅ Updated remaining time to ${formatTime(newTime)}")
    }
    
    private fun addTime(seconds: Int) {
        val oldTime = remainingTimeSeconds
        remainingTimeSeconds += seconds
        saveData()
        
        Log.d(TAG, "✅ Added ${formatTime(seconds)}, total: ${formatTime(remainingTimeSeconds)}")
        
        // Start timer if it wasn't running
        if (timerRunnable == null && remainingTimeSeconds > 0) {
            startTimer()
        }
        
        // Update immediately
        updatePersistentNotification()
        broadcastUpdate()
        
        // Notify ScreenTimeManager
        screenTimeManager?.addTimeFromQuiz(seconds / 60) // Convert to minutes
    }
    
    private fun loadSavedData() {
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        val lastSaveDate = sharedPrefs.getString(KEY_LAST_SAVE_DATE, "")
        
        remainingTimeSeconds = sharedPrefs.getInt(KEY_REMAINING_TIME, 0)
        
        // Reset daily screen time if it's a new day
        if (today != lastSaveDate) {
            todayScreenTimeSeconds = 0
            Log.d(TAG, "📅 New day detected - reset daily screen time")
        } else {
            todayScreenTimeSeconds = sharedPrefs.getInt(KEY_TODAY_SCREEN_TIME, 0)
        }
        
        Log.d(TAG, "💾 Loaded: ${formatTime(remainingTimeSeconds)} remaining, ${formatTime(todayScreenTimeSeconds)} used today")
    }
    
    private fun saveData() {
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
        
        sharedPrefs.edit()
            .putInt(KEY_REMAINING_TIME, remainingTimeSeconds)
            .putInt(KEY_TODAY_SCREEN_TIME, todayScreenTimeSeconds)
            .putString(KEY_LAST_SAVE_DATE, today)
            .apply()
    }
    
    private fun broadcastUpdate() {
        val intent = Intent("brainbites_timer_update").apply {
            putExtra("remaining_time", remainingTimeSeconds)
            putExtra("today_screen_time", todayScreenTimeSeconds)
            putExtra("is_app_foreground", isAppInForeground)
            putExtra("is_tracking", !isAppInForeground && powerManager.isInteractive && !keyguardManager.isKeyguardLocked)
        }
        sendBroadcast(intent)
    }
    
    private fun formatTime(seconds: Int): String {
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val secs = seconds % 60
        
        return when {
            hours > 0 -> String.format("%d:%02d:%02d", hours, minutes, secs)
            else -> String.format("%d:%02d", minutes, secs)
        }
    }
}