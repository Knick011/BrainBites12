package com.brainbites

import android.app.Application
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import com.brainbites.timer.ScreenTimePackage
import com.brainbites.timer.ScreenTimeReceiver
import com.brainbites.timer.ScreenTimeService
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
    private var screenTimeReceiver: ScreenTimeReceiver? = null

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    add(ScreenTimePackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, OpenSourceMergedSoMapping)
        
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            load()
        }

        initializeScreenTimeService()
    }

    private fun initializeScreenTimeService() {
        // Register screen receiver
        screenTimeReceiver = ScreenTimeReceiver()
        registerReceiver(screenTimeReceiver, ScreenTimeReceiver.getIntentFilter())

        // Start service
        val serviceIntent = Intent(this, ScreenTimeService::class.java).apply {
            action = ScreenTimeService.ACTION_START
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    override fun onTerminate() {
        super.onTerminate()
        screenTimeReceiver?.let {
            unregisterReceiver(it)
        }
    }
}
