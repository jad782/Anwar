
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(WidgetBridge, "WidgetBridge",
    CAP_PLUGIN_METHOD(setData, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setConfig, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setTasbeeh, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getState, CAPPluginReturnPromise);
)
