package com.brainbites.timer

import android.content.Intent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collect

class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val scope = CoroutineScope(Dispatchers.Default + Job())
    private var screenTimeManager: ScreenTimeManager? = null
    private var stateCollectionJob: Job? = null

    init {
        screenTimeManager = ScreenTimeManager.getInstance(reactContext.applicationContext)
        startStateCollection()
    }

    override fun getName() = "ScreenTimeModule"

    private fun startStateCollection() {
        stateCollectionJob = scope.launch {
            screenTimeManager?.timerState?.collect { state ->
                sendEvent("onTimerStateChanged", createTimerStateMap(state))
            }
        }
    }

    private fun createTimerStateMap(state: TimerStatus): WritableMap {
        return Arguments.createMap().apply {
            putString("state", state.state.name)
            putDouble("remainingTime", state.remainingTime.toDouble())
            putDouble("debtTime", state.debtTime.toDouble())
            putBoolean("isInDebtMode", state.isInDebtMode)
            putBoolean("isPaused", state.isPaused)
            putDouble("todayScreenTime", state.todayScreenTime.toDouble())
            putDouble("weeklyScreenTime", state.weeklyScreenTime.toDouble())
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addTimeFromQuiz(minutes: Int, promise: Promise) {
        try {
            screenTimeManager?.addTimeFromQuiz(minutes)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun addTimeFromGoal(hours: Int, promise: Promise) {
        try {
            screenTimeManager?.addTimeFromGoal(hours)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun startTimer(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, ScreenTimeService::class.java).apply {
                action = ScreenTimeService.ACTION_START
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun pauseTimer(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, ScreenTimeService::class.java).apply {
                action = ScreenTimeService.ACTION_PAUSE
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopTimer(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, ScreenTimeService::class.java).apply {
                action = ScreenTimeService.ACTION_STOP
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getTimerState(promise: Promise) {
        try {
            val state = screenTimeManager?.getTimerState()
            if (state != null) {
                promise.resolve(createTimerStateMap(state))
            } else {
                promise.reject("ERROR", "Timer state not available")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        stateCollectionJob?.cancel()
        scope.cancel()
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter
    }
} 