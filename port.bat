@echo off
cd /d "C:\Users\ACER\AppData\Local\Android\Sdk\platform-tools"
adb devices
adb reverse tcp:8000 tcp:8000
pause